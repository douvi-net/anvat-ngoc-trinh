-- AVNT Merchant - Phase 1
-- Chuyển merchant_profiles.global_role về đúng 2 role:
--   super_admin
--   branch_owner
--
-- Migration an toàn cho production:
-- - KHÔNG xóa merchant_branch_members.branch_role
-- - KHÔNG xóa bảng/cột legacy khác
-- - drop CHECK cũ trước khi UPDATE role

begin;

alter table public.merchant_profiles
    drop constraint if exists merchant_profiles_global_role_check;

update public.merchant_profiles
set global_role = case
    when lower(trim(global_role)) in ('owner', 'admin', 'super_admin')
        then 'super_admin'
    when lower(trim(global_role)) in ('manager', 'staff', 'branch_owner')
        then 'branch_owner'
    else global_role
end,
updated_at = now()
where global_role is not null;

-- Không tự ý map role lạ. Nếu còn dữ liệu ngoài 2 role mới,
-- transaction dừng để người quản trị kiểm tra thay vì sửa sai quyền.
do $$
begin
    if exists (
        select 1
        from public.merchant_profiles
        where global_role is null
           or global_role not in ('super_admin', 'branch_owner')
    ) then
        raise exception
            'merchant_profiles còn global_role không hợp lệ. Chỉ cho phép super_admin hoặc branch_owner.';
    end if;
end
$$;

alter table public.merchant_profiles
    add constraint merchant_profiles_global_role_check
    check (global_role in ('super_admin', 'branch_owner'));

commit;

-- KIỂM TRA SAU MIGRATION
-- 1) Danh sách role:
-- select global_role, count(*)
-- from public.merchant_profiles
-- group by global_role
-- order by global_role;
--
-- 2) branch_owner phải có đúng 1 membership active.
-- App Phase 1 sẽ chặn đăng nhập nếu 0 hoặc >1.
-- select
--     p.user_id,
--     p.display_name,
--     count(m.id) filter (where m.is_active = true) as active_memberships
-- from public.merchant_profiles p
-- left join public.merchant_branch_members m
--     on m.user_id = p.user_id
-- where p.global_role = 'branch_owner'
-- group by p.user_id, p.display_name
-- having count(m.id) filter (where m.is_active = true) <> 1;
