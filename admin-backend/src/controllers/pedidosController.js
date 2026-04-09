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

/**
 * PUT /admin/orders/:id
 * Body: { aceptado?: boolean, detalle_pedido?: string }
 * Updates the accepted status and/or order detail for one order.
 */
const updateOrder = async (req, res, next) => {
  try {
    const id         = parseInt(req.params.id, 10);
    const businessId = req.businessId;

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, error: 'ID de pedido inválido' });
    }

    const { aceptado, detalle_pedido } = req.body;
    const updates = [];
    const values  = [];
    let   idx     = 1;

    if (typeof aceptado === 'boolean') {
      updates.push(`aceptado = $${idx++}`);
      values.push(aceptado);
    }
    if (detalle_pedido !== undefined && detalle_pedido !== null) {
      updates.push(`detalle_pedido = $${idx++}`);
      values.push(String(detalle_pedido));
    }
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });
    }

    values.push(id, businessId);
    const { rows } = await db.query(
      `UPDATE pedidos
       SET ${updates.join(', ')}
       WHERE id = $${idx++} AND business_id = $${idx}
       RETURNING id, nombre_cliente, telefono, detalle_pedido,
                 hora_recogida, fecha, aceptado, created_at`,
      values
    );

    if (!rows[0]) {
      return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
    }

    res.json({ success: true, order: rows[0] });
  } catch (err) { next(err); }
};

module.exports = { listToday, toggleAceptaPedidos, updateOrder, updateOrder };
