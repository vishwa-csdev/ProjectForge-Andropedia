import React, { createContext, useState, useEffect } from 'react';
import { api } from '../api';
import { neonAuth } from '../auth';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (neonAuth) {
          const sessionResult = await neonAuth.getSession();
          if (sessionResult.data?.session) {
            setUser(await api.get('/auth/me'));
          } else {
            const response = await fetch('/api/auth/me', { credentials: 'include' });
            setUser(response.ok ? await response.json() : null);
          }
        } else {
          // Keep local development compatible when Neon Auth is not configured.
          const response = await fetch('/api/auth/me', { credentials: 'include' });
          setUser(response.ok ? await response.json() : null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email, password) => {
    let userData;
    if (neonAuth) {
      const result = await neonAuth.signIn.email({ email, password });
      if (!result.error) {
        userData = await api.get('/auth/me');
      } else {
        // Existing accounts may still have credentials in the legacy users table.
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
          throw new Error(result.error.message || 'Authentication failed');
        }
        userData = await response.json();
      }
    } else {
      userData = await api.post('/auth/login', { email, password });
    }
    setUser(userData);
    return userData;
  };

  const signup = async (name, email, password) => {
    let userData;
    if (neonAuth) {
      const result = await neonAuth.signUp.email({ name, email, password });
      if (result.error) throw new Error(result.error.message || 'Registration failed');
      userData = await api.get('/auth/me');
    } else {
      userData = await api.post('/auth/signup', { name, email, password });
    }
    setUser(userData);
  };

  const logout = async () => {
    try {
      if (neonAuth) {
        await neonAuth.signOut();
      } else {
        await api.post('/auth/logout');
      }
    } catch (e) {
      console.error('Logout failed', e);
    }
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
