import { useAtom } from 'jotai';
import { userAtom } from '~/utils/userAtom';
import { hasPermission } from '~/utils/permissions';

export const UserProfile = () => {
  const [user] = useAtom(userAtom);

  if (!user) return null;

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'Yonetici': 'Yönetici',
      'Muhasebe': 'Muhasebe',
      'Fabrika': 'Fabrika Sorumlusu',
      'Gozlemci': 'Gözlemci',
      'Temsilci': 'Satış Temsilcisi',
      'Lojistik': 'Lojistik Sorumlusu'
    };
    return roleNames[role] || role;
  };

  return (
    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow">
      <div className="flex-shrink-0">
        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
          {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {user.fullName || user.email}
        </p>
        <p className="text-sm text-gray-500 truncate">
          {getRoleDisplayName(user.role)}
        </p>
      </div>
    </div>
  );
};

export default UserProfile;
