import React, { useEffect, useState } from 'react';
import { Camera, Lock, User, Check, AlertCircle } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { api } from '../api';

const DashboardSettings = () => {
  const [email, setEmail] = useState('');
  const [studioName, setStudioName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('adminUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      setEmail(user.email);
      setStudioName(user.studioName || 'Anna Studio');
    }
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const updateData = {
        email,
        studioName
      };

      if (newPassword) {
        updateData.password = newPassword;
      }

      await api.auth.updateProfile(updateData);
      setSuccess('Profile updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      
      // Trigger a window custom event to notify parent layouts to refresh studioName
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update profile settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: '700px', textAlign: 'left' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px' }}>Studio Configuration</h2>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
            <Check size={18} />
            <span>{success}</span>
          </div>
        )}

        <div className="card">
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="settings-section-title" style={{ marginBottom: 0 }}>Photographer Credentials</div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Studio branding name</label>
              <div style={{ position: 'relative' }}>
                <Camera size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ width: '100%', paddingLeft: '38px' }}
                  required
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                This is displayed on client galleries headers, cover pages, and emails.
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="settings-section-title" style={{ marginTop: '16px', marginBottom: 0 }}>Security Configuration</div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">New Password (leave empty to keep current)</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  className="form-control" 
                  style={{ width: '100%', paddingLeft: '38px' }}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  className="form-control" 
                  style={{ width: '100%', paddingLeft: '38px' }}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving adjustments...' : 'Save Settings'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardSettings;
