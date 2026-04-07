// ── BusinessType Controller ───────────────────────────────────────────────────
const BusinessTypeModel = require('../models/businessTypeModel');

// GET /admin/business-types  (public — used by Register page)
const list = async (req, res, next) => {
  try {
    const types = await BusinessTypeModel.findAll();
    res.json({ success: true, data: types });
  } catch (err) { next(err); }
};

module.exports = { list };
