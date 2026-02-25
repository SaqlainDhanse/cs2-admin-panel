import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && token) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setInitialLoading(false);
  }, [token]);

  const login = async (username, password) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setCurrentUser(data.user);
      return { success: true };
    } else {
      throw new Error(data.error || 'Login failed');
    }
  };

  const logout = async () => {
      try {
          // 1. Inform the backend using fetch
          await fetch('/api/logout', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  // Include the token so the server can invalidate it
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
          });
      } catch (err) {
          console.error("Backend logout failed, but we will clear local data anyway.");
      } finally {
          // 2. Always clear local state to protect the UI
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setCurrentUser(null);
      }
  };

  const authenticatedFetch = async (url, options = {}) => {
    const token = localStorage.getItem('token');

    // Automatically add the Authorization header if the token exists
    const defaultHeaders = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers, // Allow overriding headers
        },
    };

    const response = await fetch(url, config);

    // INTERCEPTOR LOGIC: Detect 401
    if (response.status === 401) {
        console.warn("Session expired or invalid. Logging out...");
        logout();
        throw new Error("Unauthorized - redirected to login");
    }

    return response;
  };

  // Helper to add token to any fetch request
  const authFetch = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      login, 
      logout, 
      authFetch,
      authenticatedFetch,
      isAuthenticated: !!currentUser,
      isAdmin: currentUser?.role === 'Administrator' 
    }}>
      {!initialLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);