import { BarChart3, CheckSquare2Icon, LogOut, MessageCircle, MessageSquare, UsersIcon, UsersRoundIcon, X, ChevronsLeft, ChevronsRight, Server, Wifi, MapPinMinusInside, MapIcon, Instagram } from 'lucide-react';
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
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavClick: (itemId: string) => void;
}

const Sidebar: FC<SidebarProps> = ({
  sidebarOpen,
  collapsed,
  onToggleCollapse,
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
    /* { id: 'media', label: 'Social Media', icon:Instagram, category: 'Communication', href: '/media' }, */
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
      <aside className={`fixed inset-y-0 left-0 z-40 ${collapsed ? 'w-20' : 'w-64'} bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full pt-16 lg:pt-4">
          <div className="lg:hidden absolute top-4 right-4">
            <button onClick={handleCloseSidebar} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="px-3 pb-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 shadow-2xl">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12 animate-pulse delay-1000"></div>
              </div>
              
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              
              <div className="relative">
                {collapsed ? (
                  <div className="p-4 flex flex-col items-center justify-center gap-3">
                    <button
                      onClick={onToggleCollapse}
                      title="Expand sidebar"
                      className="group p-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-110 shadow-lg"
                    >
                      <ChevronsRight className="w-6 h-6 text-white group-hover:translate-x-0.5 transition-transform duration-300" />
                    </button>
                    
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <div className="w-3 h-3 bg-emerald-200 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
                        <div className="absolute inset-0 w-3 h-3 bg-emerald-200 rounded-full animate-ping" />
                      </div>
                      <Server className="w-5 h-5 text-white/80" />
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                          <Server className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-white/80 font-medium">Connected to</p>
                          <p className="text-lg font-bold text-white tracking-wide">CRM Server</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={onToggleCollapse}
                        title="Collapse sidebar"
                        className="group p-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-110 shadow-lg"
                      >
                        <ChevronsLeft className="w-5 h-5 text-white group-hover:-translate-x-0.5 transition-transform duration-300" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative flex items-center gap-2">
                          <div className="w-4 h-4 bg-emerald-200 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
                          <div className="absolute left-0 w-4 h-4 bg-emerald-200 rounded-full animate-ping" />
                          <span className="text-sm text-white/90 font-medium ml-4">Live Connection</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                        <Wifi className="w-4 h-4 text-white" />
                        <span className="text-xs text-white/90 font-medium">Secure</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white/70">Signal Strength</span>
                        <span className="text-xs text-white font-semibold">Excellent</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-300 to-emerald-100 rounded-full w-5/6 shadow-lg shadow-emerald-400/30 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-4'} space-y-2 overflow-y-auto`}>
            {Object.entries(groupedNavItems).map(([category, items]) => (
              <div key={category} className="mb-6">
                {!collapsed && (
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">{category}</p>
                )}
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
                        className={`w-full flex ${collapsed ? 'justify-center' : 'items-center space-x-3'} px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 border ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'text-slate-700 border-transparent hover:bg-slate-50 hover:text-slate-900 hover:border-slate-200'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {!collapsed && <span>{item.label}</span>}
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
              {collapsed ? null : <span>Log Out</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;