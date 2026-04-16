// ── Webpage Controller ───────────────────────────────────────────────────────
import WebpageModel from '../models/webpageModel.js';
import BusinessModel from '../models/businessModel.js';
import ProductModel from '../models/productModel.js';
import ServiceModel from '../models/serviceModel.js';
import PromotionModel from '../models/promotionModel.js';
import HoursModel from '../models/hoursModel.js';

// ─ Config endpoints ──────────────────────────────────────────────────────────
const getConfig = async (req, res, next) => {
  try {
    const config = await WebpageModel.findConfigByBusiness(req.businessId);
    res.json({ success: true, data: config || {} });
  } catch (err) { next(err); }
};

const updateConfig = async (req, res, next) => {
  try {
    const updated = await WebpageModel.updateConfig(req.businessId, req.body);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

// ─ Media endpoints ───────────────────────────────────────────────────────────
const listMedia = async (req, res, next) => {
  try {
    const media = await WebpageModel.listMedia(req.businessId);
    res.json({ success: true, data: media });
  } catch (err) { next(err); }
};

const createMedia = async (req, res, next) => {
  try {
    const media = await WebpageModel.createMedia(req.businessId, req.body);
    res.json({ success: true, data: media });
  } catch (err) { next(err); }
};

const updateMedia = async (req, res, next) => {
  try {
    const media = await WebpageModel.updateMedia(req.params.id, req.body);
    if (!media) return res.status(404).json({ success: false, error: 'Media no encontrado' });
    res.json({ success: true, data: media });
  } catch (err) { next(err); }
};

const removeMedia = async (req, res, next) => {
  try {
    const success = await WebpageModel.removeMedia(req.params.id);
    if (!success) return res.status(404).json({ success: false, error: 'Media no encontrado' });
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ─ Notices endpoints ─────────────────────────────────────────────────────────
const listNotices = async (req, res, next) => {
  try {
    const notices = await WebpageModel.listNotices(req.businessId);
    res.json({ success: true, data: notices });
  } catch (err) { next(err); }
};

const createNotice = async (req, res, next) => {
  try {
    const notice = await WebpageModel.createNotice(req.businessId, req.body);
    res.json({ success: true, data: notice });
  } catch (err) { next(err); }
};

const updateNotice = async (req, res, next) => {
  try {
    const notice = await WebpageModel.updateNotice(req.params.id, req.body);
    if (!notice) return res.status(404).json({ success: false, error: 'Aviso no encontrado' });
    res.json({ success: true, data: notice });
  } catch (err) { next(err); }
};

const removeNotice = async (req, res, next) => {
  try {
    const success = await WebpageModel.removeNotice(req.params.id);
    if (!success) return res.status(404).json({ success: false, error: 'Aviso no encontrado' });
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ─ Public preview endpoint ───────────────────────────────────────────────────
const getPublicPagePreview = async (req, res, next) => {
  try {
    const { subdomain } = req.params;
    if (!subdomain) {
      return res.status(400).json({ success: false, error: 'Subdomain requerido' });
    }

    const webpageConfig = await WebpageModel.findConfigBySubdomain(subdomain);
    if (!webpageConfig) {
      return res.status(404).json({ success: false, error: 'Página no encontrada' });
    }

    const businessId = webpageConfig.business_id;
    const [business, media, notices, products, services, promotions, hours] = await Promise.all([
      BusinessModel.findById(businessId),
      WebpageModel.listMedia(businessId),
      WebpageModel.listNotices(businessId),
      ProductModel.findAllByBusiness(businessId),
      ServiceModel.findAllByBusiness(businessId),
      PromotionModel.findAllByBusiness(businessId),
      HoursModel.findByBusiness(businessId),
    ]);

    if (!business) {
      return res.status(404).json({ success: false, error: 'Negocio no encontrado' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const activePromotions = promotions.filter((p) => {
      const start = String(p.start_date ?? '').slice(0, 10);
      const end = String(p.end_date ?? '').slice(0, 10);
      if (!start || !end) return true;
      return today >= start && today <= end;
    });

    const availableProducts = products.filter((p) => p.is_available === true);
    const activeMedia = media.filter((m) => m.is_active === true);
    const now = Date.now();
    const activeNotices = notices.filter((n) => {
      if (n.is_active !== true) return false;
      const starts = n.starts_at ? new Date(n.starts_at).getTime() : null;
      const ends = n.ends_at ? new Date(n.ends_at).getTime() : null;
      if (starts && now < starts) return false;
      if (ends && now > ends) return false;
      return true;
    });

    const chatBase = process.env.CHAT_PUBLIC_BASE_URL || 'http://localhost:5173';
    const chatSlug = business.chat_uuid || business.id;
    const chatLink = webpageConfig?.chatbot_url || `${chatBase}/chat/${chatSlug}`;

    return res.json({
      success: true,
      data: {
        business,
        webpage: {
          config: {
            subdomain: webpageConfig.subdomain,
            hero_title: webpageConfig.hero_title,
            hero_subtitle: webpageConfig.hero_subtitle,
            theme_json: webpageConfig.theme_json ?? {},
            is_published: webpageConfig.is_published === true,
          },
          media: activeMedia,
          notices: activeNotices,
        },
        links: {
          chat: chatLink,
          maps: business.google_maps_url || null,
          website: business.webpage_link || null,
        },
        products: availableProducts.slice(0, 24),
        services,
        promotions: activePromotions,
        hours,
      },
    });
  } catch (err) { next(err); }
};

export {
  getConfig,
  updateConfig,
  listMedia,
  createMedia,
  updateMedia,
  removeMedia,
  listNotices,
  createNotice,
  updateNotice,
  removeNotice,
  getPublicPagePreview,
};
