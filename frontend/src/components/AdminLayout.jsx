import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Camera, 
  LayoutGrid, 
  Settings, 
  History, 
  LogOut, 
  User 
} from 'lucide-react';
import { api } from '../api';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      navigate('/admin/login');
    } else {
      const user = localStorage.getItem('adminUser');
      if (user) {
        setAdminUser(JSON.parse(user));
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    api.auth.logout();
    navigate('/admin/login');
  };

  if (!adminUser) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Admin Workspace...</div>;
  }

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Camera size={24} style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline-block' }} />
            <span>{adminUser.studioName || 'Anna Studio'}</span>
          </div>
          <span className="sidebar-subtitle">Pixieset Panel</span>
        </div>

        <nav className="sidebar-nav">
          <Link to="/admin/collections" className={`sidebar-link ${isActive('/admin/collections')}`}>
            <LayoutGrid size={18} />
            <span>Collections</span>
          </Link>
          <Link to="/admin/activities" className={`sidebar-link ${isActive('/admin/activities')}`}>
            <History size={18} />
            <span>Activity Feed</span>
          </Link>
          <Link to="/admin/settings" className={`sidebar-link ${isActive('/admin/settings')}`}>
            <Settings size={18} />
            <span>Studio Settings</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-user-name">{adminUser.studioName}</span>
            <span className="sidebar-user-email">{adminUser.email}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main content body */}
      <main className="main-content">
        <header className="navbar">
          <div className="navbar-title">
            {location.pathname.includes('/collections/') ? 'Collection Settings' : 
             location.pathname.includes('/activities') ? 'Client Activity feed' : 
             location.pathname.includes('/settings') ? 'Profile & Studio Settings' : 
             'Collections Overview'}
          </div>
          <div className="navbar-actions">
            <Link to="/" className="btn btn-secondary btn-sm" target="_blank">
              View Portfolio
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
              <User size={16} />
              <span>Admin</span>
            </div>
          </div>
        </header>

        <div className="content-body">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
