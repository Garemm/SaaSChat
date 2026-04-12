// ── Subscription Success Page ────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { stripeService } from '../services/stripe';
import './SubscriptionSuccess.css';

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [syncState, setSyncState] = useState('pending');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    let timer;
    let cancelled = false;

    const startCountdown = () => {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const syncSubscription = async () => {
      if (!sessionId) {
        setSyncState('done');
        startCountdown();
        return;
      }

      try {
        await stripeService.syncCheckoutSession(sessionId);
        if (!cancelled) setSyncState('done');
      } catch (error) {
        console.error('Error syncing checkout session:', error);
        if (!cancelled) setSyncState('error');
      } finally {
        if (!cancelled) startCountdown();
      }
    };

    syncSubscription();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [navigate, sessionId]);

  return (
    <div className="subscription-success">
      <div className="success-card">
        <div className="success-icon">✓</div>
        <h1>¡Subscripción Exitosa!</h1>
        {syncState === 'pending' && <p className="success-message">Confirmando tu suscripción...</p>}
        {syncState === 'done' && <p className="success-message">Tu suscripción ha sido activada correctamente.</p>}
        {syncState === 'error' && (
          <p className="success-message">
            Pago confirmado. La activación puede tardar unos segundos; recarga la página de planes.
          </p>
        )}
        
        {sessionId && (
          <p className="session-info">
            ID de sesión: <code>{sessionId}</code>
          </p>
        )}

        <div className="benefits">
          <h3>¿Qué sigue?</h3>
          <ul>
            <li>✨ Acceso completo a todas las funcionalidades</li>
            <li>📊 Panel de analíticas avanzadas</li>
            <li>🚀 Catálogo ilimitado de productos</li>
            <li>💬 Soporte prioritario</li>
          </ul>
        </div>

        <div className="redirect-info">
          <p>Serás redirigido al dashboard en {countdown} segundos...</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn-dashboard"
          >
            Ir al Dashboard Ahora
          </button>
        </div>

        <div className="manage-link">
          <p>
            ¿Necesitas cambiar tu plan? 
            <button onClick={() => navigate('/pricing')} className="link-btn">
              Gestiona tu subscripción
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
