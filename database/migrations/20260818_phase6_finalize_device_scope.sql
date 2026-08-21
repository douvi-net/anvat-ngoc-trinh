-- PHASE 6 FINALIZE - Merchant device scope + legacy cleanup
-- Date: 2026-08-18
-- Safe rollout goals:
-- 1) Remove old FCM rows that cannot be routed by branch.
-- 2) Keep one row per FCM token for upsert(onConflict = "fcm_token").
-- 3) Prevent future ACTIVE devices from existing without user_id/branch_id.
--
-- Run this AFTER the Phase 6 app is ready to install/reopen on Merchant devices.
-- Devices will re-register their current FCM token automatically on app startup.

begin;

DO $$
BEGIN
  IF to_regclass('public.merchant_devices') IS NULL THEN
    RAISE EXCEPTION 'Missing required table: public.merchant_devices';
  END IF;
END $$;

-- Legacy rows cannot be routed safely to a branch. They are safe to delete:
-- Firebase will provide/reuse the device token and the Phase 6 app will upsert
-- it again with the authenticated user_id + active_branch_id.
DELETE FROM public.merchant_devices
WHERE user_id IS NULL
   OR branch_id IS NULL
   OR fcm_token IS NULL
   OR btrim(fcm_token) = '';

-- Dedupe again in case the old app created duplicates before this migration.
WITH ranked AS (
  SELECT
    ctid,
    ROW_NUMBER() OVER (
      PARTITION BY fcm_token
      ORDER BY
        (is_active IS TRUE) DESC,
        ctid DESC
    ) AS rn
  FROM public.merchant_devices
  WHERE fcm_token IS NOT NULL
)
DELETE FROM public.merchant_devices md
USING ranked r
WHERE md.ctid = r.ctid
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_merchant_devices_fcm_token
  ON public.merchant_devices (fcm_token);

CREATE INDEX IF NOT EXISTS idx_merchant_devices_branch_active
  ON public.merchant_devices (branch_id, is_active);

-- Active notification devices must always have a user and branch scope.
-- Inactive legacy rows are still allowed if any exist for audit/history.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'merchant_devices_active_scope_check'
      AND conrelid = 'public.merchant_devices'::regclass
  ) THEN
    ALTER TABLE public.merchant_devices
      ADD CONSTRAINT merchant_devices_active_scope_check
      CHECK (
        is_active IS NOT TRUE
        OR (user_id IS NOT NULL AND branch_id IS NOT NULL)
      ) NOT VALID;
  END IF;
END $$;

ALTER TABLE public.merchant_devices
  VALIDATE CONSTRAINT merchant_devices_active_scope_check;

commit;
