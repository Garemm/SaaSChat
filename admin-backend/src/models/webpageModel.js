// ── Webpage Model ───────────────────────────────────────────────────────────
import db from '../config/database.js';

class WebpageModel {
  // ─ Config ────────────────────────────────────────────────────────────────
  static async findConfigByBusiness(businessId) {
    try {
      const result = await db.query(
        `SELECT * FROM webpage_configs WHERE business_id = $1 LIMIT 1`,
        [businessId]
      );
      return result.rows[0] || null;
    } catch (err) {
      console.error('Error fetching webpage config:', err);
      throw err;
    }
  }

  static async findConfigBySubdomain(subdomain) {
    try {
      const result = await db.query(
        `SELECT * FROM webpage_configs WHERE subdomain = $1 LIMIT 1`,
        [subdomain]
      );
      return result.rows[0] || null;
    } catch (err) {
      console.error('Error fetching config by subdomain:', err);
      throw err;
    }
  }

  static async updateConfig(businessId, data) {
    try {
      const {
        subdomain,
        hero_title,
        hero_subtitle,
        theme_json,
        is_published,
        chatbot_url,
      } = data;

      const result = await db.query(
        `INSERT INTO webpage_configs 
         (business_id, subdomain, hero_title, hero_subtitle, theme_json, is_published, chatbot_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (business_id) DO UPDATE SET
           subdomain = $2,
           hero_title = $3,
           hero_subtitle = $4,
           theme_json = $5,
           is_published = $6,
           chatbot_url = $7,
           updated_at = NOW()
         RETURNING *`,
        [businessId, subdomain, hero_title, hero_subtitle, theme_json, is_published, chatbot_url]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error updating webpage config:', err);
      throw err;
    }
  }

  // ─ Media ─────────────────────────────────────────────────────────────────
  static async listMedia(businessId) {
    try {
      const result = await db.query(
        `SELECT * FROM webpage_media WHERE business_id = $1 ORDER BY position ASC`,
        [businessId]
      );
      return result.rows;
    } catch (err) {
      console.error('Error listing media:', err);
      throw err;
    }
  }

  static async createMedia(businessId, data) {
    try {
      const { media_type, media_url, title, description, is_active, position } = data;
      const result = await db.query(
        `INSERT INTO webpage_media (business_id, media_type, media_url, title, description, is_active, position)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [businessId, media_type, media_url, title, description, is_active || true, position || 0]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error creating media:', err);
      throw err;
    }
  }

  static async updateMedia(mediaId, data) {
    try {
      const { title, description, media_url, is_active, position } = data;
      const result = await db.query(
        `UPDATE webpage_media 
         SET title = $1, description = $2, media_url = $3, is_active = $4, position = $5, updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [title, description, media_url, is_active, position, mediaId]
      );
      return result.rows[0] || null;
    } catch (err) {
      console.error('Error updating media:', err);
      throw err;
    }
  }

  static async removeMedia(mediaId) {
    try {
      const result = await db.query(
        `DELETE FROM webpage_media WHERE id = $1`,
        [mediaId]
      );
      return result.rowCount > 0;
    } catch (err) {
      console.error('Error removing media:', err);
      throw err;
    }
  }

  // ─ Notices ───────────────────────────────────────────────────────────────
  static async listNotices(businessId) {
    try {
      const result = await db.query(
        `SELECT * FROM webpage_notices WHERE business_id = $1 ORDER BY created_at DESC`,
        [businessId]
      );
      return result.rows;
    } catch (err) {
      console.error('Error listing notices:', err);
      throw err;
    }
  }

  static async createNotice(businessId, data) {
    try {
      const { title, content, notice_type, is_active, starts_at, ends_at } = data;
      const result = await db.query(
        `INSERT INTO webpage_notices (business_id, title, content, notice_type, is_active, starts_at, ends_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [businessId, title, content, notice_type || 'info', is_active || true, starts_at, ends_at]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error creating notice:', err);
      throw err;
    }
  }

  static async updateNotice(noticeId, data) {
    try {
      const { title, content, notice_type, is_active, starts_at, ends_at } = data;
      const result = await db.query(
        `UPDATE webpage_notices 
         SET title = $1, content = $2, notice_type = $3, is_active = $4, starts_at = $5, ends_at = $6, updated_at = NOW()
         WHERE id = $7
         RETURNING *`,
        [title, content, notice_type, is_active, starts_at, ends_at, noticeId]
      );
      return result.rows[0] || null;
    } catch (err) {
      console.error('Error updating notice:', err);
      throw err;
    }
  }

  static async removeNotice(noticeId) {
    try {
      const result = await db.query(
        `DELETE FROM webpage_notices WHERE id = $1`,
        [noticeId]
      );
      return result.rowCount > 0;
    } catch (err) {
      console.error('Error removing notice:', err);
      throw err;
    }
  }
}

export default WebpageModel;
