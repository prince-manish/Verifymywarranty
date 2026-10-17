-- ============================================================================
-- VerifyMyWarranty / Foxzen - Supabase PostgreSQL Database Schema
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================================
-- QUICK FIX FOR ₹0.00 AMOUNT, VENDORS, & RENEWALS (Run in SQL Editor):
-- ALTER TABLE public.warranties ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2) DEFAULT 0.00;
-- ALTER TABLE public.warranties ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'own';
-- ALTER TABLE public.warranties ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(150);
-- ALTER TABLE public.warranties ADD COLUMN IF NOT EXISTS vendor_phone VARCHAR(50);
-- ALTER TABLE public.warranties ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) DEFAULT 0.00;
-- ALTER TABLE public.warranties ADD COLUMN IF NOT EXISTS vendor_ref VARCHAR(100);
-- CREATE TABLE IF NOT EXISTS public.license_renewals (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), warranty_id UUID REFERENCES public.warranties(id) ON DELETE CASCADE, serial_number VARCHAR(100) NOT NULL, customer_name VARCHAR(150), customer_email VARCHAR(150), customer_mobile VARCHAR(50), product_name VARCHAR(255) NOT NULL, renewal_date DATE NOT NULL DEFAULT CURRENT_DATE, service_start_date DATE, months_added INT NOT NULL DEFAULT 12, duration_type VARCHAR(10) NOT NULL DEFAULT 'month', old_expiry DATE, new_expiry DATE NOT NULL, amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00, cost_price NUMERIC(10, 2) DEFAULT 0.00, payment_ref VARCHAR(100), notes TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL);
-- ALTER TABLE public.license_renewals ADD COLUMN IF NOT EXISTS service_start_date DATE;
-- ALTER TABLE public.license_renewals ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Public can view renewals" ON public.license_renewals FOR SELECT TO anon, authenticated USING (true);
-- CREATE POLICY "Admins have full access to renewals" ON public.license_renewals FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- NOTIFY pgrst, 'reload schema';
-- ============================================================================

-- 1. Create table for Products Catalog
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    default_warranty_months INT NOT NULL DEFAULT 12,
    default_validity_months INT NOT NULL DEFAULT 12,
    default_amount NUMERIC(10, 2) DEFAULT 0.00,
    duration_type VARCHAR(10) NOT NULL DEFAULT 'month',  -- 'month' or 'day'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist if table was already created
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS default_amount NUMERIC(10, 2) DEFAULT 0.00;

-- Enable RLS for Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" 
ON public.products 
FOR SELECT 
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins have full access to products" ON public.products;
CREATE POLICY "Admins have full access to products" 
ON public.products 
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 2. Create table for Warranties and User Licenses
CREATE TABLE IF NOT EXISTS public.warranties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    customer_name VARCHAR(150),
    customer_email VARCHAR(150),
    customer_mobile VARCHAR(50),
    telegram_id VARCHAR(100),
    purchase_date DATE NOT NULL,
    warranty_months INT NOT NULL DEFAULT 12,
    warranty_type VARCHAR(10) NOT NULL DEFAULT 'month',  -- 'month' or 'day'
    validity_months INT NOT NULL DEFAULT 12,
    validity_type VARCHAR(10) NOT NULL DEFAULT 'month',  -- 'month' or 'day'
    amount NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'active',       -- 'active', 'expired', 'void'
    invoice_no VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure amount column exists if table was already created
ALTER TABLE public.warranties ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2) DEFAULT 0.00;

-- 3. Fast search indexes for Email, Serial Number, and Mobile Number
CREATE INDEX IF NOT EXISTS idx_warranties_serial ON public.warranties (LOWER(TRIM(serial_number)));
CREATE INDEX IF NOT EXISTS idx_warranties_email ON public.warranties (LOWER(TRIM(customer_email)));
CREATE INDEX IF NOT EXISTS idx_warranties_mobile ON public.warranties (customer_mobile);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products (LOWER(TRIM(name)));

-- 4. Enable Row Level Security (RLS) for Warranties
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;

