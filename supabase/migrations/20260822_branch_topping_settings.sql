-- AVNT Merchant 3.1 - Branch Topping Settings
-- Topping tạm hết/không bán độc lập theo từng chi nhánh.

begin;

create table if not exists public.branch_topping_settings (
    branch_id uuid not null references public.branches(id) on delete cascade,
    topping_id uuid not null references public.toppings(id) on delete cascade,
    is_available boolean not null default true,
    is_sold_out boolean not null default false,
    sort_order bigint,
    updated_at timestamptz not null default now(),
    primary key (branch_id, topping_id)
);

create index if not exists idx_branch_topping_settings_branch
    on public.branch_topping_settings(branch_id);

create index if not exists idx_branch_topping_settings_topping
    on public.branch_topping_settings(topping_id);

-- Giữ trạng thái hiện tại: topping global đang active sẽ được bán ở mọi branch active.
insert into public.branch_topping_settings (
    branch_id, topping_id, is_available, is_sold_out, sort_order, updated_at
)
select
    b.id,
    t.id,
    t.is_active,
    false,
    t.sort_order,
    now()
from public.branches b
cross join public.toppings t
where b.is_active = true
on conflict (branch_id, topping_id) do nothing;

-- Helper quyền branch đã có từ Phase 5, khai báo lại để migration độc lập/idempotent.
create or replace function public.avnt_merchant_can_access_branch(target_branch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.merchant_profiles mp
    where mp.user_id = auth.uid()
      and mp.is_active = true
      and (
        mp.global_role = 'super_admin'
        or (
          mp.global_role = 'branch_owner'
          and exists (
            select 1
            from public.merchant_branch_members mbm
            where mbm.user_id = auth.uid()
              and mbm.branch_id = target_branch_id
              and mbm.is_active = true
          )
        )
      )
  );
$$;

revoke all on function public.avnt_merchant_can_access_branch(uuid) from public;
grant execute on function public.avnt_merchant_can_access_branch(uuid) to authenticated;

grant select, insert, update on public.branch_topping_settings to authenticated;

alter table public.branch_topping_settings enable row level security;

drop policy if exists branch_topping_settings_select_merchant
  on public.branch_topping_settings;
create policy branch_topping_settings_select_merchant
  on public.branch_topping_settings
  for select
  to authenticated
  using (public.avnt_merchant_can_access_branch(branch_id));

drop policy if exists branch_topping_settings_insert_merchant
  on public.branch_topping_settings;
create policy branch_topping_settings_insert_merchant
  on public.branch_topping_settings
  for insert
  to authenticated
  with check (public.avnt_merchant_can_access_branch(branch_id));

drop policy if exists branch_topping_settings_update_merchant
  on public.branch_topping_settings;
create policy branch_topping_settings_update_merchant
  on public.branch_topping_settings
  for update
  to authenticated
  using (public.avnt_merchant_can_access_branch(branch_id))
  with check (public.avnt_merchant_can_access_branch(branch_id));

commit;

select
    b.code as branch_code,
    count(*) as topping_settings
from public.branch_topping_settings bts
join public.branches b on b.id = bts.branch_id
group by b.code
order by b.code;
