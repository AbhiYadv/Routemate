import { create } from 'zustand';
import { api } from '../utils/api';
import { setItem, removeItem, getItem } from '../utils/storage';

interface User {
  id: string;
  company_id: string;
  name: string;
  email: string;
  role: string;
  home_area?: string;
  office_location_id?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await setItem('access_token', data.access_token);
      set({ user: data.user, token: data.access_token, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await removeItem('access_token');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await getItem('access_token');
      if (!token) {
        set({ user: null, token: null, isLoading: false });
        return;
      }
      const { data } = await api.get('/auth/me');
      set({ user: data, token, isLoading: false });
    } catch (error) {
      await removeItem('access_token');
      set({ user: null, token: null, isLoading: false });
    }
  },
}));
