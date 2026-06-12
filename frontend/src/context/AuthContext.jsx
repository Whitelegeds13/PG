import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import api from '../services/api';

const AuthContext = createContext(null);
const tokenKey = 'palacio_gamer_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(tokenKey)));

  useEffect(() => {
    const token = localStorage.getItem(tokenKey);

    if (!token) {
      return;
    }

    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem(tokenKey))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    loading,
    user,
    async login(credentials) {
      const { data } = await api.post('/auth/login', credentials);
      localStorage.setItem(tokenKey, data.token);
      setUser(data.user);
      return data.user;
    },
    async register(payload) {
      const { data } = await api.post('/auth/register', payload);
      localStorage.setItem(tokenKey, data.token);
      setUser(data.user);
      return data.user;
    },
    logout() {
      localStorage.removeItem(tokenKey);
      setUser(null);
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
