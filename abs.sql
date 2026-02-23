-- Run this in your Supabase SQL editor to set up the schema

-- Alerts table: stores alert rule configurations
create table if not exists alerts (
  id          uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  metric_name text    not null,
  threshold   numeric not null,
  comparator  text    not null check (comparator in ('GT','LT','GTE','LTE','EQ')),
  message     text    not null,
  cooldown_seconds integer default 0,
  last_triggered_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Alert events table: stores triggered alert instances
create table if not exists alert_events (
  id            uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  alert_id      uuid    not null references alerts(id) on delete cascade,
  metric_name   text    not null,
  metric_value  numeric not null,
  timestamp     timestamptz not null default now(),
  alert_message text    not null
);


create table metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  metric_name text not null,
  value numeric not null,
  recorded_at timestamptz not null,
  created_at timestamptz default now()
);

-- Indexes for common query patterns
create index if not exists alerts_metric_name_idx    on alerts       (metric_name);
create index if not exists alert_events_timestamp_idx on alert_events (timestamp desc);
create index if not exists alert_events_metric_idx   on alert_events (metric_name);

-- Optional: enable Row Level Security (open for now, lock down in production)
alter table alerts       enable row level security;
alter table alert_events enable row level security;

create policy "Allow all for anon" on alerts       for all using (true) with check (true);
create policy "Allow all for anon" on alert_events for all using (true) with check (true);