-- ==========================================
-- Supabase Schema Update for Profiles & Assets
-- ==========================================

-- 1. Create Profiles Table (Multi-User Support)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  avatar text,
  color text default '#10b981',
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profile Policies
CREATE POLICY "Users can view their own profiles" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profiles" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profiles" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profiles" ON public.profiles FOR DELETE USING (auth.uid() = user_id);


-- 2. Create Assets Table
CREATE TABLE IF NOT EXISTS public.assets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null,
  current_value numeric not null default 0,
  purchase_value numeric,
  purchase_date date,
  notes text,
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) for Assets
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Asset Policies
CREATE POLICY "Users can view their own assets" ON public.assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own assets" ON public.assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assets" ON public.assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own assets" ON public.assets FOR DELETE USING (auth.uid() = user_id);


-- 3. Update Existing Tables to include Profile Tracking
-- Note: If you already have these tables, you must alter them to add profile_id

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS profile_id uuid references public.profiles(id) on delete set null;
ALTER TABLE public.recurring_expenses ADD COLUMN IF NOT EXISTS profile_id uuid references public.profiles(id) on delete set null;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS profile_id uuid references public.profiles(id) on delete set null;

-- ==========================================
-- Bank & Credit Card Accounts (Phase 8)
-- ==========================================

-- 4. Create Accounts Table
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('bank_account', 'credit_card')),
  balance numeric not null default 0,
  credit_limit numeric,
  billing_day integer check (billing_day >= 1 and billing_day <= 31),
  currency text default 'INR',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Accounts
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Account Policies
CREATE POLICY "Users can view their own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own accounts" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- Update expenses table to link to accounts
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS account_id uuid references public.accounts(id) on delete set null;
