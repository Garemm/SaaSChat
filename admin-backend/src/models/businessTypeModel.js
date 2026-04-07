// ── BusinessType Model ────────────────────────────────────────────────────────
const db = require('../config/database');

const BusinessTypeModel = {
  async findAll() {
    const { rows } = await db.query(
      `SELECT id, name FROM business_types ORDER BY id`
    );
    return rows;
  },
};

module.exports = BusinessTypeModel;
