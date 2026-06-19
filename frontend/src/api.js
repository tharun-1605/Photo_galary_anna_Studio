const API_BASE_URL = 'http://localhost:5000/api';

// Helper to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('adminToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const api = {
  // Authentication
  auth: {
    login: async (email, password) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      const data = await response.json();
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data));
      return data;
    },
    register: async (email, password, studioName) => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, studioName })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
      const data = await response.json();
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data));
      return data;
    },
    me: async () => {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      return await response.json();
    },
    updateProfile: async (profileData) => {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(profileData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
      const data = await response.json();
      localStorage.setItem('adminUser', JSON.stringify(data));
      return data;
    },
    logout: () => {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    },
    isAuthenticated: () => {
      return !!localStorage.getItem('adminToken');
    }
  },

  // Collections (Admin)
  collections: {
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/collections`, {
        headers: getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to fetch collections');
      return await response.json();
    },
    getById: async (id) => {
      const response = await fetch(`${API_BASE_URL}/collections/${id}`, {
        headers: getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to fetch collection');
      return await response.json();
    },
    create: async (name, eventDate) => {
      const response = await fetch(`${API_BASE_URL}/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ name, eventDate })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create collection');
      }
      return await response.json();
    },
    update: async (id, data) => {
      const response = await fetch(`${API_BASE_URL}/collections/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update collection');
      return await response.json();
    },
    delete: async (id) => {
      const response = await fetch(`${API_BASE_URL}/collections/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to delete collection');
      return await response.json();
    },
    uploadPhotos: async (id, files, set = 'Highlights', onProgress) => {
      const formData = new FormData();
      formData.append('set', set);
      for (let i = 0; i < files.length; i++) {
        formData.append('photos', files[i]);
      }

      // We'll use simple fetch, progress can be added if using XMLHttpRequest
      const response = await fetch(`${API_BASE_URL}/collections/${id}/photos`, {
        method: 'POST',
        headers: getAuthHeader(), // Multer handles content-type boundary automatically, do NOT set Content-Type header manually
        body: formData
      });
      if (!response.ok) throw new Error('Failed to upload photos');
      return await response.json();
    },
    deletePhoto: async (id, photoId) => {
      const response = await fetch(`${API_BASE_URL}/collections/${id}/photos/${photoId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to delete photo');
      return await response.json();
    },
    updatePhotoSet: async (id, photoId, set) => {
      const response = await fetch(`${API_BASE_URL}/collections/${id}/photos/${photoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ set })
      });
      if (!response.ok) throw new Error('Failed to update photo set');
      return await response.json();
    },
    setCover: async (id, coverPhoto) => {
      const response = await fetch(`${API_BASE_URL}/collections/${id}/cover`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ coverPhoto })
      });
      if (!response.ok) throw new Error('Failed to set cover photo');
      return await response.json();
    },
    addSet: async (id, setName) => {
      const response = await fetch(`${API_BASE_URL}/collections/${id}/sets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ setName })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add set');
      }
      return await response.json();
    },
    deleteSet: async (id, setName) => {
      const response = await fetch(`${API_BASE_URL}/collections/${id}/sets/${setName}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to delete set');
      return await response.json();
    }
  },

  // Public Client Gallery
  public: {
    getCollections: async () => {
      const response = await fetch(`${API_BASE_URL}/public/collections`);
      if (!response.ok) throw new Error('Failed to fetch public collections');
      return await response.json();
    },
    getGallery: async (slug, password = '') => {
      const url = `${API_BASE_URL}/public/collections/${slug}${password ? `?password=${encodeURIComponent(password)}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch gallery');
      }
      return await response.json();
    },
    unlockGallery: async (slug, password) => {
      const response = await fetch(`${API_BASE_URL}/public/collections/${slug}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!response.ok) throw new Error('Incorrect password');
      return await response.json();
    },
    logActivity: async (slug, email, actionType, details = '') => {
      const response = await fetch(`${API_BASE_URL}/public/collections/${slug}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, actionType, details })
      });
      return response.ok ? await response.json() : null;
    },
    getFavorites: async (slug, email) => {
      const response = await fetch(`${API_BASE_URL}/public/collections/${slug}/favorites?email=${encodeURIComponent(email)}`);
      if (!response.ok) throw new Error('Failed to fetch favorites');
      return await response.json();
    },
    toggleFavorite: async (slug, email, photoUrl) => {
      const response = await fetch(`${API_BASE_URL}/public/collections/${slug}/favorites/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, photoUrl })
      });
      if (!response.ok) throw new Error('Failed to toggle favorite');
      return await response.json();
    },
    getDownloadPhotoUrl: (slug, email, photoUrl, pin = '') => {
      return `${API_BASE_URL}/public/collections/${slug}/download-photo?email=${encodeURIComponent(email)}&photoUrl=${encodeURIComponent(photoUrl)}${pin ? `&pin=${encodeURIComponent(pin)}` : ''}`;
    },
    getDownloadZipUrl: (slug, email, pin = '', onlyFavorites = false) => {
      return `${API_BASE_URL}/public/collections/${slug}/download-zip?email=${encodeURIComponent(email)}${pin ? `&pin=${encodeURIComponent(pin)}` : ''}${onlyFavorites ? `&onlyFavorites=true` : ''}`;
    }
  },

  // Activity & Feed (Admin)
  activity: {
    getLogs: async () => {
      const response = await fetch(`${API_BASE_URL}/activity`, {
        headers: getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to fetch activity logs');
      return await response.json();
    },
    getSummary: async () => {
      const response = await fetch(`${API_BASE_URL}/activity/summary`, {
        headers: getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to fetch stats summary');
      return await response.json();
    }
  }
};
