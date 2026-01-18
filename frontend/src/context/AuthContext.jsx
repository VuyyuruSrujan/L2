import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import {
  STORAGE_KEYS,
  getFromStorage,
  saveToStorage,
  addToStorage,
  initializeStorage,
} from '../utils/localStorage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeStorage();
    const user = getFromStorage(STORAGE_KEYS.CURRENT_USER);
    if (user) {
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:3000/login', { email, password });
      const user = res.data.user || res.data;
      setCurrentUser(user);
      saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
      // Also persist separate keys for convenience
      try {
        localStorage.setItem('service_app_login_id', user.email || '');
        localStorage.setItem('service_app_role', user.role || '');
      } catch {}
      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid email or password';
      return { success: false, error: message };
    }
  };

  const register = (userData) => {
    const users = getFromStorage(STORAGE_KEYS.USERS) || [];

    const existingUser = users.find((u) => u.email === userData.email);
    if (existingUser) {
      return { success: false, error: 'Email already exists' };
    }

    const newUser = addToStorage(STORAGE_KEYS.USERS, userData);
    const userWithoutPassword = { ...newUser };
    delete userWithoutPassword.password;

    setCurrentUser(userWithoutPassword);
    saveToStorage(STORAGE_KEYS.CURRENT_USER, userWithoutPassword);

    return { success: true, user: userWithoutPassword };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    try {
      localStorage.removeItem('service_app_login_id');
      localStorage.removeItem('service_app_role');
    } catch {}
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
