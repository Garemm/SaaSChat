// ── requireSubscriptionPermission middleware ──────────────────────────────────
// Ensures the authenticated admin belongs to a business that has
// can_manage_subscriptions = true.  Must be placed AFTER requireAuth.
const db = require('../config/database');

const requireSubscriptionPermission = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT b.can_manage_subscriptions
       FROM admins a
       JOIN businesses b ON b.id = a.business_id
       WHERE a.id = $1`,
      [req.adminId]
    );

    if (!rows[0]?.can_manage_subscriptions) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para gestionar suscripciones',
      });
    }

    next();
  } catch (err) { next(err); }
};

module.exports = requireSubscriptionPermission;
