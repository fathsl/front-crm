import { BarChart3, Box, Calculator, CheckSquare2Icon, ClipboardList, Factory, FilePlus, History, LogOut, Mail, MessageCircle, MessageSquare, Package, Percent, Settings, ShoppingBag, Truck, UserPlus, UsersIcon, UserSquare2Icon, UsersRoundIcon, X } from 'lucide-react';
import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  category: string;
  href?: string;
}

interface SidebarProps {
  sidebarOpen: boolean;
  onNavClick: (itemId: string) => void;
}

const Sidebar: FC<SidebarProps> = ({
  sidebarOpen,
  onNavClick,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navItems: NavItem[] = [
    { id: 'projects', label: 'Projects', icon: CheckSquare2Icon , category: 'Office Managment', href: '/projects' },
    { id: 'reporting', label: 'Reporting', icon: BarChart3, category: 'Primary', href: '/reporting' },
    /* { id: 'orders', label: 'My Orders', icon: ShoppingBag, category: 'Primary', href: '/orders' }, */
    { id: 'clients', label: 'Clients', icon: UsersRoundIcon, category: 'Primary', href: '/clients' },
    /* { id: 'accounting', label: 'Accounting', icon: Calculator, category: 'Primary', href: '/accounting' },
    { id: 'factory', label: 'Factory', icon: Factory, category: 'Primary', href: '/factory' },
    { id: 'control', label: 'Control', icon: Settings, category: 'Management', href: '/control' },
    { id: 'add-customer', label: 'Add Customer', icon: UserPlus, category: 'Management', href: '/customers/new' },
    { id: 'transaction-history', label: 'Transaction History', icon: History, category: 'Management', href: '/transactions' },
    { id: 'logistics', label: 'Logistics', icon: Box, category: 'Management', href: '/logistics' },
    { id: 'create-order', label: 'Create Order', icon: FilePlus, category: 'Operations', href: '/orders/new' },
    { id: 'create-offer', label: 'Create Offer', icon: Percent, category: 'Operations', href: '/offers/new' },
    { id: 'add-component', label: 'Add Component', icon: Package, category: 'Operations', href: '/components/new' },
    { id: 'logistics-history', label: 'Logistics History', icon: Truck, category: 'Operations', href: '/logistics/history' },
    { id: 'prescriptions', label: 'Prescriptions', icon: ClipboardList, category: 'Tools', href: '/prescriptions' }, */
    { id: 'users', label: 'Users', icon: UsersIcon, category: 'Tools', href: '/users' },
    { id: 'meetings', label: 'Meetings', icon: MessageSquare, category: 'Communication', href: '/meetings' },
    { id: 'chats', label: 'Chats', icon: MessageCircle, category: 'Communication', href: '/chats' },
    /* { id: 'bulk-mail', label: 'Bulk Mail', icon: Mail, category: 'Communication', href: '/mail' }, */
  ];

  const groupedNavItems = navItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const handleCloseSidebar = () => {
    onNavClick('close');
  };

  return (
    <>     
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full pt-16 lg:pt-4">
          <div className="lg:hidden absolute top-4 right-4">
            <button onClick={handleCloseSidebar} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="px-6 pb-6">
            <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Connected to</p>
                  <p className="font-semibold">CRM Server</p>
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
            {Object.entries(groupedNavItems).map(([category, items]) => (
              <div key={category} className="mb-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">{category}</p>
                <div className="space-y-1">
                  {items.map(item => {
                    const Icon = item.icon;
                    const isActive = location.pathname === (item.href || `/${item.id}`);
                    return (
                      <Link
                        key={item.id}
                        to={item.href || `/${item.id}`}
                        onClick={() => {
                          onNavClick(item.id);
                          if (window.innerWidth < 1024) handleCloseSidebar();
                        }}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 border ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'text-slate-700 border-transparent hover:bg-slate-50 hover:text-slate-900 hover:border-slate-200'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-200">
            <button className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all duration-200 border border-transparent">
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;