// ── Business Model ──────────────────────────────────────────────────────────
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const BusinessModel = {
  /**
   * Inserts a new business row.
   * Generates a unique chat_uuid (UUID v4) for the public chat URL.
   * Returns the created row including the auto-generated id and chat_uuid.
   */
  async create({ name, category, description, city, email, phone, webpage_link }) {
    const chat_uuid = uuidv4();
    const { rows } = await db.query(
      `INSERT INTO businesses (name, category, description, city, email, phone, webpage_link, is_active, chat_uuid)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8)
       RETURNING id, name, category, chat_uuid`,
      [name, category, description, city, email, phone, webpage_link, chat_uuid]
    );
    return rows[0];
  },

  async findByChatUuid(chat_uuid) {
    const { rows } = await db.query(
      `SELECT b.id, b.name, b.category, bt.name AS category_name,
              b.description, b.city, b.email, b.phone, b.webpage_link,
              b.chat_uuid, b.created_at
       FROM businesses b
       LEFT JOIN business_types bt ON bt.id = b.category
       WHERE b.chat_uuid = $1`,
      [chat_uuid]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await db.query(
      `SELECT b.id, b.name, b.category, bt.name AS category_name,
              b.description, b.city, b.email, b.phone, b.webpage_link,
              b.chat_uuid, b.created_at
       FROM businesses b
       LEFT JOIN business_types bt ON bt.id = b.category
       WHERE b.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async update(id, { name, category, description, city, email, phone, webpage_link }) {
    const { rows } = await db.query(
      `UPDATE businesses
       SET name = $1, category = $2, description = $3, city = $4,
           email = $5, phone = $6, webpage_link = $7
       WHERE id = $8
       RETURNING id, name, category, description, city, email, phone, webpage_link`,
      [name, parseInt(category, 10), description, city, email, phone, webpage_link, id]
    );
    if (!rows[0]) return null;
    // Enrich with category_name via second cheap query
    return this.findById(rows[0].id);
  },

  async findByEmail(email) {
    const { rows } = await db.query(
      `SELECT id, name, email FROM businesses WHERE email = $1`,
      [email]
    );
    return rows[0] || null;
  },

  async findAdminByBusinessEmail(email) {
    const { rows } = await db.query(
      `SELECT a.id AS admin_id, a.username, b.email, b.name AS business_name
       FROM businesses b
       JOIN admins a ON a.business_id = b.id
       WHERE b.email = $1
       LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  },

  /** Returns every business — used by the subscription management panel. */
  async listAll() {
    const { rows } = await db.query(
      `SELECT b.id, b.name, b.email, b.category, bt.name AS category_name,
              b.city, b.is_active, b.chat_uuid, b.created_at
       FROM businesses b
       LEFT JOIN business_types bt ON bt.id = b.category
       ORDER BY b.created_at DESC`
    );
    return rows;
  },

  /**
   * Toggles the is_active flag for a business.
   * Returns the updated row, or null if not found.
   */
  async setActive(id, isActive) {
    const { rows } = await db.query(
      `UPDATE businesses
       SET is_active = $1
       WHERE id = $2
       RETURNING id, name, email, category, is_active`,
      [isActive, id]
    );
    return rows[0] || null;
  },
};

module.exports = BusinessModel;
