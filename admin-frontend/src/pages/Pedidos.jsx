import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon        from '../components/ui/Icon';
import Spinner     from '../components/ui/Spinner';
import { useToast } from '../context/ToastContext';
import { getTodaysOrders, setAceptaPedidos } from '../services/api';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ── ToggleSwitch ──────────────────────────────────────────────────────────────
const ToggleSwitch = ({ checked, onChange, disabled, label }) => (
  <label className="orders__toggle-wrap" aria-label={label}>
    <span className="orders__toggle-label">{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`orders__toggle${checked ? ' orders__toggle--on' : ''}`}
    >
      <motion.span
        className="orders__toggle-thumb"
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      />
    </button>
  </label>
);

// ── StatusBadge ───────────────────────────────────────────────────────────────
const StatusBadge = ({ aceptado }) => (
  <span className={`orders__badge orders__badge--${aceptado ? 'accepted' : 'pending'}`}>
    {aceptado ? 'Aceptado' : 'Pendiente'}
  </span>
);

// ── Row variants ──────────────────────────────────────────────────────────────
const rowVariants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8,  transition: { duration: 0.15 } },
};

// ── Component ─────────────────────────────────────────────────────────────────
const REFRESH_INTERVAL = 30_000; // 30 seconds

export default function Pedidos() {
  const { showToast } = useToast();

  const [orders,        setOrders]        = useState([]);
  const [aceptaPedidos, setAceptaPedidosState] = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [toggling,      setToggling]      = useState(false);
  const [search,        setSearch]        = useState('');
  const [lastFetched,   setLastFetched]   = useState(null);

  const intervalRef = useRef(null);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getTodaysOrders();
      setOrders(data.orders ?? []);
      setAceptaPedidosState(data.acepto_pedidos ?? false);
      setLastFetched(new Date());
    } catch (err) {
      if (!silent) showToast(err.message || 'Error al cargar pedidos', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [showToast]);

  // initial load + polling
  useEffect(() => {
    fetchOrders();
    intervalRef.current = setInterval(() => fetchOrders(true), REFRESH_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchOrders]);

  const handleToggleAceptaPedidos = async (value) => {
    setToggling(true);
    try {
      await setAceptaPedidos(value);
      setAceptaPedidosState(value);
      showToast(
        value ? 'Ahora estás aceptando pedidos' : 'Ya no estás aceptando pedidos',
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Error al actualizar', 'error');
    } finally {
      setToggling(false);
    }
  };

  // ── filtered list ─────────────────────────────────────────────────────────
  const filtered = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (o.nombre_cliente || '').toLowerCase().includes(q) ||
      (o.telefono       || '').toLowerCase().includes(q) ||
      (o.detalle_pedido || '').toLowerCase().includes(q)
    );
  });

  // ── stats ─────────────────────────────────────────────────────────────────
  const totalHoy    = orders.length;
  const aceptados   = orders.filter((o) => o.aceptado).length;
  const pendientes  = totalHoy - aceptados;

  return (
    <section className="orders">
      {/* ── Header ── */}
      <div className="orders__header">
        <div className="orders__header-left">
          <h1 className="orders__title">
            <Icon name="orders" size={22} className="orders__title-icon" />
            Pedidos de hoy
          </h1>
          {lastFetched && (
            <span className="orders__last-refresh">
              Actualizado: {fmtTime(lastFetched.toISOString())}
            </span>
          )}
        </div>

        <div className="orders__header-right">
          {/* Acepto pedidos toggle */}
          <ToggleSwitch
            checked={aceptaPedidos}
            onChange={handleToggleAceptaPedidos}
            disabled={toggling || loading}
            label={aceptaPedidos ? 'Acepto pedidos' : 'No acepto pedidos'}
          />

          {/* Manual refresh */}
          <motion.button
            className="orders__refresh-btn"
            onClick={() => fetchOrders()}
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.93 }}
            title="Actualizar"
          >
            <Icon name="download" size={16} />
            Actualizar
          </motion.button>
        </div>
      </div>

      {/* ── Stat chips ── */}
      <div className="orders__stats">
        {[
          { label: 'Total hoy',  value: totalHoy,   color: 'blue'   },
          { label: 'Aceptados',  value: aceptados,  color: 'green'  },
          { label: 'Pendientes', value: pendientes,  color: 'yellow' },
        ].map((s) => (
          <div key={s.label} className={`orders__stat-chip orders__stat-chip--${s.color}`}>
            <span className="orders__stat-value">{s.value}</span>
            <span className="orders__stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Search bar ── */}
      <div className="orders__toolbar">
        <div className="orders__search-wrap">
          <Icon name="search" size={16} className="orders__search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o detalle…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="orders__search"
          />
          {search && (
            <button className="orders__search-clear" onClick={() => setSearch('')} aria-label="Limpiar">
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="orders__loader">
          <Spinner />
        </div>
      ) : (
        <div className="orders__table-wrap">
          {filtered.length === 0 ? (
            <motion.div
              className="orders__empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <Icon name="orders" size={40} className="orders__empty-icon" />
              <p className="orders__empty-title">
                {search ? 'Sin resultados para tu búsqueda' : 'No hay pedidos para hoy'}
              </p>
              <p className="orders__empty-sub">
                {search
                  ? 'Prueba con otros términos'
                  : 'Los pedidos aparecerán aquí en cuanto lleguen'}
              </p>
            </motion.div>
          ) : (
            <table className="orders__table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Detalle del pedido</th>
                  <th>Hora recogida</th>
                  <th>Hora llegada</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <AnimatePresence mode="popLayout">
                <tbody>
                  {filtered.map((order) => (
                    <motion.tr
                      key={order.id}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                    >
                      <td className="orders__col-id">{order.id}</td>
                      <td className="orders__col-name">{order.nombre_cliente || '—'}</td>
                      <td className="orders__col-phone">{order.telefono || '—'}</td>
                      <td className="orders__col-detail">{order.detalle_pedido || '—'}</td>
                      <td className="orders__col-time">{order.hora_recogida || '—'}</td>
                      <td className="orders__col-time">{fmtTime(order.created_at)}</td>
                      <td><StatusBadge aceptado={order.aceptado} /></td>
                    </motion.tr>
                  ))}
                </tbody>
              </AnimatePresence>
            </table>
          )}
        </div>
      )}
    </section>
  );
}
