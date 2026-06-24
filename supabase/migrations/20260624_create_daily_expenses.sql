-- Daily Expense Tracker
-- Lightweight per-day expense logging with quick natural-language entry.
-- Run this in the Supabase SQL editor (project: svvvquhcmqxznxughuvt).

create table if not exists public.daily_expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  expense_date date not null default current_date,
  amount       numeric not null check (amount >= 0),
  currency     text not null default 'BDT' check (currency in ('BDT', 'USD')),
  category     text not null default 'Other',
  note         text,
  raw_input    text,
  created_at   timestamptz not null default now()
);

create index if not exists daily_expenses_user_id_idx on public.daily_expenses (user_id);
create index if not exists daily_expenses_user_date_idx on public.daily_expenses (user_id, expense_date desc);

-- Row Level Security: users can only see / manage their own expenses.
alter table public.daily_expenses enable row level security;

drop policy if exists "Users can view own daily expenses" on public.daily_expenses;
create policy "Users can view own daily expenses"
  on public.daily_expenses for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own daily expenses" on public.daily_expenses;
create policy "Users can insert own daily expenses"
  on public.daily_expenses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own daily expenses" on public.daily_expenses;
create policy "Users can update own daily expenses"
  on public.daily_expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own daily expenses" on public.daily_expenses;
create policy "Users can delete own daily expenses"
  on public.daily_expenses for delete
  using (auth.uid() = user_id);
