-- ══════════════════════════════════════════════════════════════════════════
-- SaaS Chat - Database Schema
-- Complete database setup for admin backend
-- ══════════════════════════════════════════════════════════════════════════

-- ── 1. Business Types (lookup table) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS business_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

-- Insert default business types
INSERT INTO business_types (name) VALUES
  ('Restaurante'),
  ('Tienda de Ropa'),
  ('Farmacia'),
  ('Ferretería'),
  ('Supermercado'),
  ('Panadería'),
  ('Tecnología'),
  ('Servicios'),
  ('Salud y Belleza'),
  ('Otro')
ON CONFLICT (name) DO NOTHING;

-- ── 2. Businesses (main business entity) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS businesses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category INTEGER REFERENCES business_types(id),
  description TEXT,
  city VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  webpage_link VARCHAR(500),
  is_active BOOLEAN DEFAULT false,
  tipo_permiso INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_email ON businesses(email);
CREATE INDEX IF NOT EXISTS idx_businesses_is_active ON businesses(is_active);

-- ── 3. Admins (user accounts) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_business_id ON admins(business_id);

-- ── 4. Categories (product categories) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(business_id, name)
);

CREATE INDEX IF NOT EXISTS idx_categories_business_id ON categories(business_id);

-- ── 5. Products ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  item_code_empresa VARCHAR(100),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  image_url VARCHAR(500),
  stock INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_item_code ON products(business_id, item_code_empresa);

-- ── 6. Product Attributes (flexible key-value for product properties) ──────
CREATE TABLE IF NOT EXISTS product_attributes (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_attributes_product_id ON product_attributes(product_id);

-- ── 7. Business Services ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS business_services (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  duration_minutes INTEGER,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_services_business_id ON business_services(business_id);

-- ── 8. Promotions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promotions (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  discount_percentage DECIMAL(5,2),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotions_business_id ON promotions(business_id);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON promotions(is_active);

-- ── 9. Business Hours ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS business_hours (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(business_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_business_hours_business_id ON business_hours(business_id);

-- ── 10. Product Query Logs (analytics) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_query_logs (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  query_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_query_logs_business_id ON product_query_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_product_query_logs_product_id ON product_query_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_product_query_logs_created_at ON product_query_logs(created_at);

-- ── 11. Stripe Subscriptions (payment tracking) ────────────────────────────
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_business_id ON stripe_subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customer_id ON stripe_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_status ON stripe_subscriptions(status);

-- Try to add foreign key to businesses if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_business_stripe'
  ) THEN
    ALTER TABLE stripe_subscriptions
    ADD CONSTRAINT fk_business_stripe 
      FOREIGN KEY (business_id) 
      REFERENCES businesses(id) 
      ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add foreign key to businesses table';
END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- DONE! Database schema created successfully
-- ══════════════════════════════════════════════════════════════════════════

-- Verify tables were created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
