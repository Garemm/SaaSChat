// ── Subscription Controller ──────────────────────────────────────────────────
// Manages which businesses have active subscription access.
// Only admins whose business has tipo_permiso = 1 (manejo de suscriptores) may call these.
const BusinessModel = require('../models/businessModel');

/**
 * GET /admin/subscriptions
 * Returns all businesses with their is_active status.
 */
const list = async (req, res, next) => {
  try {
    const businesses = await BusinessModel.listAll();
    res.json({ success: true, data: businesses });
  } catch (err) { next(err); }
};

/**
 * PUT /admin/subscriptions/:id
 * Body: { is_active: boolean }
 * Toggles the subscription (is_active) status of the given business.
 */
const toggle = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ success: false, error: 'is_active debe ser un booleano' });
    }

    const updated = await BusinessModel.setActive(id, is_active);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
    }

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

module.exports = { list, toggle };
