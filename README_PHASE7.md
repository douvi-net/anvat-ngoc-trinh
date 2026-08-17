# AVNT Web — Phase 7 Admin Merchant Accounts

## Copy these files into the current website project

- `app/admin/merchants/page.tsx`
- `app/api/admin/merchant-accounts/route.ts`
- `app/api/admin/login/route.ts`
- `app/api/admin/logout/route.ts`
- `components/AdminLayout.tsx`
- `lib/adminSession.ts`
- `middleware.ts`
- `supabase/migrations/20260817_phase7_admin_merchant_accounts.sql`

## Environment

Existing variables remain required:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Recommended new Vercel variable:

- `ADMIN_SESSION_SECRET` — long random value, ideally 32+ bytes/characters

Phase 7 will fall back to `ADMIN_PASSWORD` for session signing if this new variable is not configured yet, so deployment does not have to block on it.

## Deployment order

1. Run `20260817_phase7_admin_merchant_accounts.sql` in Supabase SQL Editor.
2. Copy the patch files.
3. Optionally add `ADMIN_SESSION_SECRET` in Vercel.
4. Deploy website.
5. Log into `/admin/login` again because the old plain cookie is no longer accepted.
6. Test `/admin/merchants` using the checklist in `PHASE7_IMPLEMENTED.md`.
