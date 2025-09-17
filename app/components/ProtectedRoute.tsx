import { useAtom } from 'jotai';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { userAtom } from '~/utils/userAtom';
import { hasPermission } from '~/utils/permissions';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredPermission?: string;
  redirectTo?: string;
};

export const ProtectedRoute = ({
  children,
  requiredPermission,
  redirectTo = '/login',
}: ProtectedRouteProps) => {
  const [user] = useAtom(userAtom);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate(redirectTo);
      return;
    }

    if (requiredPermission && !hasPermission(user, requiredPermission as any)) {
      navigate('/unauthorized');
    }
  }, [user, requiredPermission, navigate, redirectTo]);

  if (!user || (requiredPermission && !hasPermission(user, requiredPermission as any))) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
