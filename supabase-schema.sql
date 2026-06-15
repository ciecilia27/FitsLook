-- Fit You / Fit Look Database Schema
-- Run this in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- ── User Profiles ──
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  height NUMERIC,          -- cm
  weight NUMERIC,          -- kg
  chest NUMERIC,           -- cm
  waist NUMERIC,           -- cm
  hip NUMERIC,             -- cm
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Shopee Click Tracking ──
CREATE TABLE IF NOT EXISTS shopee_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  product_name TEXT,
  shopee_url TEXT,
  user_ip TEXT,
  source TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── User Feedback ──
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Subscriptions ──
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'premium')),
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security Policies ──

ALTER TABLE shopee_clicks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous insert" ON shopee_clicks;
CREATE POLICY "Allow anonymous insert" ON shopee_clicks FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon read" ON shopee_clicks;
CREATE POLICY "Allow anon read" ON shopee_clicks FOR SELECT USING (true);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous insert" ON feedback;
CREATE POLICY "Allow anonymous insert" ON feedback FOR INSERT WITH CHECK (true);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon insert" ON profiles;
CREATE POLICY "Allow anon insert" ON profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon read" ON profiles;
CREATE POLICY "Allow anon read" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon update" ON profiles;
CREATE POLICY "Allow anon update" ON profiles FOR UPDATE USING (true);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access to subscriptions" ON subscriptions;
CREATE POLICY "Service role full access to subscriptions" ON subscriptions FOR ALL USING (true);

-- ── Updated_at trigger for profiles ──
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
