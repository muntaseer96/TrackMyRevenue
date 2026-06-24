-- Manageable categories for the daily expense tracker + Hermes agent access.
-- Already applied to project svvvquhcmqxznxughuvt. Kept here for the record.

create table if not exists public.daily_expense_categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  color       text not null default '#6b7280',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists daily_expense_categories_user_idx
  on public.daily_expense_categories (user_id, sort_order);

alter table public.daily_expense_categories enable row level security;

drop policy if exists "Users manage own expense categories" on public.daily_expense_categories;
create policy "Users manage own expense categories"
  on public.daily_expense_categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Hermes agent: full management of THIS FEATURE ONLY (the two daily-expense tables).
-- The hermes_readonly role has BYPASSRLS, so table-level grants are sufficient and
-- nothing else in the database is affected (it stays read-only everywhere else).
grant select, insert, update, delete on public.daily_expenses          to hermes_readonly;
grant select, insert, update, delete on public.daily_expense_categories to hermes_readonly;

-- Default category seed (run once per user; uses the single account on this project).
insert into public.daily_expense_categories (user_id, name, color, sort_order) values
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Food',                '#f59e0b', 10),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Groceries',           '#84cc16', 20),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Eating Out',          '#fb923c', 30),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Tea/Coffee',          '#a16207', 40),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Cigarettes',          '#ef4444', 50),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Transport',           '#3b82f6', 60),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Fuel',                '#0ea5e9', 70),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Travel',              '#6366f1', 80),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Rent',                '#0d9488', 90),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Bills/Utilities',     '#14b8a6', 100),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Mobile/Internet',     '#22d3ee', 110),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Family/Home',         '#10b981', 120),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Repairs/Maintenance', '#64748b', 130),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Shopping',            '#ec4899', 140),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Clothing',            '#f472b6', 150),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Electronics',         '#8b5cf6', 160),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Health/Medical',      '#e11d48', 170),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Personal Care',       '#d946ef', 180),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Education',           '#2563eb', 190),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Entertainment',       '#a855f7', 200),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Kids',                '#fbbf24', 210),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Gifts',               '#fb7185', 220),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Charity/Sadaqah',     '#16a34a', 230),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Tools/Software',      '#7c3aed', 240),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Business',            '#06b6d4', 250),
  ('8623419e-2199-42d3-bc58-fa8fe66444ba', 'Other',               '#6b7280', 999)
on conflict (user_id, name) do nothing;
