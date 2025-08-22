import { userAtom } from './userAtom';
import { useAtom } from 'jotai';

export const useAuth = () => {
  const [, setUser] = useAtom(userAtom);

  const logout = () => {
    // Clear user from state
    setUser(null);
    
    // Remove user from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    
    // Optional: Clear any other auth-related data
    // localStorage.removeItem('token');
    
    // Redirect to login page
    window.location.href = '/login';
  };

  return { logout };
};

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('user');
};

// Helper to get current user (useful in non-React contexts)
export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};
