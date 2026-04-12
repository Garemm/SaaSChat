// ── Stripe Controller ────────────────────────────────────────────────────────
// Handles Stripe Checkout Sessions, Customer Portal, and Webhooks for subscriptions
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/database');

const getAllowedPriceIds = () =>
  new Set(
    (process.env.STRIPE_ALLOWED_PRICE_IDS || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
  );

/**
 * POST /admin/stripe/create-checkout-session
 * Creates a Stripe Checkout Session for a new subscription
 */
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const { priceId } = req.body;
    const adminId = req.adminId;
    const businessId = req.businessId;

    if (!priceId) {
      return res.status(400).json({ error: 'priceId is required' });
    }

    const allowedPriceIds = getAllowedPriceIds();
    if (allowedPriceIds.size === 0) {
      return res
        .status(500)
        .json({ error: 'Stripe allowlist no configurada (STRIPE_ALLOWED_PRICE_IDS)' });
    }

    if (!allowedPriceIds.has(priceId)) {
      return res.status(400).json({ error: 'priceId no permitido' });
    }

    // Check if business already has an active subscription
    const existingSub = await db.query(
      `SELECT * FROM stripe_subscriptions 
       WHERE business_id = $1 AND status IN ('active', 'trialing')`,
      [businessId]
    );

    // If local DB has no active row, try recovering latest state from Stripe
    if (existingSub.rows.length === 0) {
      await recoverLatestSubscriptionFromStripe(businessId);
    }

    const activeAfterRecovery = await db.query(
      `SELECT 1
       FROM stripe_subscriptions
       WHERE business_id = $1 AND status IN ('active', 'trialing')
       LIMIT 1`,
      [businessId]
    );

    if (activeAfterRecovery.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Ya existe una subscripción activa para este negocio' 
      });
    }

    // Get or create Stripe customer
    let customerId;
    const customerRecord = await db.query(
      'SELECT stripe_customer_id FROM stripe_subscriptions WHERE business_id = $1 LIMIT 1',
      [businessId]
    );

    if (customerRecord.rows.length > 0 && customerRecord.rows[0].stripe_customer_id) {
      customerId = customerRecord.rows[0].stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        metadata: {
          businessId: String(businessId),
          adminId: String(adminId)
        }
      });
      customerId = customer.id;
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: {
        businessId: String(businessId),
        adminId: String(adminId)
      }
    });

    res.json({ 
      sessionId: session.id, 
      url: session.url 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    next(error);
  }
};

/**
 * POST /admin/stripe/create-portal-session
 * Creates a Stripe Customer Portal session for managing subscriptions
 */
