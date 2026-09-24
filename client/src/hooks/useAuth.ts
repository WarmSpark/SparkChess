import { useAuthStore } from '../store/authStore';
import api from '../api';

export const useAuth = () => {
  const { user, token, setAuth, logout, isAuthenticated } = useAuthStore();

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    setAuth(res.data.user, res.data.token);
    return res.data;
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await api.post('/api/auth/register', { username, email, password });
    setAuth(res.data.user, res.data.token);
    return res.data;
  };

  return { user, token, login, register, logout, isAuthenticated };
};
