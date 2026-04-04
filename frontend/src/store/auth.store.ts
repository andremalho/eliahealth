import { create } from 'zustand';

interface User {
  userId: string;
  email: string;
  role: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const storedToken = localStorage.getItem('elia_token');
  const storedUser = localStorage.getItem('elia_user');

  return {
    token: storedToken,
    user: storedUser ? JSON.parse(storedUser) : null,
    isAuthenticated: !!storedToken,

    login: (token, user) => {
      localStorage.setItem('elia_token', token);
      localStorage.setItem('elia_user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem('elia_token');
      localStorage.removeItem('elia_user');
      set({ token: null, user: null, isAuthenticated: false });
    },
  };
});
