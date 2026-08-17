-- ============================================================
-- AVNT MULTI-BRANCH - PHASE 7
-- Admin Merchant Accounts hardening / indexes
-- Date: 2026-08-17
--
-- This migration is intentionally additive and safe for production.
-- It does NOT delete legacy branch_role/global_role columns.
-- ============================================================

begin;

-- Fail early when Phase 1 tables are missing instead of partially applying.
do $$
begin
  if to_regclass('public.merchant_profiles') is null then
    raise exception 'Missing required table: public.merchant_profiles';
  end if;

  if to_regclass('public.merchant_branch_members') is null then
    raise exception 'Missing required table: public.merchant_branch_members';
  end if;

  if to_regclass('public.branches') is null then
    raise exception 'Missing required table: public.branches';
  end if;
end $$;

-- Admin list / login verification paths.
create index if not exists idx_merchant_profiles_role_active
  on public.merchant_profiles (global_role, is_active);

create index if not exists idx_merchant_branch_members_user_active
  on public.merchant_branch_members (user_id, is_active);

create index if not exists idx_merchant_branch_members_branch_active
  on public.merchant_branch_members (branch_id, is_active);

-- Keep duplicate legacy rows visible rather than deleting production data here.
-- The Phase 7 API always deactivates previous active memberships before
-- activating the selected branch, so branch_owner converges to exactly one
-- active membership without destructive cleanup.

-- Optional migration ledger used by earlier multi-branch phases.
create table if not exists public.avnt_schema_migrations (
  migration_key text primary key,
  applied_at timestamptz not null default now()
);

insert into public.avnt_schema_migrations (migration_key)
values ('phase7_admin_merchant_accounts_20260817')
on conflict (migration_key) do nothing;

commit;
