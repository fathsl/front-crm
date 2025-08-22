import type { User } from './userAtom';

type Permission = 'viewDashboard' | 'manageUsers' | 'manageOrders' | 'viewReports' | 'manageInventory' | 'manageAccounting';

const rolePermissions: Record<string, Permission[]> = {
  Yonetici: [
    'viewDashboard',
    'manageUsers',
    'manageOrders',
    'viewReports',
    'manageInventory',
    'manageAccounting'
  ],
  Muhasebe: [
    'viewDashboard',
    'manageAccounting',
    'viewReports'
  ],
  Fabrika: [
    'viewDashboard',
    'manageInventory'
  ],
  Gozlemci: [
    'viewDashboard',
    'viewReports',
    'manageOrders'
  ],
  Temsilci: [
    'viewDashboard',
    'manageOrders'
  ],
  Lojistik: [
    'viewDashboard',
    'manageInventory'
  ]
};

export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user || !user.role) return false;
  return rolePermissions[user.role]?.includes(permission) || false;
};

export const getAvailableRoutes = (user: User | null): string[] => {
  if (!user || !user.role) return ['/login'];
  
  const baseRoutes = ['/dashboard'];
  
  if (hasPermission(user, 'manageUsers')) {
    baseRoutes.push('/users', '/user-management');
  }
  
  if (hasPermission(user, 'manageOrders')) {
    baseRoutes.push('/orders', '/create-order');
  }
  
  if (hasPermission(user, 'manageInventory')) {
    baseRoutes.push('/inventory', '/products');
  }
  
  if (hasPermission(user, 'manageAccounting')) {
    baseRoutes.push('/accounting', '/reports');
  }
  
  return baseRoutes;
};
