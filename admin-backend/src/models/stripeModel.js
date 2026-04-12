// ── Stripe Model ─────────────────────────────────────────────────────────────
// Database migrations for Stripe subscriptions table
const db = require('../config/database');

/**
 * Creates the stripe_subscriptions table if it doesn't exist
 */
exports.ensureStripeSubscriptionsTable = async () => {
  try {
    // Create table without foreign key first
    await db.query(`
      CREATE TABLE IF NOT EXISTS stripe_subscriptions (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL,
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255) UNIQUE,
        stripe_price_id VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        cancel_at TIMESTAMP,
        cancel_at_period_end BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Backward-compatible migrations for existing installations
    await db.query(`
      ALTER TABLE stripe_subscriptions
      ADD COLUMN IF NOT EXISTS cancel_at TIMESTAMP
    `);

    // Create indexes
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_stripe_business_id 
        ON stripe_subscriptions(business_id);
      
      CREATE INDEX IF NOT EXISTS idx_stripe_customer_id 
        ON stripe_subscriptions(stripe_customer_id);
      
      CREATE INDEX IF NOT EXISTS idx_stripe_status 
        ON stripe_subscriptions(status);
    `);

    // Try to add foreign key if businesses table exists (ignore if it fails)
    try {
      await db.query(`
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
        END $$;
      `);
    } catch (fkError) {
      // Foreign key failed (businesses table might not exist) - that's OK
      console.log('Note: Foreign key to businesses table not created (table may not exist yet)');
    }
    
    console.log('✓ stripe_subscriptions table ensured');
  } catch (error) {
    console.error('Error creating stripe_subscriptions table:', error.message);
    throw error;
  }
};
