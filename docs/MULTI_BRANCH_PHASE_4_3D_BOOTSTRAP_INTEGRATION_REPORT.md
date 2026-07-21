# MULTI-BRANCH PHASE 4.3D - BOOTSTRAP INTEGRATION REPORT

Date: 2026-07-21
Status: Updated with minimal-diff race-condition fixes

## Scope
- app/dat-mon-nhanh/page.tsx
- docs/MULTI_BRANCH_PHASE_4_3D_BOOTSTRAP_INTEGRATION_REPORT.md

## What Was Kept Intact
- Bootstrap-first flow with resolveCustomerBranch.
- Legacy customers query fallback flow.
- AbortController in customerPhone effect.
- selectedBranch assignment from bootstrap result when available.
- Production shipping calculation via /api/maps.
- skipBranchPreview behavior to avoid duplicate branch preview fetch.
- No changes to JSX, menu, cart, pricing, coupon, payment, submit payload, or layout.

## Minimal Fixes Applied
1. Updated fetchCustomerFlag to support optional AbortSignal:
- Signature changed to fetchCustomerFlag(phone: string, signal?: AbortSignal).
- Supabase query now binds signal via query.abortSignal(signal) when provided.
- submitOrder still calls fetchCustomerFlag(customerPhone.trim()) without signal.

2. Updated findCustomerByPhone signal usage:
- Calls fetchCustomerFlag(cleanPhone, signal).

3. Fixed loading race condition in aborted branches:
- In all branches checking if (signal?.aborted), removed setCheckingCustomer(false).
- Aborted branch now returns immediately, so only active request controls checkingCustomer lifecycle.

## Verification
- git diff --numstat -- app/dat-mon-nhanh/page.tsx
- git diff -- app/dat-mon-nhanh/page.tsx
- npm run build

## Notes
- This patch intentionally avoids formatting or broad rewrites.
- Line endings were preserved by making only targeted textual edits.
