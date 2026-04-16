import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Spinner from '../components/ui/Spinner';
import { useToast } from '../context/ToastContext';

const MiWebpage = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [webpageConfig, setWebpageConfig] = useState(null);

  useEffect(() => {
    // Simulated load - replace with actual API call
    setTimeout(() => {
      setWebpageConfig({
        subdomain: 'miempresa',
        hero_title: 'Mi Empresa',
        hero_subtitle: 'Bienvenido a nuestra página web',
        is_published: false,
        theme_json: {},
      });
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="page page--center">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page__header">
        <h2>Mi Página Web</h2>
        <p className="page__subtitle">Personaliza y gestiona tu página web pública</p>
      </div>

      <div className="webpage-container">
        <motion.div
          className="webpage-card"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="webpage-card__header">
            <h3>Configuración General</h3>
            <span className={`badge ${webpageConfig?.is_published ? 'badge--active' : 'badge--inactive'}`}>
              {webpageConfig?.is_published ? 'Publicada' : 'No publicada'}
            </span>
          </div>

          <div className="webpage-card__content">
            <div className="form-group">
              <label>Subdominio</label>
              <div className="input-display">
                <strong>{webpageConfig?.subdomain}</strong>.hayChat.app
              </div>
            </div>

            <div className="form-group">
              <label>Título Hero</label>
              <p className="text-secondary">{webpageConfig?.hero_title}</p>
            </div>

            <div className="form-group">
              <label>Subtítulo</label>
              <p className="text-secondary">{webpageConfig?.hero_subtitle}</p>
            </div>

            <div className="form-group">
              <button className="btn btn--primary">
                Editar Página Web
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="webpage-card"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="webpage-card__header">
            <h3>Vista Previa</h3>
          </div>

          <div className="webpage-preview">
            <div className="preview-placeholder">
              <p>Tu página web aparecerá aquí</p>
              <a href={`https://${webpageConfig?.subdomain}.hayChat.app`} target="_blank" rel="noopener noreferrer" className="link">
                Ver página web pública →
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        .webpage-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .webpage-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .webpage-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .webpage-card__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #f0f0f0;
          background: #fafbfc;
        }

        .webpage-card__header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .badge {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 20px;
          text-transform: uppercase;
        }

        .badge--active {
          background: #dcfce7;
          color: #166534;
        }

        .badge--inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        .webpage-card__content {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .input-display {
          font-size: 14px;
          padding: 8px 12px;
          background: #f3f4f6;
          border-radius: 6px;
          font-family: 'Monaco', monospace;
        }

        .text-secondary {
          font-size: 14px;
          color: #4b5563;
          margin: 0;
        }

        .webpage-preview {
          padding: 20px;
        }

        .preview-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-radius: 8px;
          color: #6b7280;
          text-align: center;
        }

        .preview-placeholder p {
          margin: 0 0 12px 0;
          font-size: 14px;
        }

        .link {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 500;
          font-size: 13px;
          transition: color 0.2s;
        }

        .link:hover {
          color: #2563eb;
          text-decoration: underline;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn--primary {
          background: #3b82f6;
          color: white;
        }

        .btn--primary:hover {
          background: #2563eb;
        }
      `}</style>
    </motion.div>
  );
};

export default MiWebpage;
