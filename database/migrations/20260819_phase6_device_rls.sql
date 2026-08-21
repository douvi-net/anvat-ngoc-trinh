-- PHASE 6 STABILITY - allow authenticated Merchant users to manage their own FCM device rows
-- Additive and branch-safe. Does not expose device rows to other Merchant users.

begin;

alter table public.merchant_devices enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'merchant_devices'
      and policyname = 'Merchant reads own devices'
  ) then
    create policy "Merchant reads own devices"
      on public.merchant_devices
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'merchant_devices'
      and policyname = 'Merchant inserts own devices'
  ) then
    create policy "Merchant inserts own devices"
      on public.merchant_devices
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'merchant_devices'
      and policyname = 'Merchant updates own devices'
  ) then
    create policy "Merchant updates own devices"
      on public.merchant_devices
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;

commit;
