import React, { useEffect, useState } from 'react';
import { History, Eye, Download, Star, ExternalLink, RefreshCw } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { api } from '../api';

const DashboardActivity = () => {
  const [logs, setLogs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivityData = async () => {
    try {
      const data = await api.activity.getSummary();
      if (data) {
        setLogs(data.recentActivities || []);
        setFavorites(data.favorites || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivityData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivityData();
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0, textAlign: 'left' }}>Client Activity Center</h2>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={refreshing ? 'spin-animation' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Logs'}</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Retrieving activity history...
        </div>
      ) : (
        <div style={{ textAlign: 'left' }}>
          {/* Summary metrics bar */}
          {summary && (
            <div className="stats-summary" style={{ marginBottom: '32px' }}>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                  <Eye size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{summary.totalEnterGallery}</span>
                  <span className="stat-label">Total Visits</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--success-color)' }}>
                  <Download size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{summary.totalDownloads}</span>
                  <span className="stat-label">Total Downloads</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger-color)' }}>
                  <Star size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{summary.totalFavorites}</span>
                  <span className="stat-label">Total Favorites</span>
                </div>
              </div>
            </div>
          )}

          {/* Activity grids */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
            
            {/* 1. Client Favorites Lists */}
            <div className="card">
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={18} style={{ color: '#ef4444' }} />
                <span>Saved Client Favorites Selection</span>
              </h3>

              {favorites.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                  No clients have created favorites folders yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {favorites.map((fav) => (
                    <div 
                      key={fav._id} 
                      style={{ 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '8px', 
                        padding: '16px',
                        backgroundColor: 'var(--bg-secondary)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {fav.clientEmail}
                          </span>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Collection: <strong style={{ color: 'var(--text-secondary)' }}>{fav.collectionId?.name || 'Deleted Collection'}</strong>
                          </div>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '600', padding: '4px 8px', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}>
                          {fav.photoUrls?.length || 0} Favorited Photos
                        </span>
                      </div>

                      {/* Horizontal list of favorited photos */}
                      {fav.photoUrls && fav.photoUrls.length > 0 ? (
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                          {fav.photoUrls.map((url, idx) => (
                            <a 
                              key={idx}
                              href={`http://localhost:5000${url}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ flexShrink: 0, width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}
                            >
                              <img 
                                src={`http://localhost:5000${url}`} 
                                alt="favorite" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>List is currently empty</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Recent Public Action Logs */}
            <div className="card">
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} />
                <span>Recent Client Interactions Feed</span>
              </h3>

              {logs.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                  No actions logged. Client activity will appear here in real-time.
                </div>
              ) : (
                <div className="activity-table-wrapper">
                  <table className="activity-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Collection</th>
                        <th>Client Email</th>
                        <th>Action Perform</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log._id}>
                          <td style={{ color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleString()}</td>
                          <td style={{ fontWeight: '500' }}>{log.collectionName}</td>
                          <td>{log.clientEmail}</td>
                          <td>
                            <span style={{ 
                              padding: '3px 8px', 
                              borderRadius: '4px', 
                              fontSize: '11px', 
                              fontWeight: '600',
                              backgroundColor: log.actionType === 'Enter Gallery' ? 'rgba(59,130,246,0.1)' : log.actionType.includes('Download') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                              color: log.actionType === 'Enter Gallery' ? '#3b82f6' : log.actionType.includes('Download') ? 'var(--success-color)' : 'var(--danger-color)'
                            }}>
                              {log.actionType}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{log.details || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default DashboardActivity;
