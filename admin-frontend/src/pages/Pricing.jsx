// ── Pricing Page — Stripe Subscription Plans ─────────────────────────────────
import { useState, useEffect } from 'react';
import { stripeService } from '../services/stripe';
import './Pricing.css';

export default function Pricing() {
  const [loading, setLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const subscriptionStatusesWithAccess = new Set(['active', 'trialing']);
  const hasSubscribedPlan =
    !!currentSubscription && subscriptionStatusesWithAccess.has(currentSubscription.status);

  // Stripe Price IDs (test mode)
  const plans = [
    {
      id: 'price_1TJy3wRelXUxd4YwzvT1kBq5',
      name: 'Plan Lite',
      price: '$299 MXN',
      interval: 'mes',
      features: [
        'Hasta 100 productos',
        'Soporte por email',
        'Catálogo básico',
        'Analíticas básicas'
      ]
    },
    {
      id: 'price_1TJy38RelXUxd4YwCXMbyAhw',
      name: 'Plan Básico',
      price: '$499 MXN',
      interval: 'mes',
      features: [
        'Hasta 500 productos',
        'Soporte prioritario',
        'Catálogo avanzado',
        'Analíticas completas',
        'Múltiples ubicaciones'
      ]
    },
    {
      id: 'price_1TJy3URelXUxd4Ywl7caUKO0',
      name: 'Plan Pro',
      price: '$799 MXN',
      interval: 'mes',
      popular: true,
      features: [
        'Productos ilimitados',
        'Soporte 24/7',
        'Gestión de equipos',
        'Integraciones avanzadas',
        'Onboarding personalizado',
        'SLA garantizado'
      ]
    }
  ];

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      const data = await stripeService.getSubscriptionStatus();
      if (data.hasSubscription) {
        setCurrentSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const handleSubscribe = async (priceId) => {
    setLoading(true);
    setSelectedPlan(priceId);

    try {
      const { url } = await stripeService.createCheckoutSession(priceId);
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert(`Error al procesar la suscripción: ${error.message}`);
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { url } = await stripeService.createPortalSession();
      window.location.href = url;
    } catch (error) {
      console.error('Error opening customer portal:', error);
      alert(`Error al abrir el portal de suscripción: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <h1>Elige tu Plan</h1>
        <p>Selecciona el plan que mejor se adapte a las necesidades de tu negocio</p>
        
        {currentSubscription && (
          <div className="current-subscription-banner">
            <div>
              <p>
                Subscripción activa: <strong>{currentSubscription.status}</strong>
              </p>
              {currentSubscription.cancelAt && (
                <p>
                  Programada para terminar:{" "}
                  <strong>{new Date(currentSubscription.cancelAt).toLocaleDateString('es-MX')}</strong>
                </p>
              )}
            </div>
            <button 
              onClick={handleManageSubscription}
              className="btn-portal"
              disabled={loading}
            >
              Gestionar Subscripción
            </button>
          </div>
        )}
      </div>

      <div className="pricing-grid">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`pricing-card ${plan.popular ? 'popular' : ''}`}
          >
            {plan.popular && <div className="popular-badge">Más Popular</div>}
            
            <h3>{plan.name}</h3>
            <div className="price">
              <span className="amount">{plan.price}</span>
              <span className="interval">/{plan.interval}</span>
            </div>

            <ul className="features">
              {plan.features.map((feature, idx) => (
                <li key={idx}>
                  <span className="checkmark">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading || hasSubscribedPlan}
              className={`btn-subscribe ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
            >
              {loading && selectedPlan === plan.id ? (
                'Procesando...'
              ) : hasSubscribedPlan ? (
                'Subscrito'
              ) : (
                'Subscribirse'
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="pricing-footer">
        <p>¿Necesitas un plan personalizado? <a href="mailto:support@tusaas.com">Contáctanos</a></p>
        <p className="secure-note">🔒 Pagos seguros procesados por Stripe</p>
      </div>
    </div>
  );
}