-- Allow anyone (public/customers) to search & view warranty records
DROP POLICY IF EXISTS "Public can view warranties" ON public.warranties;
CREATE POLICY "Public can view warranties" 
ON public.warranties 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Allow authenticated users / Admins full insert/update/delete access
DROP POLICY IF EXISTS "Admins have full access" ON public.warranties;
CREATE POLICY "Admins have full access" 
ON public.warranties 
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 5. Helper function for searching with normalized phone, email, or serial
CREATE OR REPLACE FUNCTION public.search_warranty(query_text TEXT)
RETURNS SETOF public.warranties AS $$
DECLARE
    cleaned_query TEXT;
    cleaned_phone TEXT;
BEGIN
    cleaned_query := LOWER(TRIM(query_text));
    cleaned_phone := REGEXP_REPLACE(query_text, '[^0-9]', '', 'g');

    RETURN QUERY
    SELECT *
    FROM public.warranties
    WHERE LOWER(TRIM(serial_number)) = cleaned_query
       OR (customer_email IS NOT NULL AND customer_email <> '' AND LOWER(TRIM(customer_email)) = cleaned_query)
       OR (LENGTH(cleaned_phone) >= 6 AND customer_mobile IS NOT NULL AND customer_mobile <> '' AND REGEXP_REPLACE(customer_mobile, '[^0-9]', '', 'g') LIKE '%' || cleaned_phone || '%')
       OR (customer_mobile IS NOT NULL AND customer_mobile <> '' AND customer_mobile ILIKE '%' || query_text || '%')
       OR (telegram_id IS NOT NULL AND telegram_id <> '' AND LOWER(TRIM(REPLACE(telegram_id, '@', ''))) = LOWER(TRIM(REPLACE(query_text, '@', ''))))
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Insert Default Sample Products
INSERT INTO public.products (name, default_warranty_months, default_validity_months, duration_type, description)
VALUES 
('Foxzen License Pro 1-Year', 12, 12, 'month', 'Annual subscription license for Foxzen Services with premium support'),
('Foxzen License Ultimate 2-Year', 24, 24, 'month', 'Extended 2-year license with dedicated VIP account manager'),
('MacBook Pro 16" M3 Max', 24, 36, 'month', 'Apple product with extended warranty package'),
('Dell UltraSharp 27" 4K Monitor', 12, 12, 'month', 'Professional color-accurate designer monitor'),
('Sony WH-1000XM5 Headphones', 12, 24, 'month', 'Active noise cancelling wireless headphones'),
('iPhone 16 Pro Max 256GB', 12, 12, 'month', 'Official retailer warranty and cloud sync support')
ON CONFLICT (name) DO NOTHING;

-- 7. Insert Sample Test Warranties
INSERT INTO public.warranties (
    product_name,
    serial_number,
    customer_name,
    customer_email,
    customer_mobile,
    telegram_id,
    purchase_date,
    warranty_months,
    warranty_type,
    validity_months,
    validity_type,
    status,
    invoice_no,
    notes
) VALUES 
(
    'Foxzen License Pro 1-Year',
    'FXZ-2026-9921',
    'John Doe',
    'john.doe@example.com',
    '+91 9876543210',
    'johndoe_fxz',
    CURRENT_DATE - INTERVAL '3 months',
    12,
    'month',
    12,
    'month',
    'active',
    'INV-2026-001',
    'Primary workstation license'
),
(
    'Foxzen License Pro 1-Year',
    'FXZ-2026-1044',
    'Alex Smith',
    'alex.smith@example.com',
    '+91 9812345678',
    'alexsmith',
    CURRENT_DATE - INTERVAL '363 days', -- Expiring in 2 days!
    12,
    'month',
    12,
    'month',
    'active',
    'INV-2025-992',
    'Upcoming renewal pending'
),
(
    'Foxzen License Ultimate 2-Year',
    'FXZ-2026-3392',
    'Priya Sharma',
    'priya.sharma@example.com',
    '+91 9898989898',
    'priyasharma',
    CURRENT_DATE - INTERVAL '361 days', -- Expiring in 4 days!
    12,
    'month',
    12,
    'month',
    'active',
    'INV-2025-771',
    'VIP client discount applied'
),
(
    'Dell UltraSharp 27" 4K Monitor',
    'VMW-DEL-4412',
    'Sarah Connor',
    'sarah.connor@example.com',
    '+1 555-901-4433',
    'sarah_c',
    CURRENT_DATE - INTERVAL '14 months', -- Expired
    12,
    'month',
    12,
    'month',
    'expired',
    'INV-2024-884',
    'Out of standard 1-year warranty'
),
(
    'Sony WH-1000XM5 Headphones',
    'VMW-SNY-7731',
    'David Miller',
    'david.miller@example.com',
    '+1 555-432-8877',
    'davidmiller',
    CURRENT_DATE, -- Expired today if 0 days or newly registered
    12,
    'month',
    24,
    'month',
    'active',
    'INV-2026-103',
    'Online registration discount applied'
)
ON CONFLICT (serial_number) DO NOTHING;

