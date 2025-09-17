import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { isAuthenticated } from '~/utils/auth';

export const useAuthRedirect = (requireAuth = true, redirectPath = '/login') => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      
      if (requireAuth && !authenticated) {
        // Redirect to login if authentication is required but user is not authenticated
        navigate(redirectPath, { replace: true });
      } else if (!requireAuth && authenticated) {
        // Redirect away from auth pages if user is already authenticated
        navigate(redirectPath === '/login' ? '/dashboard' : redirectPath, { replace: true });
      }
    };

    checkAuth();
  }, [navigate, requireAuth, redirectPath]);

  return null;
};
