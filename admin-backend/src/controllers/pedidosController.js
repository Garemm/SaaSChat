// ── Pedidos Controller ────────────────────────────────────────────────────────
const db = require('../config/database');

/**
 * GET /admin/orders/today
 * Returns today's orders for the authenticated business + current acepto_pedidos flag.
 */
const listToday = async (req, res, next) => {
  try {
    const businessId = req.businessId;

    const [ordersResult, businessResult] = await Promise.all([
      db.query(
        `SELECT id, nombre_cliente, telefono, detalle_pedido,
                hora_recogida, fecha, aceptado, created_at
         FROM pedidos
         WHERE business_id = $1
           AND fecha = CURRENT_DATE
         ORDER BY created_at DESC`,
        [businessId]
      ),
      db.query(
        `SELECT acepto_pedidos FROM businesses WHERE id = $1`,
        [businessId]
      ),
    ]);

    res.json({
      success: true,
      orders: ordersResult.rows,
      acepto_pedidos: businessResult.rows[0]?.acepto_pedidos ?? false,
    });
  } catch (err) { next(err); }
};

/**
 * PUT /admin/business/acepto-pedidos
 * Body: { acepto_pedidos: boolean }
 * Toggles whether this business is currently accepting orders.
 */
const toggleAceptaPedidos = async (req, res, next) => {
  try {
    const businessId   = req.businessId;
    const { acepto_pedidos } = req.body;

    if (typeof acepto_pedidos !== 'boolean') {
      return res.status(400).json({ success: false, error: 'acepto_pedidos debe ser un booleano' });
    }

    const { rows } = await db.query(
      `UPDATE businesses
       SET acepto_pedidos = $1
       WHERE id = $2
       RETURNING acepto_pedidos`,
      [acepto_pedidos, businessId]
    );

    if (!rows[0]) {
      return res.status(404).json({ success: false, error: 'Negocio no encontrado' });
    }

    res.json({ success: true, acepto_pedidos: rows[0].acepto_pedidos });
  } catch (err) { next(err); }
};

module.exports = { listToday, toggleAceptaPedidos };
