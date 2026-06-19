import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Camera, 
  Download, 
  Heart, 
  Share2, 
  Lock, 
  Unlock,
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  X,
  Calendar,
  Sparkles,
  Mail,
  Copy,
  Check,
  Eye
} from 'lucide-react';
import { api } from '../api';

const ClientGallery = () => {
  const { slug } = useParams();
  
  // Gallery states
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // View states
  const [enteredCover, setEnteredCover] = useState(false);
  const [activeSet, setActiveSet] = useState('Highlights');
  
  // Auth & password
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Client Identity
  const [clientEmail, setClientEmail] = useState(localStorage.getItem('clientEmail') || '');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailModalPurpose, setEmailModalPurpose] = useState(''); // 'favorites' or 'downloads' or 'enter'
  const [tempEmail, setTempEmail] = useState('');
  
  // Downloads & PIN
  const [downloadPin, setDownloadPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinError, setPinError] = useState('');
  const [isZipping, setIsZipping] = useState(false);
  
  // Client Favorites
  const [favoritesList, setFavoritesList] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [slideshowActive, setSlideshowActive] = useState(false);
  const slideshowTimerRef = useRef(null);
  
  // Share tooltip
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Gallery references
  const galleryRef = useRef(null);

  const loadGallery = async (pwd = '') => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.public.getGallery(slug, pwd);
      setGallery(data);

      if (!data.needsPassword) {
        // If client email already stored, fetch their favorites
        if (clientEmail) {
          fetchClientFavorites(data.slug, clientEmail);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error fetching gallery. Please verify the URL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, [slug]);

  const fetchClientFavorites = async (colSlug, email) => {
    try {
      const fav = await api.public.getFavorites(colSlug, email);
      if (fav && fav.photoUrls) {
        setFavoritesList(fav.photoUrls);
      }
    } catch (err) {
      console.error('Failed to load favorites', err);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    try {
      await api.public.unlockGallery(slug, passwordInput);
      loadGallery(passwordInput);
    } catch (err) {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  const handleEnterGallery = () => {
    setEnteredCover(true);
    // Log entry activity if client has email
    if (clientEmail && gallery) {
      api.public.logActivity(gallery.slug, clientEmail, 'Enter Gallery');
    } else {
      // Prompt for email on entry if required by download or favorites
      // For general enter, we can let them browse, and ask email when they favorite or download.
    }
    
    // Smooth scroll down to gallery grid
    setTimeout(() => {
      galleryRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!tempEmail.trim()) return;

    const email = tempEmail.trim().toLowerCase();
    setClientEmail(email);
    localStorage.setItem('clientEmail', email);
    setShowEmailModal(false);
    setTempEmail('');

    // Fetch favorites
    if (gallery) {
      fetchClientFavorites(gallery.slug, email);
      
      // Log activity
      api.public.logActivity(gallery.slug, email, 'Enter Gallery');

      // Continue to target action
      if (emailModalPurpose === 'favorites-toggle') {
        // Handled in trigger
      } else if (emailModalPurpose === 'download-zip') {
        triggerZipDownload(email);
      }
    }
  };

  const handleToggleFavorite = async (photoUrl, e) => {
    if (e) e.stopPropagation();

    if (!clientEmail) {
      setEmailModalPurpose('favorites-toggle');
      setShowEmailModal(true);
      return;
    }

    try {
      const fav = await api.public.toggleFavorite(gallery.slug, clientEmail, photoUrl);
      if (fav && fav.photoUrls) {
        setFavoritesList(fav.photoUrls);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadSingle = (photoUrl, e) => {
    if (e) e.stopPropagation();

    if (!clientEmail) {
      setEmailModalPurpose('download-single');
      setShowEmailModal(true);
      return;
    }

    // Check if gallery has PIN requirement
    if (gallery.settings?.downloads?.pin) {
      // Prompt for pin
      setShowPinModal(true);
      return;
    }

    // Otherwise download directly
    triggerSingleDownload(photoUrl);
  };

  const triggerSingleDownload = (photoUrl) => {
    const url = api.public.getDownloadPhotoUrl(gallery.slug, clientEmail, photoUrl, downloadPin);
    window.open(url, '_blank');
  };

  const handleDownloadFullGallery = () => {
    if (!clientEmail) {
      setEmailModalPurpose('download-zip');
      setShowEmailModal(true);
      return;
    }

    if (gallery.settings?.downloads?.pin && !downloadPin) {
      setShowPinModal(true);
      return;
    }

    triggerZipDownload(clientEmail);
  };

  const triggerZipDownload = (email) => {
    setIsZipping(true);
    const url = api.public.getDownloadZipUrl(gallery.slug, email, downloadPin, showFavoritesOnly);
    window.location.href = url;
    setTimeout(() => {
      setIsZipping(false);
      setShowPinModal(false);
    }, 2000);
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    setPinError('');

    if (downloadPin === gallery.settings.downloads.pin) {
      setShowPinModal(false);
      // Determine what to download: if we clicked zip download
      triggerZipDownload(clientEmail);
    } else {
      setPinError('Invalid Download PIN. Check with your photographer.');
    }
  };

  const handleShareGallery = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setShowShareModal(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === -1) return;
      if (e.key === 'ArrowLeft') handlePrevPhoto();
      if (e.key === 'ArrowRight') handleNextPhoto();
      if (e.key === 'Escape') setLightboxIndex(-1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex]);

  // Slideshow logic
  useEffect(() => {
    if (slideshowActive && lightboxIndex !== -1) {
      slideshowTimerRef.current = setInterval(() => {
        handleNextPhoto();
      }, 3000);
    } else {
      clearInterval(slideshowTimerRef.current);
    }
    return () => clearInterval(slideshowTimerRef.current);
  }, [slideshowActive, lightboxIndex]);

  const handlePrevPhoto = () => {
    const activePhotos = getActivePhotos();
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : activePhotos.length - 1));
  };

  const handleNextPhoto = () => {
    const activePhotos = getActivePhotos();
    setLightboxIndex((prev) => (prev < activePhotos.length - 1 ? prev + 1 : 0));
  };

  const getActivePhotos = () => {
    if (!gallery) return [];
    let photos = gallery.photos;

    // Filter by favorites only
    if (showFavoritesOnly) {
      return photos.filter(p => favoritesList.includes(p.url));
    }

    // Filter by active set tab
    if (activeSet !== 'All') {
      photos = photos.filter(p => p.set === activeSet);
    }
    return photos;
  };

  const activePhotos = getActivePhotos();

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#121212', color: '#fff' }}>Loading client gallery...</div>;
  }

  if (error) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#121212', color: '#fff', padding: '24px' }}>
        <Lock size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
        <h2>Gallery Unavailable</h2>
        <p style={{ color: '#aaa', margin: '8px 0 24px 0' }}>{error}</p>
        <Link to="/" className="btn btn-secondary">Back to Portfolio</Link>
      </div>
    );
  }

  // PASSWORD PROMPT
  if (gallery.needsPassword) {
    return (
      <div className="auth-panel" style={{ backgroundColor: '#0a0a0c', color: '#fff' }}>
        <div className="auth-card" style={{ backgroundColor: '#121216', borderColor: '#272730' }}>
          <div className="auth-header">
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#1b1b22', color: '#fff', marginBottom: '16px' }}>
              <Lock size={24} />
            </div>
            <h2 className="auth-title" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 400 }}>Protected Collection</h2>
            <p className="auth-subtitle" style={{ color: '#64748b' }}>Enter the gallery password provided by the photographer.</p>
          </div>

          {passwordError && (
            <div style={{ padding: '8px 12px', backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', textAlign: 'left' }}>
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input 
                type="password" 
                className="form-control" 
                style={{ width: '100%', backgroundColor: '#1b1b22', borderColor: '#272730', color: '#fff', textAlign: 'center', letterSpacing: '0.2em' }}
                placeholder="PASSWORD"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#fff', color: '#000', width: '100%' }}>
              Unlock Gallery
            </button>
          </form>

          <div style={{ marginTop: '24px', fontSize: '13px' }}>
            <Link to="/" style={{ color: '#cbd5e1', textDecoration: 'underline' }}>Back to Portfolio</Link>
          </div>
        </div>
      </div>
    );
  }

  // Get Custom Class tokens from database
  const design = gallery.settings?.design || {};
  const coverStyleClass = `cover-${(design.coverStyle || 'Full Screen').toLowerCase().replace(' ', '')}`;
  const themeClass = `theme-${(design.colorPalette || 'Light').toLowerCase()}`;
  const typographyClass = `font-${(design.typography || 'Modern').toLowerCase()}`;
  const gridSpacingClass = `spacing-${(design.gridSpacing || 'Normal').toLowerCase()}`;

  return (
    <div className={`public-gallery ${themeClass} ${typographyClass}`}>
      
      {/* 1. Dynamic cover page */}
      {!enteredCover && (
        <div className={`cover-wrapper ${coverStyleClass}`}>
          {gallery.coverPhoto && coverStyleClass !== 'cover-minimalist' && (
            <img 
              src={`http://localhost:5000${gallery.coverPhoto}`} 
              alt={gallery.name} 
              className="cover-bg"
            />
          )}

          {/* Render layouts */}
          {coverStyleClass === 'cover-fullscreen' && (
            <div className="cover-content-center">
              <p>Anna Studio</p>
              <h1>{gallery.name}</h1>
              {gallery.eventDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', margin: '-10px 0 10px 0' }}>
                  <Calendar size={14} />
                  <span>{new Date(gallery.eventDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              )}
              <button className="enter-btn-glass" onClick={handleEnterGallery}>
                Enter Gallery
              </button>
            </div>
          )}

          {coverStyleClass === 'cover-halfscreen' && (
            <div className="cover-content-center">
              <p>Anna Studio</p>
              <h1 style={{ color: 'var(--text-primary)', textShadow: 'none' }}>{gallery.name}</h1>
              <button 
                className="btn btn-primary" 
                style={{ backgroundColor: 'var(--accent-color)', color: 'var(--bg-primary)', borderRadius: '30px', padding: '12px 28px', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em', fontWeight: '600' }}
                onClick={handleEnterGallery}
              >
                Enter Gallery
              </button>
            </div>
          )}

          {coverStyleClass === 'cover-splitscreen' && (
            <div className="cover-splitscreen">
              {gallery.coverPhoto ? (
                <img src={`http://localhost:5000${gallery.coverPhoto}`} alt={gallery.name} className="cover-split-image" />
              ) : (
                <div style={{ backgroundColor: 'var(--bg-tertiary)' }} />
              )}
              <div className="cover-split-info">
                <p style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Anna Studio Collection</p>
                <h1>{gallery.name}</h1>
                {gallery.eventDate && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '32px' }}>
                    {new Date(gallery.eventDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                  </p>
                )}
                <button 
                  className="btn btn-primary" 
                  style={{ borderRadius: '0', padding: '14px 36px', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.15em' }}
                  onClick={handleEnterGallery}
                >
                  Enter Gallery
                </button>
              </div>
            </div>
          )}

          {coverStyleClass === 'cover-centered' && (
            <div className="cover-centered">
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <p style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '12px', color: 'var(--text-muted)' }}>Anna Studio</p>
                <h1 style={{ fontSize: '40px', margin: '8px 0' }}>{gallery.name}</h1>
              </div>
              {gallery.coverPhoto && (
                <img src={`http://localhost:5000${gallery.coverPhoto}`} alt={gallery.name} className="cover-centered-img" />
              )}
              <button 
                className="btn btn-primary" 
                style={{ borderRadius: '30px', padding: '12px 32px', marginTop: '16px', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em' }}
                onClick={handleEnterGallery}
              >
                Enter Gallery
              </button>
            </div>
          )}

          {coverStyleClass === 'cover-minimalist' && (
            <div className="cover-minimalist">
              <p style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>Anna Studio Photography</p>
              <h1 style={{ fontSize: '48px', fontWeight: 300, marginBottom: '24px' }}>{gallery.name}</h1>
              <div style={{ width: '30px', height: '1px', backgroundColor: 'var(--border-color)', margin: '0 auto 24px auto' }}></div>
              <button 
                className="btn btn-primary" 
                style={{ borderRadius: '0', backgroundColor: 'transparent', color: 'var(--text-primary)', borderColor: 'var(--border-color)', padding: '12px 32px', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.15em' }}
                onClick={handleEnterGallery}
              >
                View Collection
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. Main Gallery Page */}
      {enteredCover && (
        <div ref={galleryRef}>
          
          {/* Navigation Bar */}
          <nav className="public-navbar">
            <Link to="/" className="public-logo" style={{ textDecoration: 'none', color: 'inherit' }}>
              ANNA STUDIO
            </Link>

            <div className="public-nav-sets">
              <span 
                className={`public-set-tab ${activeSet === 'All' && !showFavoritesOnly ? 'active' : ''}`}
                onClick={() => {
                  setActiveSet('All');
                  setShowFavoritesOnly(false);
                }}
              >
                All
              </span>
              {gallery.sets?.map((set) => (
                <span 
                  key={set}
                  className={`public-set-tab ${activeSet === set && !showFavoritesOnly ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSet(set);
                    setShowFavoritesOnly(false);
                  }}
                >
                  {set}
                </span>
              ))}

              {gallery.settings?.favorites?.enabled && clientEmail && (
                <span 
                  className={`public-set-tab ${showFavoritesOnly ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', color: showFavoritesOnly ? '#ef4444' : 'inherit' }}
                  onClick={() => {
                    setShowFavoritesOnly(true);
                  }}
                >
                  <Heart size={12} fill={showFavoritesOnly ? '#ef4444' : 'none'} />
                  Favorites ({favoritesList.length})
                </span>
              )}
            </div>

            <div className="public-nav-actions">
              {gallery.settings?.downloads?.enabled && (
                <button 
                  className="btn btn-secondary btn-sm" 
                  title="Download photos zip"
                  onClick={handleDownloadFullGallery}
                >
                  <Download size={14} />
                  <span>Download Zip</span>
                </button>
              )}
              <button 
                className="btn btn-secondary btn-sm" 
                title="Share link"
                onClick={handleShareGallery}
              >
                <Share2 size={14} />
                <span>Share</span>
              </button>
            </div>
          </nav>

          {/* Collection Metadata Details header */}
          <div style={{ padding: '60px 40px 20px 40px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
            <h2 style={{ fontSize: '32px', fontFamily: 'var(--font-heading)', fontWeight: 300 }}>{gallery.name}</h2>
            {gallery.eventDate && (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                {new Date(gallery.eventDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>

          {/* Photo Masonry Grid */}
          {activePhotos.length === 0 ? (
            <div className="favorites-empty">
              {showFavoritesOnly ? (
                <div>
                  <Heart size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                  <p>You haven't favorited any photos yet.</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>Click the heart icon on any photo to save it to your favorites list.</p>
                </div>
              ) : (
                <p>No photos available in this set.</p>
              )}
            </div>
          ) : (
            <div className={`public-gallery-grid ${gridSpacingClass}`}>
              {activePhotos.map((photo, index) => {
                const isFav = favoritesList.includes(photo.url);
                return (
                  <div 
                    key={photo._id} 
                    className="public-photo-item"
                    onClick={() => setLightboxIndex(index)}
                  >
                    <img 
                      src={`http://localhost:5000${photo.url}`} 
                      alt={photo.filename} 
                    />
                    
                    <div className="public-photo-overlay">
                      <div className="public-photo-actions">
                        {gallery.settings?.favorites?.enabled && (
                          <button 
                            className={`public-photo-btn ${isFav ? 'active' : ''}`}
                            onClick={(e) => handleToggleFavorite(photo.url, e)}
                            title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                          >
                            <Heart size={14} fill={isFav ? "white" : "none"} style={{ color: isFav ? 'white' : 'black' }} />
                          </button>
                        )}
                        {gallery.settings?.downloads?.enabled && (
                          <button 
                            className="public-photo-btn"
                            onClick={(e) => handleDownloadSingle(photo.url, e)}
                            title="Download Photo"
                          >
                            <Download size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating preview return button for admin review */}
          {api.auth.isAuthenticated() && (
            <Link to={`/admin/collections/${gallery._id}`} className="preview-badge">
              <Camera size={14} />
              <span>Back to Editor Panel</span>
            </Link>
          )}
        </div>
      )}

      {/* 3. LIGHTBOX COMPONENT */}
      {lightboxIndex !== -1 && activePhotos[lightboxIndex] && (
        <div className="lightbox-overlay">
          
          {/* Top toolbar */}
          <div className="lightbox-toolbar">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setSlideshowActive(!slideshowActive)}
              style={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none' }}
              title={slideshowActive ? "Pause Slideshow" : "Start Slideshow"}
            >
              {slideshowActive ? <Pause size={14} /> : <Play size={14} />}
              <span>{slideshowActive ? 'Pause' : 'Play Slideshow'}</span>
            </button>

            {gallery.settings?.favorites?.enabled && (
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => handleToggleFavorite(activePhotos[lightboxIndex].url)}
                style={{ 
                  color: favoritesList.includes(activePhotos[lightboxIndex].url) ? '#ef4444' : '#fff', 
                  backgroundColor: 'rgba(255,255,255,0.1)', 
                  border: 'none' 
                }}
              >
                <Heart size={14} fill={favoritesList.includes(activePhotos[lightboxIndex].url) ? '#ef4444' : 'none'} />
                <span>Favorite</span>
              </button>
            )}

            {gallery.settings?.downloads?.enabled && (
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => handleDownloadSingle(activePhotos[lightboxIndex].url)}
                style={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none' }}
              >
                <Download size={14} />
                <span>Download</span>
              </button>
            )}
          </div>

          <button className="lightbox-close" onClick={() => setLightboxIndex(-1)}>
            <X size={28} />
          </button>

          {/* Navigation */}
          <button className="lightbox-nav prev" onClick={handlePrevPhoto}>
            <ChevronLeft size={36} />
          </button>

          <div className="lightbox-container">
            <img 
              src={`http://localhost:5000${activePhotos[lightboxIndex].url}`} 
              alt={activePhotos[lightboxIndex].filename} 
              className="lightbox-img"
            />
            <span className="lightbox-caption">
              {activePhotos[lightboxIndex].filename} ({lightboxIndex + 1} / {activePhotos.length}) &middot; Set: {activePhotos[lightboxIndex].set}
            </span>
          </div>

          <button className="lightbox-nav next" onClick={handleNextPhoto}>
            <ChevronRight size={36} />
          </button>

        </div>
      )}

      {/* 4. CLIENT EMAIL REGISTRATION OVERLAY */}
      {showEmailModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)', maxWidth: '420px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, fontFamily: 'var(--font-heading)' }}>Enter Gallery</h2>
              <button className="modal-close" onClick={() => setShowEmailModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Please register your email address to save favorites, select photos, and download files from this gallery.
            </p>

            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    className="form-control" 
                    style={{ width: '100%', paddingLeft: '38px' }}
                    required
                    placeholder="client@example.com"
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Register & Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. DOWNLOAD PIN OVERLAY */}
      {showPinModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)', maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, fontFamily: 'var(--font-heading)' }}>Download PIN Required</h2>
              <button className="modal-close" onClick={() => setShowPinModal(false)}>
                <X size={20} />
              </button>
            </div>

            {pinError && (
              <div style={{ padding: '8px 12px', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger-color)', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
                {pinError}
              </div>
            )}

            <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">4-digit Download PIN</label>
                <input 
                  type="text" 
                  maxLength={4}
                  className="form-control" 
                  style={{ width: '100%', textAlign: 'center', fontSize: '20px', letterSpacing: '0.25em' }}
                  required
                  placeholder="0 0 0 0"
                  value={downloadPin}
                  onChange={(e) => setDownloadPin(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isZipping}>
                {isZipping ? 'Zipping files...' : 'Verify PIN & Download'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. SHARE LINK OVERLAY */}
      {showShareModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)', maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, fontFamily: 'var(--font-heading)' }}>Share Collection</h2>
              <button className="modal-close" onClick={() => setShowShareModal(false)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Copy the unique public URL link to share this photo gallery collection.
            </p>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="form-control" 
                style={{ flex: 1, fontSize: '13px' }}
                readOnly
                value={window.location.href}
              />
              <button 
                className="btn btn-primary"
                onClick={handleShareGallery}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClientGallery;
