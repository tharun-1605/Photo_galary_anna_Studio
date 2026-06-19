import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, 
  Calendar, 
  FolderOpen, 
  Image as ImageIcon, 
  Eye, 
  Download, 
  Heart,
  Lock,
  Search,
  X
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { api } from '../api';

const DashboardCollections = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [stats, setStats] = useState({
    totalCollections: 0,
    totalPhotos: 0,
    totalEnterGallery: 0,
    totalDownloads: 0,
    totalFavorites: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDate, setNewCollectionDate] = useState('');
  const [createError, setCreateError] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const cols = await api.collections.getAll();
      setCollections(cols);

      const summaryData = await api.activity.getSummary();
      if (summaryData && summaryData.summary) {
        setStats(summaryData.summary);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    setCreateError(null);
    if (!newCollectionName.trim()) {
      setCreateError('Collection name is required');
      return;
    }

    try {
      setCreateLoading(true);
      const newCol = await api.collections.create(newCollectionName, newCollectionDate);
      setIsModalOpen(false);
      setNewCollectionName('');
      setNewCollectionDate('');
      // Redirect to the collection edit page
      navigate(`/admin/collections/${newCol._id}`);
    } catch (err) {
      console.error(err);
      setCreateError(err.message || 'Failed to create collection');
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredCollections = collections.filter(col => 
    col.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      {/* Summary Cards */}
      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-icon">
            <FolderOpen size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalCollections}</span>
            <span className="stat-label">Collections</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <ImageIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalPhotos}</span>
            <span className="stat-label">Photos Stored</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Eye size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalEnterGallery}</span>
            <span className="stat-label">Gallery Visits</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Download size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalDownloads}</span>
            <span className="stat-label">Downloads</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search collections..." 
            className="form-control" 
            style={{ width: '100%', paddingLeft: '38px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button 
          className="btn btn-primary" 
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} />
          <span>New Collection</span>
        </button>
      </div>

      {/* Collection Grid */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading your workspace collections...
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="card" style={{ padding: '80px 40px', textAlign: 'center', borderStyle: 'dashed' }}>
          <FolderOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', display: 'inline-block' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No collections found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
            {searchQuery ? "Try refining your search text." : "Get started by creating your very first client collection."}
          </p>
          {!searchQuery && (
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} />
              <span>Create Collection</span>
            </button>
          )}
        </div>
      ) : (
        <div className="collections-grid">
          {filteredCollections.map((col) => (
            <div 
              key={col._id} 
              className="collection-card"
              onClick={() => navigate(`/admin/collections/${col._id}`)}
            >
              {col.coverPhoto ? (
                <img 
                  src={`http://localhost:5000${col.coverPhoto}`} 
                  alt={col.name} 
                  className="collection-cover-img" 
                />
              ) : (
                <div className="collection-cover-placeholder">
                  <ImageIcon size={32} />
                </div>
              )}
              
              <div className="collection-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <h3 className="collection-card-name" style={{ margin: 0 }}>{col.name}</h3>
                  <span className={`status-badge ${col.settings?.status?.toLowerCase() || 'published'}`}>
                    {col.settings?.status || 'Published'}
                  </span>
                </div>
                
                <div className="collection-card-meta" style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    <span>
                      {col.eventDate ? new Date(col.eventDate).toLocaleDateString() : 'No date'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span title="Photos Count" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <ImageIcon size={12} />
                      {col.photos?.length || 0}
                    </span>
                    {col.settings?.password && (
                      <span title="Password Protected">
                        <Lock size={12} style={{ color: 'var(--text-muted)' }} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Collection Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Create New Collection</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {createError && (
              <div style={{ padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateCollection} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Collection Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="e.g. Sarah & Michael Wedding" 
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Event Date (Optional)</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={newCollectionDate}
                  onChange={(e) => setNewCollectionDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={createLoading}
                >
                  {createLoading ? 'Creating...' : 'Create & Edit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default DashboardCollections;
