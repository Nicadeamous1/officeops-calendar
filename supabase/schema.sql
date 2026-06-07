create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  start_date date not null,
  start_time time,
  end_time time,
  status text default 'Scheduled',
  assigned_manager text,
  notes text,
  extra_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.events enable row level security;

create policy "Authenticated users can view events"
on public.events for select
to authenticated
using (true);

create policy "Authenticated users can add events"
on public.events for insert
to authenticated
with check (true);

create policy "Authenticated users can update events"
on public.events for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete events"
on public.events for delete
to authenticated
using (true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

-- Optional sample data. Remove or comment out this block before running if not wanted.
insert into public.events (type, title, start_date, start_time, status, assigned_manager, notes, extra_data)
values
  (
    'Orientation',
    'Orientation: Jordan Lee',
    current_date + 1,
    '09:00',
    'Scheduled',
    'Alex',
    'Bring uniform and onboarding packet.',
    '{"employeeName":"Jordan Lee","position":"Team Member","trainer":"Alex","phone":"555-0101","orientationStatus":"Scheduled"}'
  ),
  (
    'Truck Order',
    'Truck: Main Food Vendor',
    current_date + 2,
    null,
    'Ordered',
    'Morgan',
    'Review substitutions on arrival.',
    '{"vendor":"Main Food Vendor","deliveryWindow":"8:00 AM - 10:00 AM","orderPlaced":true,"invoiceChecked":false,"truckPutAway":false,"truckStatus":"Ordered"}'
  ),
  (
    'VIP Replacement',
    'VIP: Taylor Guest',
    current_date + 3,
    null,
    'Open',
    'Casey',
    'Call before preparing replacement.',
    '{"guestName":"Taylor Guest","contactInfo":"555-0199","originalIssue":"Incorrect entree","replacementItem":"Dinner replacement","vipStatus":"Open"}'
  );
