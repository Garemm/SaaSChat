// ── Admin Backend — Entry Point ────────────────────────────────────────────
// Starts the Express server. All route/middleware wiring lives in src/app.js.
require('dotenv').config();
const app        = require('./src/app');
const AdminModel = require('./src/models/adminModel');
const cron       = require('node-cron');
const db         = require('./src/config/database');

const PORT = process.env.PORT || 4000;

// ── Weekly analytics reset (every Sunday at midnight) ─────────────────────────
// Deletes all product_query_logs so the dashboard shows fresh weekly data.
cron.schedule('0 0 * * 0', async () => {
  try {
    await db.query('DELETE FROM product_query_logs');
    console.log('[Cron] product_query_logs table reset (weekly)');
  } catch (err) {
    console.error('[Cron] Error resetting product_query_logs:', err.message);
  }
}, { timezone: 'America/Mexico_City' });

// Run idempotent DB migrations before accepting connections
AdminModel.ensureMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🛠  Admin API ready on http://localhost:${PORT}  [${process.env.NODE_ENV || 'development'}]`);
    });
  })
  .catch((err) => {
    console.error('❌  Migration failed:', err);
    
    if (err.code === 'ECONNREFUSED') {
      console.error('\n💡 SOLUCIÓN:');
      console.error('   1. Verifica que PostgreSQL esté corriendo');
      console.error('   2. Revisa las credenciales en el archivo .env:');
      console.error('      - DB_HOST (default: localhost)');
      console.error('      - DB_PORT (default: 5432)');
      console.error('      - DB_NAME');
      console.error('      - DB_USER');
      console.error('      - DB_PASSWORD');
      console.error('\n   Valores actuales en .env:');
      console.error(`      DB_HOST: ${process.env.DB_HOST || 'NOT SET'}`);
      console.error(`      DB_NAME: ${process.env.DB_NAME || 'NOT SET'}`);
      console.error(`      DB_USER: ${process.env.DB_USER || 'NOT SET'}`);
    }
    
    process.exit(1);
  });
