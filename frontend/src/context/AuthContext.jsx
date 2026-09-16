import React, { createContext, useState, useEffect } from 'react';
import { api } from '../api';

export const AuthContext = createContext(null);

const CACHE_KEY = 'andropedia_cached_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return !localStorage.getItem(CACHE_KEY);
    } catch {
      return true;
    }
  });

  const updateCachedUser = (userData) => {
    setUser(userData);
    try {
      if (userData) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(userData));
      } else {
        localStorage.removeItem(CACHE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  };

  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      try {
        // Use raw fetch to avoid triggering api.js redirect on 401 during initial load
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (!isMounted) return;
        if (response.ok) {
          const userData = await response.json();
          updateCachedUser(userData);
        } else {
          updateCachedUser(null);
        }
      } catch (error) {
        if (!isMounted) return;
        // In case of transient network error, do not immediately wipe cached user if offline
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    checkSession();
    return () => { isMounted = false; };
  }, []);

  const login = async (email, password) => {
    const userData = await api.post('/auth/login', { email, password });
    updateCachedUser(userData);
    return userData;
  };

  const adminLogin = async (email, password) => {
    const userData = await api.post('/auth/admin-login', { email, password });
    updateCachedUser(userData);
    return userData;
  };

  const signup = async (name, email, password) => {
    const userData = await api.post('/auth/signup', { name, email, password });
    updateCachedUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout failed', e);
    }
    updateCachedUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, adminLogin, signup, logout, setUser: updateCachedUser }}>
      {children}
    </AuthContext.Provider>
  );
};
