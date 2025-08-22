import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useAtom } from 'jotai';
import { userAtom } from '~/utils/userAtom';
import { useAuth } from '~/utils/auth';
import { hasPermission } from '~/utils/permissions';

interface NavbarProps {
  onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const { t, i18n } = useTranslation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user] = useAtom(userAtom);
  
  const { logout } = useAuth();

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

  const getMenuItems = () => {
    if (!user) return [];
    
    const items = [
      { label: t('nav.profile'), path: '/profile', permission: null },
      { label: t('nav.settings'), path: '/settings', permission: 'manageSettings' },
      { label: 'Kullanıcı Yönetimi', path: '/users', permission: 'manageUsers' },
      { label: 'Siparişler', path: '/orders', permission: 'manageOrders' },
      { label: 'Muhasebe', path: '/accounting', permission: 'manageAccounting' },
      { label: 'Envanter', path: '/inventory', permission: 'manageInventory' },
      { label: 'Raporlar', path: '/reports', permission: 'viewReports' },
    ];

    return items.filter(item => 
      !item.permission || hasPermission(user, item.permission as any)
    );
  };

  const menuItems = getMenuItems();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'tr' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed w-full z-20 top-0 left-0">
      <div className="px-3 py-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-start">
            <button
              onClick={onMenuToggle}
              className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
              </svg>
            </button>
            <a href="/" className="flex ml-2 md:mr-24">
              <img src='/unixpadel-logo.png' alt='logo' className="self-center w-8 h-8" />
            </a>
          </div>
          
          <div className="flex items-center">
            <div className="flex items-center ml-3">
              <button
                onClick={toggleLanguage}
                className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600 mr-3 px-3 py-1"
              >
                <span className="text-white text-sm font-medium">
                  {i18n.language === 'en' ? 'TR' : 'EN'}
                </span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                >
                  <span className="sr-only">Open user menu</span>
                  <img
                    className="w-8 h-8 rounded-full"
                    src="https://flowbite.com/docs/images/people/profile-picture-5.jpg"
                    alt="user photo"
                  />
                </button>
                
                {isProfileOpen && (
                  <div className="absolute right-0 z-50 my-4 text-base list-none bg-white divide-y divide-gray-100 rounded shadow dark:bg-gray-700 dark:divide-gray-600">
                    <div className="px-4 py-3">
                      <p className="text-sm text-gray-900 dark:text-white">{user?.fullName || user?.email}</p>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {user?.role ? getRoleDisplayName(user.role) : ''}
                      </p>
                    </div>
                    <ul className="py-1">
                      {menuItems.map((item, index) => (
                        <li key={index}>
                          <a
                            href={item.path}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            {item.label}
                          </a>
                        </li>
                      ))}
                      <li>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            logout();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                          {t('nav.logout')}
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
