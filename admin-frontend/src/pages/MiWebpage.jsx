import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Spinner from '../components/ui/Spinner';
import Icon from '../components/ui/Icon';
import { useToast } from '../context/ToastContext';

const MiWebpage = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('config');
  const [editingId, setEditingId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Config state
  const [config, setConfig] = useState({
    subdomain: 'miempresa',
    hero_title: 'Mi Empresa',
    hero_subtitle: 'Bienvenido a nuestra página web',
    is_published: false,
    theme_json: { primaryColor: '#3b82f6', backgroundColor: '#ffffff' },
  });

  // Media state
  const [media, setMedia] = useState([
    { id: 1, title: 'Banner Principal', media_url: '', media_type: 'image', is_active: true },
  ]);
  const [newMedia, setNewMedia] = useState({ title: '', media_url: '', media_type: 'image' });

  // Notices state
  const [notices, setNotices] = useState([]);
  const [newNotice, setNewNotice] = useState({ title: '', content: '', notice_type: 'info', is_active: true });

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleThemeChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      theme_json: { ...prev.theme_json, [field]: value }
    }));
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      // TODO: llamar API
      addToast('Configuración guardada', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMedia = () => {
    if (!newMedia.title || !newMedia.media_url) {
      addToast('Completa todos los campos', 'error');
      return;
    }
    setMedia([...media, { ...newMedia, id: Date.now(), is_active: true }]);
    setNewMedia({ title: '', media_url: '', media_type: 'image' });
    addToast('Media agregado', 'success');
  };

  const handleRemoveMedia = (id) => {
    setMedia(media.filter(m => m.id !== id));
    addToast('Media eliminado', 'success');
  };

  const handleAddNotice = () => {
    if (!newNotice.title || !newNotice.content) {
      addToast('Completa título y contenido', 'error');
      return;
    }
    setNotices([...notices, { ...newNotice, id: Date.now() }]);
    setNewNotice({ title: '', content: '', notice_type: 'info', is_active: true });
    addToast('Aviso agregado', 'success');
  };

  const handleRemoveNotice = (id) => {
    setNotices(notices.filter(n => n.id !== id));
    addToast('Aviso eliminado', 'success');
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      // TODO: llamar API
      addToast('Configuración guardada', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMedia = () => {
    if (!newMedia.title || !newMedia.media_url) {
      addToast('Completa todos los campos', 'error');
      return;
    }
    setMedia([...media, { ...newMedia, id: Date.now(), is_active: true }]);
    setNewMedia({ title: '', media_url: '', media_type: 'image' });
    addToast('Media agregado', 'success');
  };

  const handleRemoveMedia = (id) => {
    setMedia(media.filter(m => m.id !== id));
    addToast('Media eliminado', 'success');
  };

  const handleAddNotice = () => {
    if (!newNotice.title || !newNotice.content) {
      addToast('Completa título y contenido', 'error');
      return;
    }
    setNotices([...notices, { ...newNotice, id: Date.now() }]);
    setNewNotice({ title: '', content: '', notice_type: 'info', is_active: true });
    addToast('Aviso agregado', 'success');
  };

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Mi Página Web</h2>
            <p className="page__subtitle">Personaliza y gestiona tu página web pública</p>
          </div>
          <motion.button
            className="btn btn--primary"
            onClick={() => setShowPreview(!showPreview)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '0px',
              marginRight: '0px'
            }}
          >
            <Icon name="externallink" size={16} />
            {showPreview ? 'Cerrar Preview' : 'Abrir Preview'}
          </motion.button>
        </div>
      </div>

      {/* LAYOUT CON PREVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr', gap: '24px', marginTop: '24px' }}>
        {/* EDITOR PANEL */}
        <div>
      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'config' ? 'tab-button--active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          <Icon name="business" size={16} />
          Configuración
        </button>
        <button
          className={`tab-button ${activeTab === 'media' ? 'tab-button--active' : ''}`}
          onClick={() => setActiveTab('media')}
        >
          <Icon name="download" size={16} />
          Media
        </button>
        <button
          className={`tab-button ${activeTab === 'notices' ? 'tab-button--active' : ''}`}
          onClick={() => setActiveTab('notices')}
        >
          <Icon name="externallink" size={16} />
          Avisos
        </button>
      </div>

      {/* CONFIG TAB */}
      <AnimatePresence mode="wait">
        {activeTab === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="tab-content"
          >
            <div className="form-card">
              <h3>Configuración General</h3>

              <div className="form-group">
                <label>Subdominio</label>
                <div className="input-row">
                  <input
                    type="text"
                    value={config.subdomain}
                    onChange={(e) => handleConfigChange('subdomain', e.target.value)}
                    placeholder="miempresa"
                  />
                  <span className="input-suffix">.hayChat.app</span>
                </div>
              </div>

              <div className="form-group">
                <label>Título Principal (Hero Title)</label>
                <input
                  type="text"
                  value={config.hero_title}
                  onChange={(e) => handleConfigChange('hero_title', e.target.value)}
                  placeholder="Ej: Mi Empresa"
                />
              </div>

              <div className="form-group">
                <label>Subtítulo</label>
                <textarea
                  value={config.hero_subtitle}
                  onChange={(e) => handleConfigChange('hero_subtitle', e.target.value)}
                  placeholder="Ej: Bienvenido a nuestra página web"
                  rows={3}
                />
              </div>

              <div className="form-section-title">Tema de Colores</div>

              <div className="color-grid">
                <div className="form-group">
                  <label>Color Primario</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      value={config.theme_json.primaryColor || '#3b82f6'}
                      onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                    />
                    <span className="color-value">{config.theme_json.primaryColor}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Color de Fondo</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      value={config.theme_json.backgroundColor || '#ffffff'}
                      onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                    />
                    <span className="color-value">{config.theme_json.backgroundColor}</span>
                  </div>
                </div>
              </div>

              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="publish"
                  checked={config.is_published}
                  onChange={(e) => handleConfigChange('is_published', e.target.checked)}
                />
                <label htmlFor="publish">Publicar página web</label>
              </div>

              <button
                className="btn btn--primary btn--large"
                onClick={handleSaveConfig}
                disabled={saving}
              >
                {saving ? <Spinner size={16} /> : <>💾 Guardar Configuración</>}
              </button>
            </div>
          </motion.div>
        )}

        {/* MEDIA TAB */}
        {activeTab === 'media' && (
          <motion.div
            key="media"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="tab-content"
          >
            <div className="form-card">
              <h3>Gestionar Media (Imágenes/Videos)</h3>

              {/* Add Media Form */}
              <div className="form-subsection">
                <h4>Agregar nuevo media</h4>

                <div className="form-group">
                  <label>Tipo</label>
                  <select
                    value={newMedia.media_type}
                    onChange={(e) => setNewMedia({ ...newMedia, media_type: e.target.value })}
                  >
                    <option value="image">Imagen</option>
                    <option value="video">Video</option>
                    <option value="carousel">Carrusel</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Título</label>
                  <input
                    type="text"
                    value={newMedia.title}
                    onChange={(e) => setNewMedia({ ...newMedia, title: e.target.value })}
                    placeholder="Ej: Banner Principal"
                  />
                </div>

                <div className="form-group">
                  <label>URL del Media</label>
                  <input
                    type="text"
                    value={newMedia.media_url}
                    onChange={(e) => setNewMedia({ ...newMedia, media_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <button className="btn btn--secondary" onClick={handleAddMedia}>
                  <Icon name="plus" size={16} /> Agregar Media
                </button>
              </div>

              {/* Media List */}
              <div className="media-list">
                <h4>Media Existente</h4>
                {media.length === 0 ? (
                  <p className="empty-state">No hay media agregado aún</p>
                ) : (
                  media.map((item) => (
                    <motion.div
                      key={item.id}
                      className="media-item"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="media-item__preview">
                        {item.media_type === 'image' && item.media_url && (
                          <img src={item.media_url} alt={item.title} />
                        )}
                        {!item.media_url && (
                          <div className="media-item__placeholder">{item.media_type}</div>
                        )}
                      </div>
                      <div className="media-item__info">
                        <h5>{item.title}</h5>
                        <p>{item.media_type}</p>
                      </div>
                      <div className="media-item__actions">
                        <button
                          className="btn btn--icon btn--danger"
                          onClick={() => handleRemoveMedia(item.id)}
                          title="Eliminar"
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* NOTICES TAB */}
        {activeTab === 'notices' && (
          <motion.div
            key="notices"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="tab-content"
          >
            <div className="form-card">
              <h3>Gestionar Avisos</h3>

              {/* Add Notice Form */}
              <div className="form-subsection">
                <h4>Crear nuevo aviso</h4>

                <div className="form-group">
                  <label>Tipo</label>
                  <select
                    value={newNotice.notice_type}
                    onChange={(e) => setNewNotice({ ...newNotice, notice_type: e.target.value })}
                  >
                    <option value="info">Información</option>
                    <option value="warning">Advertencia</option>
                    <option value="alert">Alerta</option>
                    <option value="success">Éxito</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Título</label>
                  <input
                    type="text"
                    value={newNotice.title}
                    onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                    placeholder="Ej: Nuevo descuento"
                  />
                </div>

                <div className="form-group">
                  <label>Contenido</label>
                  <textarea
                    value={newNotice.content}
                    onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                    placeholder="Mensaje del aviso..."
                    rows={4}
                  />
                </div>

                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="notice-active"
                    checked={newNotice.is_active}
                    onChange={(e) => setNewNotice({ ...newNotice, is_active: e.target.checked })}
                  />
                  <label htmlFor="notice-active">Activo</label>
                </div>

                <button className="btn btn--secondary" onClick={handleAddNotice}>
                  <Icon name="plus" size={16} /> Agregar Aviso
                </button>
              </div>

              {/* Notices List */}
              <div className="notices-list">
                <h4>Avisos Existentes</h4>
                {notices.length === 0 ? (
                  <p className="empty-state">No hay avisos agregados</p>
                ) : (
                  notices.map((notice) => (
                    <motion.div
                      key={notice.id}
                      className={`notice-item notice-item--${notice.notice_type}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="notice-item__content">
                        <h5>{notice.title}</h5>
                        <p>{notice.content}</p>
                        <span className={`notice-badge notice-badge--${notice.notice_type}`}>
                          {notice.notice_type}
                        </span>
                      </div>
                      <button
                        className="btn btn--icon btn--danger"
                        onClick={() => handleRemoveNotice(notice.id)}
                        title="Eliminar"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        </div>

        {/* PREVIEW PANEL */}
        {showPreview && (
          <motion.div
            className="preview-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="preview-container">
              <div className="preview-header">
                <h3>Vista Previa</h3>
                <span className="preview-url">{config.subdomain}.hayChat.app</span>
              </div>
              
              <div className="preview-content" style={{ backgroundColor: config.theme_json.backgroundColor }}>
                {/* Hero Section */}
                <div className="preview-hero">
                  <h1 style={{ color: config.theme_json.primaryColor }}>
                    {config.hero_title}
                  </h1>
                  <p>{config.hero_subtitle}</p>
                </div>

                {/* Media Gallery */}
                {media.length > 0 && (
                  <div className="preview-media-section">
                    <h3>Media</h3>
                    <div className="preview-media-grid">
                      {media.filter(m => m.is_active).map((item) => (
                        <div key={item.id} className="preview-media-item">
                          {item.media_type === 'image' && item.media_url && (
                            <img src={item.media_url} alt={item.title} />
                          )}
                          {item.media_type === 'video' && item.media_url && (
                            <div className="preview-video-placeholder">▶ Video</div>
                          )}
                          {!item.media_url && (
                            <div className="preview-placeholder">{item.media_type}</div>
                          )}
                          <p>{item.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notices */}
                {notices.length > 0 && (
                  <div className="preview-notices-section">
                    <h3>Avisos</h3>
                    {notices.filter(n => n.is_active).map((notice) => (
                      <div key={notice.id} className={`preview-notice preview-notice--${notice.notice_type}`}>
                        <strong>{notice.title}</strong>
                        <p>{notice.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Published Badge */}
                <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: `2px solid ${config.theme_json.primaryColor}` }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: config.is_published ? config.theme_json.primaryColor : '#e5e7eb',
                    color: config.is_published ? 'white' : '#6b7280'
                  }}>
                    {config.is_published ? '✓ Publicada' : '○ No Publicada'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <style>{`
        .preview-panel {
          position: sticky;
          top: 80px;
          height: fit-content;
          max-height: calc(100vh - 100px);
          overflow-y: auto;
        }

        .preview-container {
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .preview-header {
          padding: 16px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          border-bottom: 2px solid #1e40af;
        }

        .preview-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
        }

        .preview-url {
          font-size: 11px;
          opacity: 0.9;
          font-family: monospace;
          background: rgba(255, 255, 255, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
        }

        .preview-content {
          padding: 32px 24px;
          min-height: 600px;
          transition: background-color 0.3s ease;
        }

        .preview-hero {
          text-align: center;
          margin-bottom: 40px;
          padding: 20px 0;
        }

        .preview-hero h1 {
          margin: 0 0 12px 0;
          font-size: 32px;
          font-weight: 700;
          transition: color 0.3s ease;
        }

        .preview-hero p {
          margin: 0;
          font-size: 16px;
          color: #6b7280;
          transition: color 0.3s ease;
        }

        .preview-media-section,
        .preview-notices-section {
          margin: 32px 0;
        }

        .preview-media-section h3,
        .preview-notices-section h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .preview-media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
        }

        .preview-media-item {
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          text-align: center;
        }

        .preview-media-item img {
          width: 100%;
          height: 120px;
          object-fit: cover;
          display: block;
        }

        .preview-video-placeholder,
        .preview-placeholder {
          width: 100%;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          color: #9ca3af;
          font-size: 14px;
          font-weight: 600;
        }

        .preview-media-item p {
          margin: 8px;
          font-size: 12px;
          color: #6b7280;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .preview-notice {
          padding: 12px 16px;
          margin-bottom: 12px;
          border-radius: 8px;
          border-left: 4px solid;
        }

        .preview-notice--info {
          background: #dbeafe;
          border-left-color: #0284c7;
          color: #0c4a6e;
        }

        .preview-notice--warning {
          background: #fef3c7;
          border-left-color: #d97706;
          color: #78350f;
        }

        .preview-notice--alert {
          background: #fee2e2;
          border-left-color: #dc2626;
          color: #7f1d1d;
        }

        .preview-notice--success {
          background: #dcfce7;
          border-left-color: #16a34a;
          color: #15803d;
        }

        .preview-notice strong {
          display: block;
          margin-bottom: 4px;
          font-size: 13px;
        }

        .preview-notice p {
          margin: 0;
          font-size: 13px;
        }

        .tabs-container {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border: none;
          background: none;
          color: #6b7280;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .tab-button:hover {
          color: #374151;
        }

        .tab-button--active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .tab-content {
          margin-top: 24px;
        }

        .form-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .form-card h3 {
          margin: 0 0 20px 0;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }

        .form-card h4 {
          margin: 20px 0 16px 0;
          font-size: 15px;
          font-weight: 600;
          color: #374151;
        }

        .form-section-title {
          margin: 24px 0 16px 0;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6b7280;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }

        .form-group input[type="text"],
        .form-group input[type="color"],
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.2s;
        }

        .form-group input[type="text"]:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group textarea {
          resize: vertical;
        }

        .form-group.checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 16px 0;
        }

        .form-group.checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .form-group.checkbox label {
          margin: 0;
          cursor: pointer;
        }

        .input-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .input-row input {
          flex: 1;
        }

        .input-suffix {
          font-size: 14px;
          color: #6b7280;
          white-space: nowrap;
          padding: 8px 12px;
        }

        .color-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .color-input-group {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .color-input-group input[type="color"] {
          width: 60px;
          height: 40px;
          padding: 2px;
          cursor: pointer;
        }

        .color-value {
          font-family: monospace;
          font-size: 13px;
          color: #6b7280;
        }

        .form-subsection {
          background: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          border: 1px solid #e5e7eb;
        }

        .form-subsection h4 {
          margin-top: 0;
        }

        .media-list,
        .notices-list {
          margin-top: 24px;
        }

        .media-list h4,
        .notices-list h4 {
          margin-bottom: 12px;
        }

        .empty-state {
          text-align: center;
          color: #9ca3af;
          padding: 24px;
          font-size: 14px;
        }

        .media-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
          margin-bottom: 8px;
          align-items: center;
          border: 1px solid #e5e7eb;
        }

        .media-item__preview {
          width: 80px;
          height: 80px;
          border-radius: 6px;
          overflow: hidden;
          background: white;
          flex-shrink: 0;
        }

        .media-item__preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .media-item__placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e5e7eb;
          color: #6b7280;
          font-size: 12px;
          font-weight: 600;
        }

        .media-item__info {
          flex: 1;
        }

        .media-item__info h5 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .media-item__info p {
          margin: 0;
          font-size: 12px;
          color: #9ca3af;
        }

        .media-item__actions {
          display: flex;
          gap: 8px;
        }

        .notice-item {
          padding: 16px;
          border-radius: 8px;
          border: 1px solid;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .notice-item--info {
          background: #dbeafe;
          border-color: #93c5fd;
        }

        .notice-item--warning {
          background: #fef3c7;
          border-color: #fcd34d;
        }

        .notice-item--alert {
          background: #fee2e2;
          border-color: #fca5a5;
        }

        .notice-item--success {
          background: #dcfce7;
          border-color: #86efac;
        }

        .notice-item__content h5 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
        }

        .notice-item__content p {
          margin: 0 0 8px 0;
          font-size: 13px;
        }

        .notice-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 12px;
          text-transform: uppercase;
        }

        .notice-badge--info {
          background: rgba(59, 130, 246, 0.1);
          color: #1e40af;
        }

        .notice-badge--warning {
          background: rgba(217, 119, 6, 0.1);
          color: #92400e;
        }

        .notice-badge--alert {
          background: rgba(220, 38, 38, 0.1);
          color: #7f1d1d;
        }

        .notice-badge--success {
          background: rgba(34, 197, 94, 0.1);
          color: #15803d;
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

        .btn--primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn--secondary {
          background: #e5e7eb;
          color: #374151;
        }

        .btn--secondary:hover {
          background: #d1d5db;
        }

        .btn--large {
          width: 100%;
          padding: 12px;
        }

        .btn--icon {
          padding: 8px;
          width: 36px;
          height: 36px;
          border-radius: 6px;
        }

        .btn--danger {
          background: #fee2e2;
          color: #dc2626;
        }

        .btn--danger:hover {
          background: #fecaca;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </motion.div>
  );
};

export default MiWebpage;
