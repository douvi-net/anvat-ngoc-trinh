# PHASE 7 IMPLEMENTED — ADMIN MERCHANT ACCOUNTS

Date: 2026-08-17

## Goal

Manage AVNT Merchant accounts from the existing web admin without manually creating users in Supabase.

## Implemented

### 1. Admin Merchant Accounts page

New route:

- `/admin/merchants`

Capabilities:

- list `super_admin` and `branch_owner` profiles
- create a new `branch_owner`
- assign exactly one active branch
- edit display name
- reassign branch
- lock/unlock branch owner
- generate a new temporary password
- warn when legacy data gives a branch owner 0 or more than 1 active membership
- show Auth email and latest sign-in timestamp when available

`super_admin` accounts are read-only in this screen to avoid accidental privilege changes.

### 2. Server-side account management API

New route:

- `/api/admin/merchant-accounts`

Methods:

- `GET`: list Merchant profiles + active membership + branch + Supabase Auth user
- `POST`: create Supabase Auth user + `merchant_profiles` + `merchant_branch_members`
- `PATCH`: edit branch owner, lock/unlock, reset temporary password

The browser never receives `SUPABASE_SERVICE_ROLE_KEY`.

### 3. Safe create flow

Create sequence:

1. validate active branch
2. generate a strong temporary password server-side
3. create Supabase Auth user
4. create `merchant_profiles` with `global_role = branch_owner`
5. create one active `merchant_branch_members` row

If a database step fails after Auth creation, the API attempts to delete the newly created membership/profile/Auth user so a partial Merchant account is not intentionally left behind.

### 4. Lock / unlock behavior

Lock:

- `merchant_profiles.is_active = false`
- Supabase Auth receives a long `ban_duration`
- active `merchant_devices` for that user are disabled

Unlock:

- `merchant_profiles.is_active = true`
- Auth ban is removed
- old devices are NOT blindly reactivated; Merchant App re-registers the device when the user opens/logs into the app again

### 5. Branch reassignment behavior

When changing a branch owner's branch:

- old active memberships are deactivated
- selected branch membership is activated/created
- old Merchant devices are disabled

The user should close/reopen Merchant App after reassignment so Phase 1 resolves the new active branch and Phase 6 registers FCM against the new branch.

### 6. Admin session hardening

Previous behavior:

- cookie value was simply `avnt_admin_auth=1`

Phase 7:

- cookie is now an HMAC-signed, expiring session token
- `/admin/*` and `/api/admin/*` are checked
- critical Merchant Accounts API also validates the session inside the Route Handler
- still uses the existing `ADMIN_USERNAME` / `ADMIN_PASSWORD` login flow
- optional/recommended env: `ADMIN_SESSION_SECRET`
- if `ADMIN_SESSION_SECRET` is absent, the existing `ADMIN_PASSWORD` is used as the signing-secret fallback to avoid production downtime

After deployment, an old `avnt_admin_auth=1` cookie is intentionally invalid. Log in to `/admin/login` again once.

### 7. Database migration

Migration:

- `supabase/migrations/20260817_phase7_admin_merchant_accounts.sql`

It is additive only:

- validates required Phase 1 tables
- adds indexes for Merchant admin lookups
- writes the phase marker to `avnt_schema_migrations`
- does NOT delete legacy role columns
- does NOT delete existing Merchant accounts

## Validation completed

- TypeScript `tsc --noEmit`: PASS
- ESLint for all Phase 7 changed/new TypeScript files: PASS
- static invariants: PASS
  - no `avnt_admin_auth === 1` authorization remains
  - Merchant creation is fixed to `branch_owner`
  - membership assignment is server-side
  - service-role key is server-only
  - lock/rebranch invalidates old FCM devices
- Next production build was attempted but this runtime cannot download the missing Linux SWC package from `registry.npmjs.org` (`EAI_AGAIN`). This is an environment/network limitation, not a TypeScript failure.

## Required production test

1. Run Phase 7 SQL migration.
2. Deploy Phase 7 web patch.
3. Open `/admin` — old admin cookie should redirect to login once.
4. Log in again using current admin credentials.
5. Open `Hệ thống → Tài khoản Merchant`.
6. Create a test branch owner assigned to Q1.
7. Copy the generated temporary password.
8. Sign into AVNT Merchant with that account.
9. Confirm the app enters Q1 automatically and has no branch switcher.
10. In web admin, reassign that owner to Q6.
11. Close/reopen Merchant App and log in again; it must resolve Q6.
12. Lock the account from web admin.
13. Confirm new login is rejected and that its old Merchant device is inactive for FCM.
14. Unlock, open/login app again, and confirm the device is registered again.
15. Reset password and confirm the new temporary password works for a new login.

## Git workflow

```bash
git add .
git commit -m "feat: add admin merchant account management"
git push origin main
```
