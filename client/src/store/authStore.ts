import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  updateElo: (elo: number) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token });
      },
      updateElo: (elo) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, elo } });
        }
      },
      refreshUser: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const res = await api.get('/api/users/me');
          if (res.data) {
            const currentUser = get().user;
            set({ user: { ...currentUser, ...res.data } });
          }
        } catch {
          return;
        }
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },
      isAuthenticated: () => !!get().token,
    }),
    { name: 'auth-storage' }
  )
);
