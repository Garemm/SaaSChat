// ── Stripe Service ────────────────────────────────────────────────────────────
// Handles Stripe Checkout Sessions and Customer Portal
import { authReq } from './api';

const BASE = '/admin/stripe';

export const stripeService = {
  /**
   * Create a Stripe Checkout Session for a subscription
   * @param {string} priceId - Stripe Price ID (e.g., 'price_1ABC...')
   * @returns {Promise<{sessionId: string, url: string}>}
   */
  async createCheckoutSession(priceId) {
    const data = await authReq(`${BASE}/create-checkout-session`, {
      method: 'POST',
      body: JSON.stringify({ priceId })
    });
    return data;
  },

  /**
   * Create a Stripe Customer Portal session
   * @returns {Promise<{url: string}>}
   */
  async createPortalSession() {
    const data = await authReq(`${BASE}/create-portal-session`, {
      method: 'POST'
    });
    return data;
  },

  /**
   * Get current subscription status
   * @returns {Promise<{hasSubscription: boolean, subscription: object}>}
   */
  async getSubscriptionStatus() {
    const data = await authReq(`${BASE}/subscription-status`);
    return data;
  },

  /**
   * Sync checkout session into local DB (used on success page as webhook fallback)
   * @param {string} sessionId
   * @returns {Promise<{synced: boolean, subscription: object | null}>}
   */
  async syncCheckoutSession(sessionId) {
    const data = await authReq(`${BASE}/sync-checkout-session`, {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    });
    return data;
  },
};
