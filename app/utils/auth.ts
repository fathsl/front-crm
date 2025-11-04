import { userAtom } from './userAtom';
import { useAtom } from 'jotai';

export const useAuth = () => {
  const [, setUser] = useAtom(userAtom);

  const logout = () => {
    setUser(null);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    window.location.href = '/login';
  };

  return { logout };
};

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('user');
};
export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};
