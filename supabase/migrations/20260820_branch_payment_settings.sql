-- AVNT PHASE 5.1 - Branch Payment Settings
-- 2026-08-20

alter table public.branch_settings
  add column if not exists payment_enabled boolean not null default true,
  add column if not exists payment_qr_url text,
  add column if not exists payment_bank_name text,
  add column if not exists payment_account_name text,
  add column if not exists payment_account_number text,
  add column if not exists payment_note text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'branch-payment-qr',
  'branch-payment-qr',
  true,
  5242880,
  array['image/png','image/jpeg','image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Giữ QR legacy cho Q6 nếu Q6 chưa cấu hình riêng.
-- Không gán QR này cho Q1 hay chi nhánh khác.
update public.branch_settings bs
set payment_qr_url = '/images/payment-qr.jpg'
from public.branches b
where b.id = bs.branch_id
  and lower(trim(b.code)) = 'q6'
  and nullif(trim(coalesce(bs.payment_qr_url, '')), '') is null;

select
  b.code,
  b.short_name,
  bs.payment_enabled,
  bs.payment_qr_url,
  bs.payment_bank_name,
  bs.payment_account_number,
  bs.payment_account_name
from public.branches b
left join public.branch_settings bs on bs.branch_id = b.id
where b.is_active = true
order by b.sort_order, b.code;
