// ── Admin Router — root ──────────────────────────────────────────────────────
const router      = require('express').Router();
const requireAuth = require('../middlewares/requireAuth');

const authController      = require('../controllers/authController');
const registerController  = require('../controllers/registerController');
const businessController  = require('../controllers/businessController');
const productController   = require('../controllers/productController');
const categoryController  = require('../controllers/categoryController');
const importController    = require('../controllers/importController');
const serviceController   = require('../controllers/serviceController');
const promotionController = require('../controllers/promotionController');
const hoursController     = require('../controllers/hoursController');
const analyticsController = require('../controllers/analyticsController');
const subscriptionController       = require('../controllers/subscriptionController');
const requireSubscriptionPermission = require('../middlewares/requireSubscriptionPermission');
const businessTypeController = require('../controllers/businessTypeController');
const pedidosController      = require('../controllers/pedidosController');

// ── Auth (public) ─────────────────────────────────────────────────────────────
router.post('/login',           authController.login);
router.post('/register',        registerController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password',  authController.resetPassword);// Refresh + logout use the HTTP-only cookie — no access token needed
router.post('/refresh',         authController.refreshToken);
router.post('/logout',          authController.logout);
// ── Public catalogue endpoints ────────────────────────────────────────────────
router.get('/business-types',   businessTypeController.list);
// ── Public chat endpoint — resolves chat_uuid → business info ─────────────────
router.get('/chat/:chat_uuid',  async (req, res, next) => {
  try {
    const BusinessModel = require('../models/businessModel');
    const biz = await BusinessModel.findByChatUuid(req.params.chat_uuid);
    if (!biz) return res.status(404).json({ success: false, error: 'Chat no encontrado' });
    res.json({ success: true, data: biz });
  } catch (err) { next(err); }
});
// ── All routes below require auth ────────────────────────────────────────────
router.use(requireAuth);

// ── Change password (authenticated) ──────────────────────────────────────────
router.put('/change-password', authController.changePassword);

// ── Dashboard stats ───────────────────────────────────────────────────────────
router.get('/dashboard', businessController.getStats);

// ── Business info ─────────────────────────────────────────────────────────────
router.get('/business',  businessController.getInfo);
router.put('/business',  businessController.updateInfo);

// ── Categories ────────────────────────────────────────────────────────────────
router.get('/categories',        categoryController.list);
router.post('/categories',       categoryController.create);
router.put('/categories/:id',    categoryController.update);
router.delete('/categories/:id', categoryController.remove);

// ── Products ──────────────────────────────────────────────────────────────────
// Import routes must come before /:id to avoid Express matching "import" as an id
router.post('/products/import/preview', importController.preview);
router.post('/products/import/confirm', importController.confirm);

router.get('/products',      productController.list);
router.get('/products/:id',  productController.getById);
router.post('/products',     productController.create);
router.put('/products/:id',  productController.update);
router.delete('/products/:id', productController.remove);

// ── Services ──────────────────────────────────────────────────────────────────
router.get('/services',      serviceController.list);
router.get('/services/:id',  serviceController.getById);
router.post('/services',     serviceController.create);
router.put('/services/:id',  serviceController.update);
router.delete('/services/:id', serviceController.remove);

// ── Promotions ────────────────────────────────────────────────────────────────
router.get('/promotions',      promotionController.list);
router.get('/promotions/:id',  promotionController.getById);
router.post('/promotions',     promotionController.create);
router.put('/promotions/:id',  promotionController.update);
router.delete('/promotions/:id', promotionController.remove);

// ── Business Hours ────────────────────────────────────────────────────────────
router.get('/hours',        hoursController.list);
router.post('/hours/bulk',  hoursController.bulkSave);
router.post('/hours',       hoursController.upsertOne);
router.delete('/hours/:id', hoursController.remove);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics/top-products/:business_id', analyticsController.getTopProducts);

// ── Subscriptions (requires tipo_permiso = 1 — manejo de suscriptores) ──────────────
router.get('/subscriptions',      requireSubscriptionPermission, subscriptionController.list);
router.put('/subscriptions/:id',  requireSubscriptionPermission, subscriptionController.toggle);

// ── Pedidos ───────────────────────────────────────────────────────────────────
router.get('/orders/today',             pedidosController.listToday);router.put('/orders/:id',               pedidosController.updateOrder);router.put('/business/acepto-pedidos',  pedidosController.toggleAceptaPedidos);

module.exports = router;
