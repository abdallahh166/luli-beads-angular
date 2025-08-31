-- ========================================
-- FIXED SUPABASE SCHEMA WITHOUT CIRCULAR DEPENDENCIES
-- ========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- PROFILES TABLE (Linked to Supabase Auth)
-- ========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- PRODUCTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  original_price DECIMAL(10,2) CHECK (original_price >= 0),
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  handle_types TEXT[] DEFAULT '{}',
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT true,
  is_bestseller BOOLEAN DEFAULT false,
  customizable BOOLEAN DEFAULT true,
  category_id TEXT DEFAULT 'handbag',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- PRODUCT CATEGORIES
-- ========================================
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- CART ITEMS
-- ========================================
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  selected_color TEXT,
  selected_handle TEXT,
  custom_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id, selected_color, selected_handle, custom_name)
);

-- ========================================
-- ORDERS
-- ========================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
  shipping_amount DECIMAL(10,2) DEFAULT 0 CHECK (shipping_amount >= 0),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_intent_id TEXT,
  billing_address JSONB,
  shipping_address JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ORDER ITEMS
-- ========================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  selected_color TEXT,
  selected_handle TEXT,
  custom_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- WISHLIST
-- ========================================
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ========================================
-- ADMIN ACTIVITY LOG
-- ========================================
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- SYSTEM SETTINGS
-- ========================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ENABLE RLS ON ALL TABLES
-- ========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- ========================================
-- FIXED RLS POLICIES (NO CIRCULAR DEPENDENCIES)
-- ========================================

-- PROFILES POLICIES (SIMPLIFIED - NO ADMIN CHECKS ON PROFILES ITSELF)
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- PRODUCTS POLICIES (PUBLIC READ, ADMIN MANAGEMENT VIA SERVICE ROLE)
CREATE POLICY "Products are viewable by everyone" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert products" ON public.products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update products" ON public.products
    FOR UPDATE USING (auth.role() = 'authenticated');

-- CART ITEMS POLICIES
CREATE POLICY "Users can manage own cart items" ON public.cart_items
    FOR ALL USING (auth.uid() = user_id);

-- WISHLIST POLICIES
CREATE POLICY "Users can manage own wishlist" ON public.wishlist
    FOR ALL USING (auth.uid() = user_id);

-- ORDERS POLICIES
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id);

-- ORDER ITEMS POLICIES
CREATE POLICY "Users can view order items of own orders" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_id AND o.user_id = auth.uid()
        )
    );

-- ADMIN ACTIVITY LOG POLICIES
CREATE POLICY "Authenticated users can insert activity log" ON public.admin_activity_log
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view activity log" ON public.admin_activity_log
    FOR SELECT USING (auth.role() = 'authenticated');

-- SYSTEM SETTINGS POLICIES
CREATE POLICY "Authenticated users can manage system settings" ON public.system_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- ========================================
-- DEFAULT DATA
-- ========================================
INSERT INTO public.product_categories (name, description) VALUES
    ('handbag', 'Elegant handbags for everyday use'),
    ('clutch', 'Stylish clutches for special occasions'),
    ('crossbody', 'Convenient crossbody bags'),
    ('tote', 'Spacious tote bags'),
    ('backpack', 'Functional backpack bags')
ON CONFLICT (name) DO NOTHING;

-- Default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
    ('site_name', '"Luli Beads Atelier"', 'Site name displayed in header'),
    ('contact_email', '"contact@lulibeads.com"', 'Contact email for customer inquiries'),
    ('shipping_free_threshold', '200', 'Free shipping threshold in USD'),
    ('tax_rate', '0.08', 'Tax rate as decimal (8%)'),
    ('low_stock_threshold', '5', 'Low stock alert threshold'),
    ('max_cart_quantity', '10', 'Maximum quantity per cart item'),
    ('order_number_prefix', '"LBA-"', 'Prefix for order numbers')
ON CONFLICT (setting_key) DO NOTHING;

-- Sample products
INSERT INTO public.products (name, description, price, original_price, image_url, images, colors, handle_types, in_stock, stock_quantity, featured, is_new, is_bestseller, category_id) VALUES
    ('Elegant Rose Gold Beaded Handbag', 'Handcrafted luxury beaded handbag with premium rose gold beads and elegant finishing', 299.99, 399.99, '/assets/product-rose-bag.jpg', ARRAY['/assets/product-rose-bag.jpg'], ARRAY['Rose Gold', 'Cream'], ARRAY['Chain', 'Leather'], true, 15, true, true, true, 'handbag'),
    ('Classic Black Beaded Clutch', 'Sophisticated black beaded clutch perfect for evening events', 199.99, NULL, '/assets/product-black-bag.jpg', ARRAY['/assets/product-black-bag.jpg'], ARRAY['Black', 'Silver'], ARRAY['Chain', 'Beaded'], true, 10, false, false, false, 'clutch'),
    ('Modern Crossbody Bag', 'Contemporary crossbody bag with adjustable strap and multiple compartments', 149.99, 179.99, '/assets/product-crossbody.jpg', ARRAY['/assets/product-crossbody.jpg'], ARRAY['Navy', 'Red'], ARRAY['Adjustable Strap'], true, 8, true, true, false, 'crossbody')
ON CONFLICT DO NOTHING;