exports.createPortalSession = async (req, res, next) => {
  try {
    const businessId = req.businessId;

    // Get customer ID from database
    const result = await db.query(
      'SELECT stripe_customer_id FROM stripe_subscriptions WHERE business_id = $1 LIMIT 1',
      [businessId]
    );

    if (result.rows.length === 0 || !result.rows[0].stripe_customer_id) {
      return res.status(404).json({ 
        error: 'No se encontró información de subscripción' 
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: result.rows[0].stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/pricing`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    next(error);
  }
};

/**
 * POST /admin/stripe/webhook
 * Stripe webhook endpoint - handles subscription lifecycle events
 * IMPORTANT: This route must use express.raw() middleware, not express.json()
 */
exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription') {
          await handleCheckoutCompleted(session);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await updateSubscription(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await cancelSubscription(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('✅ Payment succeeded:', invoice.id);
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          await updateSubscription(subscription);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('❌ Payment failed:', invoice.id);
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          await updateSubscription(subscription);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * GET /admin/stripe/subscription-status
 * Get current subscription status for the authenticated business
 */
exports.getSubscriptionStatus = async (req, res, next) => {
  try {
    const businessId = req.businessId;

    let result = await db.query(
      `SELECT * FROM stripe_subscriptions 
       WHERE business_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [businessId]
    );

    if (result.rows.length === 0) {
      await recoverLatestSubscriptionFromStripe(businessId);
      result = await db.query(
        `SELECT * FROM stripe_subscriptions 
         WHERE business_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [businessId]
      );
    }

    if (result.rows.length === 0) {
      return res.json({ hasSubscription: false, subscription: null });
    }

    let sub = result.rows[0];

    // Backfill latest cancellation fields from Stripe for older rows/migrations
    if (sub.stripe_subscription_id && sub.cancel_at === null) {
      try {
        const liveSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
        await updateSubscription(liveSub, businessId);
        const refreshed = await db.query(
          `SELECT * FROM stripe_subscriptions
           WHERE business_id = $1
           ORDER BY created_at DESC
           LIMIT 1`,
          [businessId]
        );
        if (refreshed.rows[0]) sub = refreshed.rows[0];
      } catch (refreshError) {
        console.error('Error refreshing cancellation fields from Stripe:', refreshError.message);
      }
    }

    res.json({
      hasSubscription: true,
      subscription: {
        id: sub.stripe_subscription_id,
        status: sub.status,
        priceId: sub.stripe_price_id,
        currentPeriodEnd: sub.current_period_end,
        cancelAt: sub.cancel_at,
        cancelAtPeriodEnd: sub.cancel_at_period_end
      }
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    next(error);
  }
};

/**
 * POST /admin/stripe/sync-checkout-session
 * Syncs a completed Checkout Session into local DB (fallback to not depend only on webhook timing)
 */
exports.syncCheckoutSession = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const businessId = req.businessId;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.mode !== 'subscription' || !session.subscription) {
      return res.status(400).json({ error: 'La sesión no corresponde a una suscripción válida' });
    }

    if (session.metadata?.businessId && String(session.metadata.businessId) !== String(businessId)) {
      return res.status(403).json({ error: 'Esta sesión no pertenece a tu negocio' });
    }

    const subscriptionId =
      typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    await updateSubscription(subscription, businessId, session.customer);

    const { rows } = await db.query(
      `SELECT stripe_subscription_id, stripe_price_id, status, current_period_end, cancel_at, cancel_at_period_end
       FROM stripe_subscriptions
       WHERE business_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [businessId]
    );

    const sub = rows[0] || null;
    res.json({
      synced: true,
      subscription: sub
        ? {
            id: sub.stripe_subscription_id,
            priceId: sub.stripe_price_id,
            status: sub.status,
            currentPeriodEnd: sub.current_period_end,
            cancelAt: sub.cancel_at,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          }
        : null,
    });
  } catch (error) {
    console.error('Error syncing checkout session:', error);
    next(error);
  }
};

// ── Helper Functions ──────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session) {
  const businessId = session.metadata.businessId;
  const customerId = session.customer;
  
  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  
  await updateSubscription(subscription, businessId, customerId);
  console.log('✅ Checkout completed for business:', businessId);
}

async function updateSubscription(subscription, businessId = null, customerId = null) {
  const bid = businessId || subscription.metadata?.businessId;
  const cid = customerId || subscription.customer;
  
  if (!bid) {
    console.warn('No businessId found for subscription:', subscription.id);
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id;
  const item = subscription.items?.data?.[0];
  const periodStartUnix = subscription.current_period_start ?? item?.current_period_start ?? null;
  const periodEndUnix = subscription.current_period_end ?? item?.current_period_end ?? null;
  const cancelAtUnix = subscription.cancel_at ?? null;
  const periodStart =
    Number.isFinite(periodStartUnix) ? new Date(periodStartUnix * 1000) : null;
  const periodEnd =
    Number.isFinite(periodEndUnix) ? new Date(periodEndUnix * 1000) : null;
  const cancelAt =
    Number.isFinite(cancelAtUnix) ? new Date(cancelAtUnix * 1000) : null;

  await db.query(
    `INSERT INTO stripe_subscriptions (
      business_id, 
      stripe_customer_id, 
      stripe_subscription_id, 
      stripe_price_id, 
      status, 
      current_period_start, 
      current_period_end,
      cancel_at,
      cancel_at_period_end
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (stripe_subscription_id) 
    DO UPDATE SET
      status = EXCLUDED.status,
      stripe_price_id = EXCLUDED.stripe_price_id,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      cancel_at = EXCLUDED.cancel_at,
      cancel_at_period_end = EXCLUDED.cancel_at_period_end,
      updated_at = NOW()`,
    [
      bid,
      cid,
      subscription.id,
      priceId,
      subscription.status,
      periodStart,
      periodEnd,
      cancelAt,
      subscription.cancel_at_period_end || false
    ]
  );

  await syncBusinessAccess(bid, subscription.status);
  console.log(`✅ Subscription ${subscription.status} for business:`, bid);
}

async function cancelSubscription(subscription) {
  const cancelAtUnix =
    subscription.cancel_at ?? subscription.canceled_at ?? Math.floor(Date.now() / 1000);
  const cancelAt =
    Number.isFinite(cancelAtUnix) ? new Date(cancelAtUnix * 1000) : new Date();

  const { rows } = await db.query(
    `UPDATE stripe_subscriptions 
     SET status = 'canceled', 
         cancel_at = $2,
         updated_at = NOW() 
     WHERE stripe_subscription_id = $1
     RETURNING business_id`,
    [subscription.id, cancelAt]
  );

  if (rows[0]?.business_id) {
    await syncBusinessAccess(rows[0].business_id, 'canceled');
  }

  console.log('❌ Subscription canceled:', subscription.id);
}

async function recoverLatestSubscriptionFromStripe(businessId) {
  try {
    const sessions = await stripe.checkout.sessions.list({ limit: 30 });
    const matchingSession = sessions.data.find(
      (s) =>
        s.mode === 'subscription' &&
        s.status === 'complete' &&
        !!s.subscription &&
        String(s.metadata?.businessId) === String(businessId)
    );

    if (!matchingSession) return false;

    const subscriptionId =
      typeof matchingSession.subscription === 'string'
        ? matchingSession.subscription
        : matchingSession.subscription.id;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await updateSubscription(subscription, businessId, matchingSession.customer);
    return true;
  } catch (error) {
    console.error('Error recovering subscription from Stripe:', error.message);
    return false;
  }
}

async function syncBusinessAccess(businessId, subscriptionStatus) {
  const allowAccess = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
  await db.query(
    `UPDATE businesses
     SET is_active = $1
     WHERE id = $2`,
    [allowAccess, businessId]
  );
}
