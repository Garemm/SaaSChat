-- Create webpage_configs table
CREATE TABLE IF NOT EXISTS webpage_configs (
  id SERIAL PRIMARY KEY,
  business_id INT NOT NULL UNIQUE,
  subdomain VARCHAR(255) UNIQUE,
  hero_title VARCHAR(255),
  hero_subtitle TEXT,
  theme_json JSONB DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  chatbot_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- Create webpage_media table
CREATE TABLE IF NOT EXISTS webpage_media (
  id SERIAL PRIMARY KEY,
  business_id INT NOT NULL,
  media_type VARCHAR(50), -- 'image', 'video', 'carousel', etc.
  media_url VARCHAR(500),
  title VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  position INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- Create webpage_notices table
CREATE TABLE IF NOT EXISTS webpage_notices (
  id SERIAL PRIMARY KEY,
  business_id INT NOT NULL,
  title VARCHAR(255),
  content TEXT,
  notice_type VARCHAR(50), -- 'info', 'warning', 'alert', etc.
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_webpage_configs_business_id ON webpage_configs(business_id);
CREATE INDEX idx_webpage_configs_subdomain ON webpage_configs(subdomain);
CREATE INDEX idx_webpage_media_business_id ON webpage_media(business_id);
CREATE INDEX idx_webpage_notices_business_id ON webpage_notices(business_id);
