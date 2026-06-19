import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Calendar, ArrowRight, Lock } from 'lucide-react';
import { api } from '../api';

const Home = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicCollections = async () => {
      try {
        const data = await api.public.getCollections();
        setCollections(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load portfolio galleries.');
      } finally {
        setLoading(false);
      }
    };
    fetchPublicCollections();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#faf6f0', color: '#2d2219' }}>
      {/* Premium Studio Navigation */}
      <nav style={{ padding: '24px 40px', borderBottom: '1px solid #e3d5c5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#faf6f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Camera size={22} style={{ color: '#4a3626' }} />
          <span style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.02em', textTransform: 'uppercase', fontFamily: "'Playfair Display', serif" }}>
            ANNA STUDIO
          </span>
        </div>
        <div style={{ display: 'flex', gap: '24px', fontSize: '14px', fontWeight: '600' }}>
          <Link to="/admin/collections" style={{ color: '#4a3626', textDecoration: 'none' }}>
            Photographer Login
          </Link>
        </div>
      </nav>

      {/* Hero Showcase Banner */}
      <header style={{ padding: '120px 24px', textAlign: 'center', borderBottom: '1px solid #e3d5c5', background: 'radial-gradient(circle, rgba(244,234,224,0.6) 0%, rgba(250,246,240,1) 70%)' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '12px', fontWeight: '700', color: '#9c8e80', marginBottom: '16px' }}>
          Professional Client Photo Galleries
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '48px', fontWeight: '400', lineHeight: 1.15, maxWidth: '800px', margin: '0 auto 24px auto', color: '#2d2219' }}>
          Preserving your most beautiful memories in timeless collections.
        </h1>
        <div style={{ width: '40px', height: '1px', backgroundColor: '#9c8e80', margin: '0 auto 24px auto' }}></div>
        <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '15px', color: '#5c4b3c', lineHeight: 1.6 }}>
          Welcome to our gallery workspace. Here, our clients can preview, download, and catalog their favorite captures from weddings, portraits, and milestones.
        </p>
      </header>

      {/* Main Portfolio Galleries Showcase */}
      <main style={{ flex: 1, padding: '60px 40px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: '400', marginBottom: '32px', textAlign: 'center' }}>
          Recent Galleries
        </h2>

        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#9c8e80' }}>Loading galleries...</div>
        ) : error ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#ef4444' }}>{error}</div>
        ) : collections.length === 0 ? (
          <div style={{ padding: '120px 0', textAlign: 'center' }}>
            <p style={{ color: '#9c8e80', fontSize: '15px', marginBottom: '24px' }}>No public galleries available at this moment.</p>
            <Link to="/admin/collections" className="btn btn-primary" style={{ backgroundColor: '#4a3626', color: '#faf6f0', border: 'none' }}>
              Create Your First Gallery
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '32px' }}>
            {collections.map((col) => (
              <Link 
                to={`/gallery/${col.slug}`} 
                key={col._id} 
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: '16px', group: 'true', cursor: 'pointer' }}
              >
                <div style={{ width: '100%', aspectRatio: '16/10', overflow: 'hidden', borderRadius: '4px', backgroundColor: '#eae0d3', position: 'relative', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  {col.coverPhoto ? (
                    <img 
                      src={`http://localhost:5000${col.coverPhoto}`} 
                      alt={col.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: '#9c8e80', fontSize: '13px' }}>
                      No cover image set
                    </div>
                  )}
                  {col.settings?.password && (
                    <div style={{ position: 'absolute', top: '16px', right: '16px', padding: '6px 10px', borderRadius: '20px', backgroundColor: 'rgba(45,34,25,0.85)', backdropFilter: 'blur(4px)', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '500' }}>
                      <Lock size={12} />
                      <span>Password Protected</span>
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '400', margin: 0, color: '#2d2219' }}>
                      {col.name}
                    </h3>
                    <ArrowRight size={16} style={{ color: '#9c8e80' }} />
                  </div>
                  {col.eventDate && (
                    <div style={{ fontSize: '12px', color: '#9c8e80', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={12} />
                      <span>{new Date(col.eventDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ padding: '40px', borderTop: '1px solid #e3d5c5', textAlign: 'center', fontSize: '13px', color: '#9c8e80', backgroundColor: '#f4eae0' }}>
        <p style={{ marginBottom: '8px' }}>&copy; {new Date().getFullYear()} Anna Studio. Powered by Pixieset Client Gallery.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px' }}>
          <Link to="/admin/collections" style={{ color: '#5c4b3c', textDecoration: 'underline' }}>
            Admin Panel
          </Link>
          <span>&middot;</span>
          <a href="#" style={{ color: '#5c4b3c', textDecoration: 'none' }}>Privacy Policy</a>
          <span>&middot;</span>
          <a href="#" style={{ color: '#5c4b3c', textDecoration: 'none' }}>Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};

export default Home;
