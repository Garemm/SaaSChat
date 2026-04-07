// ── requireSubscriptionPermission middleware ──────────────────────────────────
// Ensures the authenticated admin belongs to a business that has
// tipo_permiso = 1 (manejo de suscriptores).  Must be placed AFTER requireAuth.
const db = require('../config/database');

const requireSubscriptionPermission = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT b.tipo_permiso
       FROM admins a
       JOIN businesses b ON b.id = a.business_id
       WHERE a.id = $1`,
      [req.adminId]
    );

    if (rows[0]?.tipo_permiso !== 1) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para gestionar suscripciones',
      });
    }

    next();
  } catch (err) { next(err); }
};

module.exports = requireSubscriptionPermission;
