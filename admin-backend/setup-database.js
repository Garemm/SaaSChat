// ── Database Setup Script ─────────────────────────────────────────────────────
// Connects to PostgreSQL and creates all required tables
require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function setupDatabase() {
  console.log('🔌 Connecting to database...');
  console.log(`   Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   User: ${process.env.DB_USER}`);
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected successfully!\n');
    
    // Read SQL file
    const sql = fs.readFileSync('./database-schema.sql', 'utf8');
    
    console.log('📋 Creating tables...\n');
    
    // Execute SQL
    await client.query(sql);
    
    console.log('\n✅ All tables created successfully!');
    
    // Show created tables
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('\n📊 Tables in database:');
    result.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.error('\nFull error:', error);
    await pool.end();
    process.exit(1);
  }
}

setupDatabase();
