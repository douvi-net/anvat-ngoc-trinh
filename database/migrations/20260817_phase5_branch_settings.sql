-- AVNT Merchant / Website - Phase 5
-- Branch-specific operating settings.
-- Safe migration: keeps public.shop_settings for legacy production compatibility.

begin;

create table if not exists public.branch_settings (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  is_open boolean not null default true,
  order_status text not null default 'open',
  open_time text not null default '10:00',
  close_time text not null default '22:00',
  preparation_minutes integer not null default 15,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint branch_settings_branch_unique unique (branch_id),
  constraint branch_settings_order_status_check
    check (order_status in ('open', 'paused', 'closed')),
  constraint branch_settings_preparation_minutes_check
    check (preparation_minutes between 5 and 120),
  constraint branch_settings_open_time_check
    check (open_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  constraint branch_settings_close_time_check
    check (close_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);

create index if not exists idx_branch_settings_branch_id
  on public.branch_settings (branch_id);

-- Seed once. Q6 preserves the current legacy shop_settings state because the
-- public website still uses that row outside the multi-branch beta flow.
with legacy as (
  select
    is_open,
    order_status,
    open_time,
    close_time,
    preparation_minutes
  from public.shop_settings
  order by id
  limit 1
)
insert into public.branch_settings (
  branch_id,
  is_open,
  order_status,
  open_time,
  close_time,
  preparation_minutes
)
select
  b.id,
  case
    when lower(trim(b.code)) = 'q6'
      then coalesce(l.is_open, b.is_open, true)
    else coalesce(b.is_open, true)
  end,
  case
    when lower(trim(b.code)) = 'q6'
      then coalesce(
        nullif(l.order_status, ''),
        case when coalesce(l.is_open, b.is_open, true) then 'open' else 'paused' end
      )
    else case when coalesce(b.is_open, true) then 'open' else 'paused' end
  end,
  coalesce(nullif(l.open_time, ''), '10:00'),
  coalesce(nullif(l.close_time, ''), '22:00'),
  greatest(5, least(120, coalesce(b.preparation_minutes, l.preparation_minutes, 15)))
from public.branches b
left join legacy l on true
on conflict (branch_id) do nothing;

-- branch_settings becomes the source of truth for branch operation state.
-- Keep duplicated columns on branches synchronized because existing Maps and
-- branch-menu code still reads branches.is_open/preparation_minutes.
create or replace function public.avnt_sync_branch_settings_to_branch()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.branches
  set
    is_open = new.is_open,
    preparation_minutes = new.preparation_minutes,
    updated_at = now()
  where id = new.branch_id;

  -- Legacy compatibility: the non-beta production checkout still reads the
  -- single public.shop_settings row as Q6. Only Q6 mirrors back to it.
  if exists (
    select 1
    from public.branches b
    where b.id = new.branch_id
      and lower(trim(b.code)) = 'q6'
  ) then
    update public.shop_settings
    set
      is_open = new.is_open,
      order_status = new.order_status,
      open_time = new.open_time,
      close_time = new.close_time,
      preparation_minutes = new.preparation_minutes,
      updated_at = now()
    where id = (
      select id
      from public.shop_settings
      order by id
      limit 1
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_avnt_sync_branch_settings on public.branch_settings;
create trigger trg_avnt_sync_branch_settings
after insert or update of is_open, order_status, open_time, close_time, preparation_minutes
on public.branch_settings
for each row
execute function public.avnt_sync_branch_settings_to_branch();

-- Apply the seed to duplicated branch fields once as well.
update public.branches b
set
  is_open = bs.is_open,
  preparation_minutes = bs.preparation_minutes,
  updated_at = now()
from public.branch_settings bs
where bs.branch_id = b.id;

-- RLS: Merchant users can only access settings for branches they are allowed
-- to operate. service_role used by the website API bypasses RLS.
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

grant select, insert, update on public.branch_settings to authenticated;

alter table public.branch_settings enable row level security;

drop policy if exists branch_settings_select_merchant on public.branch_settings;
create policy branch_settings_select_merchant
on public.branch_settings
for select
to authenticated
using (public.avnt_merchant_can_access_branch(branch_id));

drop policy if exists branch_settings_insert_merchant on public.branch_settings;
create policy branch_settings_insert_merchant
on public.branch_settings
for insert
to authenticated
with check (public.avnt_merchant_can_access_branch(branch_id));

drop policy if exists branch_settings_update_merchant on public.branch_settings;
create policy branch_settings_update_merchant
on public.branch_settings
for update
to authenticated
using (public.avnt_merchant_can_access_branch(branch_id))
with check (public.avnt_merchant_can_access_branch(branch_id));

commit;
