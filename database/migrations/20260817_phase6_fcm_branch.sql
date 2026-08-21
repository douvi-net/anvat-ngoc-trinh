-- PHASE 6 - FCM routing theo branch_id
-- An toàn cho production:
-- - Không xóa bảng/cột legacy.
-- - Dọn duplicate fcm_token trước khi tạo UNIQUE index.
-- - Nếu cùng token từng bị ghi ở nhiều branch, tạm deactivate token đó;
--   AVNT Merchant Phase 6 sẽ re-register đúng active_branch_id khi app mở.

begin;

DO $$
BEGIN
  IF to_regclass('public.merchant_devices') IS NULL THEN
    RAISE EXCEPTION 'Missing required table: public.merchant_devices';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'merchant_devices'
      AND column_name = 'fcm_token'
  ) THEN
    RAISE EXCEPTION 'Missing required column: public.merchant_devices.fcm_token';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'merchant_devices'
      AND column_name = 'branch_id'
  ) THEN
    RAISE EXCEPTION 'Missing required column: public.merchant_devices.branch_id';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'merchant_devices'
      AND column_name = 'user_id'
  ) THEN
    RAISE EXCEPTION 'Missing required column: public.merchant_devices.user_id';
  END IF;
END $$;

-- Token từng nằm ở nhiều branch là dữ liệu không đáng tin để route.
-- Tạm khóa trước; app mới sẽ upsert lại row sống theo active branch hiện tại.
WITH conflicted_tokens AS (
  SELECT fcm_token
  FROM public.merchant_devices
  WHERE fcm_token IS NOT NULL
  GROUP BY fcm_token
  HAVING COUNT(DISTINCT branch_id) FILTER (WHERE branch_id IS NOT NULL) > 1
)
UPDATE public.merchant_devices md
SET is_active = false
FROM conflicted_tokens c
WHERE md.fcm_token = c.fcm_token;

-- Dedupe để mỗi FCM token chỉ có đúng một row.
-- Ưu tiên row có branch_id + user_id và đang active.
WITH ranked AS (
  SELECT
    ctid,
    ROW_NUMBER() OVER (
      PARTITION BY fcm_token
      ORDER BY
        (branch_id IS NOT NULL) DESC,
        (user_id IS NOT NULL) DESC,
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

-- Cho Android dùng upsert(... onConflict = "fcm_token") để đổi branch
-- của cùng một thiết bị thay vì tạo row mới ở branch cũ.
CREATE UNIQUE INDEX IF NOT EXISTS uq_merchant_devices_fcm_token
  ON public.merchant_devices (fcm_token);

CREATE INDEX IF NOT EXISTS idx_merchant_devices_branch_active
  ON public.merchant_devices (branch_id, is_active);

commit;
