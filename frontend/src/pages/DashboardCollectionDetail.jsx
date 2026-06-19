import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ImageIcon, 
  Settings as SettingsIcon, 
  Palette, 
  History, 
  Plus, 
  Trash2, 
  Check, 
  ExternalLink, 
  Upload, 
  FolderSync, 
  AlertCircle,
  Lock,
  Download,
  Star,
  Maximize2
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { api } from '../api';

const DashboardCollectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [collection, setCollection] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('photos'); // photos, settings, design, activity
  
  // Photo management state
  const [activeSetFilter, setActiveSetFilter] = useState('All');
  const [newSetName, setNewSetName] = useState('');
  const [showAddSetModal, setShowAddSetModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Settings tab form state
  const [formName, setFormName] = useState('');
  const [formEventDate, setFormEventDate] = useState('');
  const [formStatus, setFormStatus] = useState('Published');
  const [formPassword, setFormPassword] = useState('');
  const [formDownloadsEnabled, setFormDownloadsEnabled] = useState(true);
  const [formDownloadsPin, setFormDownloadsPin] = useState('');
  const [formDownloadsSizes, setFormDownloadsSizes] = useState(['Web Size']);
  const [formRequireEmail, setFormRequireEmail] = useState(true);
  const [formFavoritesEnabled, setFormFavoritesEnabled] = useState(true);
  const [formSocialSharingEnabled, setFormSocialSharingEnabled] = useState(true);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Design tab state
  const [designCoverStyle, setDesignCoverStyle] = useState('Full Screen');
  const [designTypography, setDesignTypography] = useState('Modern');
  const [designColorPalette, setDesignColorPalette] = useState('Light');
  const [designGridSpacing, setDesignGridSpacing] = useState('Normal');

  const fetchCollection = async () => {
    try {
      setLoading(true);
      const data = await api.collections.getById(id);
      setCollection(data);
      
      // Populate settings form
      setFormName(data.name);
      setFormEventDate(data.eventDate ? data.eventDate.substring(0, 10) : '');
      setFormStatus(data.settings?.status || 'Published');
      setFormPassword(data.settings?.password || '');
      setFormDownloadsEnabled(data.settings?.downloads?.enabled !== false);
      setFormDownloadsPin(data.settings?.downloads?.pin || '');
      setFormDownloadsSizes(data.settings?.downloads?.sizes || ['Web Size']);
      setFormRequireEmail(data.settings?.downloads?.requireEmail !== false);
      setFormFavoritesEnabled(data.settings?.favorites?.enabled !== false);
      setFormSocialSharingEnabled(data.settings?.socialSharing?.enabled !== false);

      // Populate design parameters
      setDesignCoverStyle(data.settings?.design?.coverStyle || 'Full Screen');
      setDesignTypography(data.settings?.design?.typography || 'Modern');
      setDesignColorPalette(data.settings?.design?.colorPalette || 'Light');
      setDesignGridSpacing(data.settings?.design?.gridSpacing || 'Normal');

      // Fetch activity logs specific to this collection
      const logs = await api.activity.getLogs();
      const filteredLogs = logs.filter(l => l.collectionId === id);
      setActivities(filteredLogs);

    } catch (err) {
      console.error(err);
      setError('Failed to retrieve collection details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollection();
  }, [id]);

  // Handle setting updates
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSettingsSuccess(false);

    try {
      const updated = await api.collections.update(id, {
        name: formName,
        eventDate: formEventDate || null,
        settings: {
          status: formStatus,
          password: formPassword,
          downloads: {
            enabled: formDownloadsEnabled,
            pin: formDownloadsPin,
            sizes: formDownloadsSizes,
            requireEmail: formRequireEmail
          },
          favorites: {
            enabled: formFavoritesEnabled
          },
          socialSharing: {
            enabled: formSocialSharingEnabled
          },
          design: {
            coverStyle: designCoverStyle,
            typography: designTypography,
            colorPalette: designColorPalette,
            gridSpacing: designGridSpacing
          }
        }
      });
      setCollection(updated);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save settings modifications');
    }
  };

  // Trigger settings saving when design changes
  const handleDesignChange = async (key, value) => {
    let cover = designCoverStyle;
    let typo = designTypography;
    let palette = designColorPalette;
    let spacing = designGridSpacing;

    if (key === 'coverStyle') { cover = value; setDesignCoverStyle(value); }
    if (key === 'typography') { typo = value; setDesignTypography(value); }
    if (key === 'colorPalette') { palette = value; setDesignColorPalette(value); }
    if (key === 'gridSpacing') { spacing = value; setDesignGridSpacing(value); }

    try {
      const updated = await api.collections.update(id, {
        settings: {
          design: {
            coverStyle: cover,
            typography: typo,
            colorPalette: palette,
            gridSpacing: spacing
          }
        }
      });
      setCollection(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // File upload trigger
  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    const uploadSet = activeSetFilter === 'All' ? 'Highlights' : activeSetFilter;

    try {
      const updated = await api.collections.uploadPhotos(id, files, uploadSet);
      setCollection(updated);
    } catch (err) {
      console.error(err);
      setUploadError('Failed to upload photos. Ensure they are valid image formats and the gallery size remains under 3 GB.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      const updated = await api.collections.deletePhoto(id, photoId);
      setCollection(updated);
    } catch (err) {
      console.error(err);
      alert('Failed to delete photo');
    }
  };

  const handleSetCoverPhoto = async (photoUrl) => {
    try {
      const updated = await api.collections.setCover(id, photoUrl);
      setCollection(updated);
    } catch (err) {
      console.error(err);
      alert('Failed to set cover photo');
    }
  };

  const handleUpdatePhotoSet = async (photoId, targetSet) => {
    try {
      const updated = await api.collections.updatePhotoSet(id, photoId, targetSet);
      setCollection(updated);
    } catch (err) {
      console.error(err);
      alert('Failed to move photo to set');
    }
  };

  const handleAddSet = async (e) => {
    e.preventDefault();
    if (!newSetName.trim()) return;

    try {
      const updated = await api.collections.addSet(id, newSetName.trim());
      setCollection(updated);
      setActiveSetFilter(newSetName.trim());
      setNewSetName('');
      setShowAddSetModal(false);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to add set');
    }
  };

  const handleDeleteSet = async (setName) => {
    if (setName === 'Highlights') {
      alert('Cannot delete default set "Highlights"');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete set "${setName}"? All photos inside this set will be reassigned to "Highlights".`)) return;

    try {
      const updated = await api.collections.deleteSet(id, setName);
      setCollection(updated);
      setActiveSetFilter('Highlights');
    } catch (err) {
      console.error(err);
      alert('Failed to delete set');
    }
  };

  const handleDeleteCollection = async () => {
    if (!window.confirm('CRITICAL WARNING: This will permanently delete this entire gallery and all uploaded photos. This action CANNOT be undone. Proceed?')) return;

    try {
      await api.collections.delete(id);
      navigate('/admin/collections');
    } catch (err) {
      console.error(err);
      alert('Failed to delete collection');
    }
  };

  const handleDownloadSizeCheckbox = (size) => {
    if (formDownloadsSizes.includes(size)) {
      if (formDownloadsSizes.length === 1) {
        alert('You must enable at least one resolution size for client downloads.');
        return;
      }
      setFormDownloadsSizes(formDownloadsSizes.filter(s => s !== size));
    } else {
      setFormDownloadsSizes([...formDownloadsSizes, size]);
    }
  };

  // Filter photos to display
  const getFilteredPhotos = () => {
    if (!collection) return [];
    if (activeSetFilter === 'All') return collection.photos;
    return collection.photos.filter(p => p.set === activeSetFilter);
  };

  if (loading) return <AdminLayout><div style={{ padding: '40px', textAlign: 'center' }}>Loading Gallery details...</div></AdminLayout>;
  if (error) return <AdminLayout><div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger-color)' }}>{error}</div></AdminLayout>;
  if (!collection) return <AdminLayout><div style={{ padding: '40px', textAlign: 'center' }}>Collection not found</div></AdminLayout>;

  return (
    <AdminLayout>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/admin/collections" className="btn btn-secondary btn-icon" title="Back to collections">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{collection.name}</h2>
              <span className={`status-badge ${collection.settings?.status?.toLowerCase() || 'published'}`}>
                {collection.settings?.status || 'Published'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'left' }}>
              Slug: /gallery/{collection.slug} &middot; Created: {new Date(collection.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link 
            to={`/gallery/${collection.slug}`} 
            className="btn btn-secondary" 
            target="_blank"
          >
            <ExternalLink size={16} />
            <span>View Public Gallery</span>
          </Link>
          <button 
            className="btn btn-danger" 
            onClick={handleDeleteCollection}
          >
            <Trash2 size={16} />
            <span>Delete Gallery</span>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="tabs-container">
        <div 
          className={`tab-item ${activeTab === 'photos' ? 'active' : ''}`}
          onClick={() => setActiveTab('photos')}
        >
          <ImageIcon size={16} />
          <span>Photos ({collection.photos?.length || 0})</span>
        </div>
        <div 
          className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <SettingsIcon size={16} />
          <span>Gallery Configuration</span>
        </div>
        <div 
          className={`tab-item ${activeTab === 'design' ? 'active' : ''}`}
          onClick={() => setActiveTab('design')}
        >
          <Palette size={16} />
          <span>Layout & Style</span>
        </div>
        <div 
          className={`tab-item ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <History size={16} />
          <span>Client Actions ({activities.length})</span>
        </div>
      </div>

      {/* Active Tab Content */}
      <div style={{ textAlign: 'left' }}>
        
        {/* TABS 1: PHOTOS VIEW */}
        {activeTab === 'photos' && (
          <div>
            {/* Sets management bar */}
            <div className="sets-bar">
              <div className="sets-list">
                <button 
                  className={`set-pill ${activeSetFilter === 'All' ? 'active' : ''}`}
                  onClick={() => setActiveSetFilter('All')}
                >
                  All Photos ({collection.photos?.length || 0})
                </button>
                {collection.sets?.map((set) => (
                  <button 
                    key={set} 
                    className={`set-pill ${activeSetFilter === set ? 'active' : ''}`}
                    onClick={() => setActiveSetFilter(set)}
                  >
                    {set}
                    {set !== 'Highlights' && (
                      <span 
                        className="set-pill-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSet(set);
                        }}
                        title="Delete set"
                      >
                        &times;
                      </span>
                    )}
                  </button>
                ))}
                <button 
                  className="set-pill" 
                  style={{ borderStyle: 'dashed' }}
                  onClick={() => setShowAddSetModal(true)}
                >
                  <Plus size={12} />
                  <span>Add Category Set</span>
                </button>
              </div>
            </div>

            {/* Photo Uploader widget */}
            <div 
              className="dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={32} className="dropzone-icon" />
              <p className="dropzone-text">
                <span className="dropzone-text-highlight">Click to select files</span> or drag and drop photos
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-6px' }}>
                JPEG, PNG or WEBP. Upload up to 3 GB total size for this gallery. Uploading into set: <strong style={{ color: 'var(--text-primary)' }}>{activeSetFilter === 'All' ? 'Highlights' : activeSetFilter}</strong>
              </p>
              <input 
                type="file" 
                ref={fileInputRef}
                style={{ display: 'none' }}
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
              />
              {uploading && (
                <div style={{ marginTop: '8px', color: 'var(--accent-color)', fontWeight: '600', fontSize: '13px' }}>
                  Uploading files to local disk...
                </div>
              )}
            </div>

            {uploadError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', borderRadius: '8px', marginTop: '16px', fontSize: '13px' }}>
                <AlertCircle size={16} />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Photos display list */}
            {getFilteredPhotos().length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                No photos found in category: "{activeSetFilter}". Start uploading images above!
              </div>
            ) : (
              <div className="uploaded-photos-grid">
                {getFilteredPhotos().map((photo) => (
                  <div key={photo._id} className="uploaded-photo-card">
                    <img 
                      src={`http://localhost:5000${photo.url}`} 
                      alt={photo.filename} 
                    />
                    
                    {collection.coverPhoto === photo.url && (
                      <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: '#eab308', color: '#000000', padding: '3px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase' }}>
                        Cover Photo
                      </div>
                    )}
                    
                    <span className="photo-badge-set">{photo.set}</span>

                    <div className="photo-overlay-actions">
                      <button 
                        className="btn btn-secondary btn-sm btn-icon"
                        title="Assign cover photo"
                        style={{ backgroundColor: collection.coverPhoto === photo.url ? '#eab308' : 'white', color: 'black' }}
                        onClick={() => handleSetCoverPhoto(photo.url)}
                      >
                        <ImageIcon size={14} />
                      </button>
                      <button 
                        className="btn btn-danger btn-sm btn-icon"
                        title="Delete photo"
                        onClick={() => handleDeletePhoto(photo._id)}
                      >
                        <Trash2 size={14} />
                      </button>
                      
                      {/* Set assignment dropdown selector */}
                      <select 
                        style={{ position: 'absolute', bottom: '8px', right: '8px', padding: '3px', borderRadius: '4px', fontSize: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', width: '80px' }}
                        value={photo.set}
                        onChange={(e) => handleUpdatePhotoSet(photo._id, e.target.value)}
                      >
                        {collection.sets.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TABS 2: CONFIGURATION SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="settings-section">
            {settingsSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
                <Check size={18} />
                <span>Gallery configuration changes saved successfully.</span>
              </div>
            )}

            {/* General */}
            <div className="settings-section-title">General Info</div>
            <div className="form-group">
              <label className="form-label">Gallery Collection Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Event Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={formEventDate}
                onChange={(e) => setFormEventDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Publish Visibility Status</label>
              <select 
                className="form-control"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
              >
                <option value="Published">Published (Publicly Visible)</option>
                <option value="Hidden">Hidden (Must use direct link, not on portfolio)</option>
                <option value="Draft">Draft (Photographer Admin access only)</option>
              </select>
            </div>

            {/* Privacy & Passwords */}
            <div className="settings-section-title" style={{ marginTop: '32px' }}>Privacy & Security</div>
            <div className="form-group">
              <label className="form-label">Gallery Password (leave empty to make public)</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ width: '100%', paddingLeft: '38px' }}
                  placeholder="e.g. emma2026"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Clients will be prompted to enter this password to gain viewing access to the gallery.
              </span>
            </div>

            {/* Downloads Settings */}
            <div className="settings-section-title" style={{ marginTop: '32px' }}>Client Downloads Config</div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <input 
                type="checkbox" 
                id="enableDownloads"
                checked={formDownloadsEnabled}
                onChange={(e) => setFormDownloadsEnabled(e.target.checked)}
              />
              <label htmlFor="enableDownloads" style={{ fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                Enable Public Gallery Downloads
              </label>
            </div>

            {formDownloadsEnabled && (
              <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '2px solid var(--border-color)', marginBottom: '16px' }}>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Download PIN (leave empty to allow download without PIN)</label>
                  <input 
                    type="text" 
                    maxLength={4}
                    className="form-control"
                    style={{ width: '100%', maxWidth: '160px' }}
                    placeholder="4-digit PIN"
                    value={formDownloadsPin}
                    onChange={(e) => setFormDownloadsPin(e.target.value.replace(/\D/g, ''))}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Require clients to input this 4-digit code before downloading full gallery or single files.
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Available Download Formats</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        id="sizeWeb" 
                        checked={formDownloadsSizes.includes('Web Size')}
                        onChange={() => handleDownloadSizeCheckbox('Web Size')}
                      />
                      <label htmlFor="sizeWeb" style={{ fontSize: '13px', cursor: 'pointer' }}>Web Size (Optimized for quick sharing, fast downloads)</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        id="sizeHighRes" 
                        checked={formDownloadsSizes.includes('High Res')}
                        onChange={() => handleDownloadSizeCheckbox('High Res')}
                      />
                      <label htmlFor="sizeHighRes" style={{ fontSize: '13px', cursor: 'pointer' }}>High Resolution (Print quality size)</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        id="sizeOriginal" 
                        checked={formDownloadsSizes.includes('Original')}
                        onChange={() => handleDownloadSizeCheckbox('Original')}
                      />
                      <label htmlFor="sizeOriginal" style={{ fontSize: '13px', cursor: 'pointer' }}>Original Resolution (Camera resolution files)</label>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="requireEmail"
                    checked={formRequireEmail}
                    onChange={(e) => setFormRequireEmail(e.target.checked)}
                  />
                  <label htmlFor="requireEmail" style={{ fontSize: '13px', cursor: 'pointer' }}>
                    Require email address (logs client identity in Activity feed)
                  </label>
                </div>
              </div>
            )}

            {/* Favorites & Sharing */}
            <div className="settings-section-title" style={{ marginTop: '32px' }}>Client Interactions</div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <input 
                type="checkbox" 
                id="enableFavorites"
                checked={formFavoritesEnabled}
                onChange={(e) => setFormFavoritesEnabled(e.target.checked)}
              />
              <label htmlFor="enableFavorites" style={{ fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                Enable Favoriting / Client Selection
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox" 
                id="enableSocialSharing"
                checked={formSocialSharingEnabled}
                onChange={(e) => setFormSocialSharingEnabled(e.target.checked)}
              />
              <label htmlFor="enableSocialSharing" style={{ fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                Enable Social Media Sharing Links
              </label>
            </div>

            <div style={{ marginTop: '32px' }}>
              <button type="submit" className="btn btn-primary">
                Save Settings Configuration
              </button>
            </div>
          </form>
        )}

        {/* TABS 3: GALLERY DESIGN PRESETS */}
        {activeTab === 'design' && (
          <div style={{ maxWidth: '800px' }}>
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Cover Style Layout</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Select how the landing hero page of the gallery is laid out.</p>
              
              <div className="design-layout-grid">
                {['Full Screen', 'Half Screen', 'Split Screen', 'Centered', 'Minimalist'].map((style) => (
                  <div 
                    key={style}
                    className={`design-option-card ${designCoverStyle === style ? 'active' : ''}`}
                    onClick={() => handleDesignChange('coverStyle', style)}
                  >
                    {style}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Typography Presets</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Set typography styles for titles, headings, and details.</p>
              
              <div className="design-layout-grid">
                {['Modern', 'Classic', 'Editorial'].map((style) => (
                  <div 
                    key={style}
                    className={`design-option-card ${designTypography === style ? 'active' : ''}`}
                    onClick={() => handleDesignChange('typography', style)}
                  >
                    <span style={{ 
                      fontFamily: style === 'Classic' ? 'var(--font-serif)' : 'var(--font-sans)',
                      fontWeight: style === 'Modern' ? '700' : 'normal' 
                    }}>
                      {style}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Color Palette Theme</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Control the ambient style of the gallery backdrop.</p>
              
              <div className="design-layout-grid">
                {['Light', 'Dark', 'Warm', 'Cool'].map((style) => (
                  <div 
                    key={style}
                    className={`design-option-card ${designColorPalette === style ? 'active' : ''}`}
                    onClick={() => handleDesignChange('colorPalette', style)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        border: '1px solid #ccc',
                        backgroundColor: style === 'Light' ? '#fff' : style === 'Dark' ? '#000' : style === 'Warm' ? '#faf6f0' : '#f0f4f8' 
                      }} />
                      {style}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Photo Grid Spacing</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Determine the border margins and gap sizes between photos.</p>
              
              <div className="design-layout-grid">
                {['Normal', 'Compact', 'Loose'].map((style) => (
                  <div 
                    key={style}
                    className={`design-option-card ${designGridSpacing === style ? 'active' : ''}`}
                    onClick={() => handleDesignChange('gridSpacing', style)}
                  >
                    {style}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  handleSaveSettings();
                  alert('Design configurations successfully synced!');
                }}
              >
                Sync Design Presets
              </button>
            </div>
          </div>
        )}

        {/* TABS 4: ACTIVITY LOG */}
        {activeTab === 'activity' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Client Interactions Log</h3>
            {activities.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-primary)' }}>
                No public activities recorded for this collection yet. Once clients enter or interact with the gallery, logs will show here.
              </div>
            ) : (
              <div className="activity-table-wrapper">
                <table className="activity-table">
                  <thead>
                    <tr>
                      <th>Date / Time</th>
                      <th>Client Email</th>
                      <th>Action performed</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((act) => (
                      <tr key={act._id}>
                        <td style={{ color: 'var(--text-muted)' }}>{new Date(act.createdAt).toLocaleString()}</td>
                        <td style={{ fontWeight: '500' }}>{act.clientEmail}</td>
                        <td>
                          <span style={{ 
                            padding: '3px 8px', 
                            borderRadius: '4px', 
                            fontSize: '11px', 
                            fontWeight: '600',
                            backgroundColor: act.actionType === 'Enter Gallery' ? 'rgba(59,130,246,0.1)' : act.actionType.includes('Download') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: act.actionType === 'Enter Gallery' ? '#3b82f6' : act.actionType.includes('Download') ? 'var(--success-color)' : 'var(--danger-color)'
                          }}>
                            {act.actionType}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{act.details || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Add Set Category Modal */}
      {showAddSetModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Add Category Set</h2>
              <button className="modal-close" onClick={() => setShowAddSetModal(false)}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddSet} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Category Name</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. Reception, Ceremony, Portraits"
                  required
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddSetModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Add Set
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default DashboardCollectionDetail;
