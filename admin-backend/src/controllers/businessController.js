// ── Business Controller ──────────────────────────────────────────────────────
import BusinessModel from '../models/businessModel.js';
import ProductModel from '../models/productModel.js';
import ServiceModel from '../models/serviceModel.js';
import PromotionModel from '../models/promotionModel.js';
import HoursModel from '../models/hoursModel.js';
import WebpageModel from '../models/webpageModel.js';

const getStats = async (req, res, next) => {
  try {
    const biz = await BusinessModel.findById(req.businessId);
    const [products, services, promotions] = await Promise.all([
      ProductModel.countByBusiness(req.businessId),
      ServiceModel.countByBusiness(req.businessId),
      PromotionModel.countByBusiness(req.businessId),
    ]);
    res.json({ success: true, data: { business: biz, stats: { products, services, promotions } } });
  } catch (err) { next(err); }
};

const getInfo = async (req, res, next) => {
  try {
    const biz = await BusinessModel.findById(req.businessId);
    if (!biz) return res.status(404).json({ success: false, error: 'Negocio no encontrado' });
    res.json({ success: true, data: biz });
  } catch (err) { next(err); }
};

const updateInfo = async (req, res, next) => {
  try {
    const updated = await BusinessModel.update(req.businessId, req.body);
    if (!updated) return res.status(404).json({ success: false, error: 'Negocio no encontrado' });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

/**
 * GET /admin/public/webpage-preview/:business_id
 * Public local preview endpoint for a business landing page.
 */
const getWebpagePreview = async (req, res, next) => {
  try {
    const businessId = parseInt(req.params.business_id, 10);
    if (!businessId || businessId < 1) {
      return res.status(400).json({ success: false, error: 'business_id inválido' });
    }

    const [business, webpageConfig, media, notices, products, services, promotions, hours] = await Promise.all([
      BusinessModel.findById(businessId),
      WebpageModel.findConfigByBusiness(businessId),
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
    const chatBase = process.env.CHAT_PUBLIC_BASE_URL || 'http://localhost:5173';
    const chatSlug = business.chat_uuid || business.id;
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
    const chatLink = webpageConfig?.chatbot_url || `${chatBase}/chat/${chatSlug}`;

    return res.json({
      success: true,
      data: {
        business,
        webpage: {
          config: webpageConfig
            ? {
                subdomain: webpageConfig.subdomain,
                hero_title: webpageConfig.hero_title,
                hero_subtitle: webpageConfig.hero_subtitle,
                theme_json: webpageConfig.theme_json ?? {},
                is_published: webpageConfig.is_published === true,
              }
            : null,
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

export { getStats, getInfo, updateInfo, getWebpagePreview };
