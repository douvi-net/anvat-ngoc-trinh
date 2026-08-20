-- AVNT Website Maintenance Mode
-- 2026-08-19
-- Có thể chạy nhiều lần an toàn.

alter table public.shop_settings
  add column if not exists maintenance_enabled boolean not null default false,
  add column if not exists maintenance_disable_checkout boolean not null default false,
  add column if not exists maintenance_title text not null default 'Website đang được cập nhật',
  add column if not exists maintenance_message text not null default 'Hệ thống đặt món trực tuyến đang được bảo trì để nâng cấp trải nghiệm. Trong thời gian này, bạn có thể đặt món nhanh qua Zalo của từng chi nhánh.',
  add column if not exists maintenance_zalo_q1 text not null default '0392968034',
  add column if not exists maintenance_zalo_q6 text not null default '0392496220';

-- Giữ mặc định an toàn: sau migration website chưa tự bật bảo trì.
update public.shop_settings
set
  maintenance_title = coalesce(nullif(trim(maintenance_title), ''), 'Website đang được cập nhật'),
  maintenance_message = coalesce(
    nullif(trim(maintenance_message), ''),
    'Hệ thống đặt món trực tuyến đang được bảo trì để nâng cấp trải nghiệm. Trong thời gian này, bạn có thể đặt món nhanh qua Zalo của từng chi nhánh.'
  ),
  maintenance_zalo_q1 = coalesce(nullif(trim(maintenance_zalo_q1), ''), '0392968034'),
  maintenance_zalo_q6 = coalesce(nullif(trim(maintenance_zalo_q6), ''), '0392496220')
where id = 1;

select
  id,
  maintenance_enabled,
  maintenance_disable_checkout,
  maintenance_title,
  maintenance_zalo_q1,
  maintenance_zalo_q6
from public.shop_settings
where id = 1;