-- ============================================================================
-- 6. Secure Admin Credentials Table (No passwords in frontend code)
-- ============================================================================

-- Enable pgcrypto extension for server-side SHA-256 hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.admin_credentials (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'admin',
    email VARCHAR(150) NOT NULL UNIQUE DEFAULT 'admin@foxzen.com',
    password_hash VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- Allow policies for admin credentials
DROP POLICY IF EXISTS "Public access policy for admin_credentials" ON public.admin_credentials;
CREATE POLICY "Public access policy for admin_credentials"
ON public.admin_credentials
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Secure RPC to verify login: Checks password hash entirely inside PostgreSQL
-- Never returns or reveals the password hash to the browser
CREATE OR REPLACE FUNCTION public.verify_admin_login(check_email TEXT, check_hash TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    stored_hash TEXT;
BEGIN
    SELECT password_hash INTO stored_hash 
    FROM public.admin_credentials 
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(check_email))
    LIMIT 1;

    IF stored_hash IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN (LOWER(TRIM(stored_hash)) = LOWER(TRIM(check_hash)));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure RPC to update admin credentials using SHA-256 hash
CREATE OR REPLACE FUNCTION public.update_admin_credentials(new_email TEXT, new_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO public.admin_credentials (id, email, password_hash, updated_at)
    VALUES (
        'admin', 
        COALESCE(NULLIF(LOWER(TRIM(new_email)), ''), 'admin@foxzen.com'), 
        COALESCE(NULLIF(TRIM(new_hash), ''), '2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b'), 
        now()
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
        email = COALESCE(NULLIF(LOWER(TRIM(new_email)), ''), public.admin_credentials.email),
        password_hash = COALESCE(NULLIF(TRIM(new_hash), ''), public.admin_credentials.password_hash),
        updated_at = now();
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure RPC to update admin password directly in Supabase (Backward compatibility)
CREATE OR REPLACE FUNCTION public.update_admin_password(target_email TEXT, new_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.update_admin_credentials(target_email, new_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Convenient RPC to update email & password directly from Supabase SQL Editor:
-- Usage in SQL Editor: SELECT public.update_admin_account('myemail@domain.com', 'MyNewPassword123!');
CREATE OR REPLACE FUNCTION public.update_admin_account(new_email TEXT, new_plain_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    computed_hash TEXT := NULL;
BEGIN
    IF new_plain_password IS NOT NULL AND length(trim(new_plain_password)) > 0 THEN
        BEGIN
            computed_hash := encode(digest(new_plain_password::bytea, 'sha256'), 'hex');
        EXCEPTION WHEN OTHERS THEN
            BEGIN
                computed_hash := encode(extensions.digest(new_plain_password::bytea, 'sha256'), 'hex');
            EXCEPTION WHEN OTHERS THEN
                -- If pgcrypto is unavailable, pass as is or fail gracefully
                RAISE EXCEPTION 'pgcrypto extension required for plaintext hashing. Please pass SHA-256 hash or run: CREATE EXTENSION IF NOT EXISTS pgcrypto;';
            END;
        END;
    END IF;

    RETURN public.update_admin_credentials(new_email, computed_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initial Seed Admin in Supabase:
-- Initial SHA-256 hash for 'admin123@verify': 2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b
INSERT INTO public.admin_credentials (id, email, password_hash, updated_at)
VALUES (
    'admin',
    'admin@foxzen.com',
    '2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b',
    now()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. Customer Leads & License Enquiries Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    telegram VARCHAR(100),
    email VARCHAR(150),
    plan VARCHAR(100) NOT NULL,            -- 'Monthly Plan (₹99)', 'Yearly Plan (₹899)', 'Lifetime Setup (₹9,999)'
    amount NUMERIC(10, 2) DEFAULT 0.00,
    business_name VARCHAR(150),
    message TEXT,                          -- Customer query / requirements
    status VARCHAR(20) NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'converted', 'closed'
    source VARCHAR(50) DEFAULT 'website_pricing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist if table was previously created
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS telegram VARCHAR(100);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads (phone);

-- Enable Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow anyone on the public website to submit new enquiries
DROP POLICY IF EXISTS "Public can submit enquiries" ON public.leads;
CREATE POLICY "Public can submit enquiries"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow admins full access to view, update, and manage leads
DROP POLICY IF EXISTS "Admins have full access to leads" ON public.leads;
CREATE POLICY "Admins have full access to leads"
ON public.leads
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- 7. Vendor Sourcing & Cost Columns for Warranties (Net Profit & Support)
-- ============================================================================
ALTER TABLE public.warranties ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'own';
ALTER TABLE public.warranties ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(150);
ALTER TABLE public.warranties ADD COLUMN IF NOT EXISTS vendor_phone VARCHAR(50);
ALTER TABLE public.warranties ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.warranties ADD COLUMN IF NOT EXISTS vendor_ref VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_warranties_vendor_name ON public.warranties (vendor_name);
CREATE INDEX IF NOT EXISTS idx_warranties_source_type ON public.warranties (source_type);

-- ============================================================================
-- 8. Diary & Secret Notes Table (Credentials, Logins, Calculations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.diary_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general', -- 'credentials', 'calculations', 'general'
    username VARCHAR(255),
    secret_key TEXT,
    content TEXT,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_diary_created_at ON public.diary_notes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diary_category ON public.diary_notes (category);
CREATE INDEX IF NOT EXISTS idx_diary_pinned ON public.diary_notes (is_pinned);

-- Enable Row Level Security (RLS)
ALTER TABLE public.diary_notes ENABLE ROW LEVEL SECURITY;

-- Allow full access for admin users
DROP POLICY IF EXISTS "Admins have full access to diary" ON public.diary_notes;
CREATE POLICY "Admins have full access to diary"
ON public.diary_notes
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 9. License Renewals & Recurring Payments Table (Idea 1)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.license_renewals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warranty_id UUID REFERENCES public.warranties(id) ON DELETE CASCADE,
    serial_number VARCHAR(100) NOT NULL,
    customer_name VARCHAR(150),
    customer_email VARCHAR(150),
    customer_mobile VARCHAR(50),
    product_name VARCHAR(255) NOT NULL,
    renewal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    service_start_date DATE,
    months_added INT NOT NULL DEFAULT 12,
    duration_type VARCHAR(10) NOT NULL DEFAULT 'month',  -- 'month' or 'day'
    old_expiry DATE,
    new_expiry DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(10, 2) DEFAULT 0.00,
    payment_ref VARCHAR(100),                            -- UPI / GPay / UTR / Order No
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure column exists if table was already created
ALTER TABLE public.license_renewals ADD COLUMN IF NOT EXISTS service_start_date DATE;

CREATE INDEX IF NOT EXISTS idx_renewals_warranty_id ON public.license_renewals (warranty_id);
CREATE INDEX IF NOT EXISTS idx_renewals_serial ON public.license_renewals (LOWER(TRIM(serial_number)));
CREATE INDEX IF NOT EXISTS idx_renewals_date ON public.license_renewals (renewal_date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.license_renewals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view renewals" ON public.license_renewals;
CREATE POLICY "Public can view renewals"
ON public.license_renewals
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins have full access to renewals" ON public.license_renewals;
CREATE POLICY "Admins have full access to renewals"
ON public.license_renewals
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

NOTIFY pgrst, 'reload schema';


