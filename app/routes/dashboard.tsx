import { Check, Clock, DollarSign, Package, ShoppingCart, UserPlus, Users, Factory, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { userAtom } from '~/utils/userAtom';
import { hasPermission } from '~/utils/permissions';
import QuickActions from '~/components/QuickActions';
import RecentActivity from '~/components/RecentActivity';
import StatCards from '~/components/StartCards';
import { useAuthRedirect } from '~/hooks/useAuthRedirect';

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: any;
  bgColor: string;
  iconColor: string;
  requiredPermission?: string;
}

type Activity = {
  id: string;
  title: string;
  time: string;
  icon: any;
  bgColor: string;
  iconColor: string;
};

const RoleBasedDashboard = () => {
  const { t } = useTranslation();
  const [user] = useAtom(userAtom);
  
  useAuthRedirect();

  const baseCards: StatCard[] = [
    {
      title: 'Total Orders',
      value: '1,234',
      change: '+12%',
      changeType: 'positive',
      icon: ShoppingCart,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Pending',
      value: '24',
      change: '-5%',
      changeType: 'negative',
      icon: Clock,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    }
  ];

  const recentActivities: Activity[] = [
    {
      id: '1',
      title: 'Order #12345 completed',
      time: '2 minutes ago',
      icon: Check,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      id: '2',
      title: 'New customer registered',
      time: '5 minutes ago',
      icon: UserPlus,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      id: '3',
      title: 'Shipment dispatched',
      time: '15 minutes ago',
      icon: Package,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    }
  ];

  const adminCards: StatCard[] = [
    {
      title: 'Revenue',
      value: '$89K',
      change: '+23%',
      changeType: 'positive',
      icon: DollarSign,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      requiredPermission: 'viewRevenue'
    },
    {
      title: 'Customers',
      value: '856',
      change: '+8%',
      changeType: 'positive',
      icon: Users,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      requiredPermission: 'manageUsers'
    }
  ];

  const factoryCards: StatCard[] = [
    {
      title: 'Production',
      value: '245',
      change: '+15%',
      changeType: 'positive',
      icon: Factory,
      bgColor: 'bg-amber-100',
      iconColor: 'text-amber-600',
      requiredPermission: 'manageProduction'
    },
    {
      title: 'Shipped',
      value: '189',
      change: '+7%',
      changeType: 'positive',
      icon: Truck,
      bgColor: 'bg-cyan-100',
      iconColor: 'text-cyan-600',
      requiredPermission: 'manageShipping'
    }
  ];

  const getFilteredCards = (cards: StatCard[]) => {
    if (!user) return [];
    return cards.filter(card => 
      !card.requiredPermission || hasPermission(user, card.requiredPermission as any)
    );
  };

  const allCards = [
    ...baseCards,
    ...getFilteredCards(adminCards),
    ...getFilteredCards(factoryCards)
  ];

  if (allCards.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No dashboard content available for your role.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl p-6 text-white relative overflow-hidden">
          <h2 className="text-2xl lg:text-3xl font-bold mb-2">
            {t('welcome')}, {user?.fullName || 'User'}!
          </h2>
          <p className="text-blue-100 text-sm lg:text-base mb-4">
            {t('dashboard.welcomeSubtitle')}
          </p>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs lg:text-sm text-blue-100">
                {t('dashboard.serverStatus')}: {t('common.online')}
              </span>
            </div>
          </div>
        </div>
      </div>
      <StatCards statCards={allCards} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <RecentActivity activities={recentActivities} />
        <QuickActions />
      </div>
    </>
  );
};

export default function Dashboard() {
  return <RoleBasedDashboard />;
}