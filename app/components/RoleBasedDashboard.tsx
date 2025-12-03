import { useAtom } from "jotai";
import {
  Calendar,
  Check,
  CheckCircle,
  ClipboardList,
  Clock,
  FileText,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Client, Meeting, Offer } from "~/help";
import { useAuthRedirect } from "~/hooks/useAuthRedirect";
import { userAtom } from "~/utils/userAtom";
import StatCards from "./StartCards";
import RecentActivity from "./RecentActivity";
import QuickActions from "./QuickActions";

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
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

export const RoleBasedDashboard = () => {
  const { t } = useTranslation();
  const [user] = useAtom(userAtom);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [dashboardData, setDashboardData] = useState({
    totalOffers: 0,
    pendingOffers: 0,
    activeOffers: 0,
    completedOffers: 0,
    totalClients: 0,
    todayMeetings: 0,
    totalMeetings: 0,
    relatedOrders: 0,
  });

  const [percentageChanges, setPercentageChanges] = useState({
    totalOffersChange: 0,
    pendingOffersChange: 0,
    activeOffersChange: 0,
    completedOffersChange: 0,
    totalClientsChange: 0,
    todayMeetingsChange: 0,
    totalMeetingsChange: 0,
    relatedOrdersChange: 0,
  });

  useAuthRedirect();
  const baseUrl = "https://api-crm-tegd.onrender.com";

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const offersResponse = await fetch(`${baseUrl}/api/Offers`);
      const offers: Offer[] = offersResponse.ok
        ? await offersResponse.json()
        : [];

      const clientsResponse = await fetch(`${baseUrl}/api/Clients`);
      const clients: Client[] = clientsResponse.ok
        ? await clientsResponse.json()
        : [];

      const meetingsResponse = await fetch(`${baseUrl}/api/Meeting`);
      const meetings: Meeting[] = meetingsResponse.ok
        ? await meetingsResponse.json()
        : [];

      const isAdmin = user?.role === "Yonetici";

      const filteredOffers = isAdmin
        ? offers
        : offers.filter((offer) => offer.siparisAlID === user?.userId);

      const filteredMeetings = isAdmin
        ? meetings
        : meetings.filter((meeting) => meeting.createdBy === user?.userId);

      const filteredClients = isAdmin ? clients : clients;

      // Get current month and previous month dates
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const getDateString = (value: string | Date | undefined | null) => {
        if (!value) return null;
        if (typeof value === "string") return value.split("T")[0];
        return value.toISOString().split("T")[0];
      };

      const isInMonth = (
        dateValue: string | Date | undefined | null,
        monthStart: Date,
        monthEnd: Date
      ) => {
        const dateStr = getDateString(dateValue);
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return date >= monthStart && date <= monthEnd;
      };

      const currentMonthOffers = filteredOffers.filter((offer) =>
        isInMonth(offer.tarih, currentMonthStart, now)
      );

      const currentMonthMeetings = filteredMeetings.filter((meeting) =>
        isInMonth(
          meeting.createdAt || meeting.meetingDate,
          currentMonthStart,
          now
        )
      );

      const currentMonthClients = filteredClients.filter((client) =>
        isInMonth(client.createdAt || client.createdAt, currentMonthStart, now)
      );

      const previousMonthOffers = filteredOffers.filter((offer) =>
        isInMonth(
          offer.tarih,
          previousMonthStart,
          previousMonthEnd
        )
      );

      const previousMonthMeetings = filteredMeetings.filter((meeting) =>
        isInMonth(
          meeting.createdAt || meeting.meetingDate,
          previousMonthStart,
          previousMonthEnd
        )
      );

      const previousMonthClients = filteredClients.filter((client) =>
        isInMonth(
          client.createdAt || client.createdAt,
          previousMonthStart,
          previousMonthEnd
        )
      );

      const calculateChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      const currentPendingOffers = currentMonthOffers.filter(
        (offer) => offer.siparisMiTeklifMi === "Teklif"
      ).length;

      const currentActiveOffers = currentMonthOffers.filter((offer) =>
        ["Siparis", "Planlama", "Uretim", "Hazir", "Sevk", "Lojistik"].includes(
          offer.siparisMiTeklifMi || ""
        )
      ).length;

      const currentCompletedOffers = currentMonthOffers.filter(
        (offer) => offer.siparisMiTeklifMi === "Tamamlandi"
      ).length;

      const currentRelatedOrders = currentMonthOffers.filter((offer) =>
        [
          "Siparis",
          "Planlama",
          "Uretim",
          "Hazir",
          "Sevk",
          "Lojistik",
          "Tamamlandi",
        ].includes(offer.siparisMiTeklifMi || "")
      ).length;

      const previousPendingOffers = previousMonthOffers.filter(
        (offer) => offer.siparisMiTeklifMi === "Teklif"
      ).length;

      const previousActiveOffers = previousMonthOffers.filter((offer) =>
        ["Siparis", "Planlama", "Uretim", "Hazir", "Sevk", "Lojistik"].includes(
          offer.siparisMiTeklifMi || ""
        )
      ).length;

      const previousCompletedOffers = previousMonthOffers.filter(
        (offer) => offer.siparisMiTeklifMi === "Tamamlandi"
      ).length;

      const previousRelatedOrders = previousMonthOffers.filter((offer) =>
        [
          "Siparis",
          "Planlama",
          "Uretim",
          "Hazir",
          "Sevk",
          "Lojistik",
          "Tamamlandi",
        ].includes(offer.siparisMiTeklifMi || "")
      ).length;

      const today = new Date().toISOString().split("T")[0];
      const todayMeetings = filteredMeetings.filter((meeting) => {
        const meetingDate = meeting.meetingDate || meeting.createdAt;
        return getDateString(meetingDate) === today;
      }).length;
      
      setPercentageChanges({
        totalOffersChange: calculateChange(
          currentMonthOffers.length,
          previousMonthOffers.length
        ),
        pendingOffersChange: calculateChange(
          currentPendingOffers,
          previousPendingOffers
        ),
        activeOffersChange: calculateChange(
          currentActiveOffers,
          previousActiveOffers
        ),
        completedOffersChange: calculateChange(
          currentCompletedOffers,
          previousCompletedOffers
        ),
        totalClientsChange: calculateChange(
          currentMonthClients.length,
          previousMonthClients.length
        ),
        todayMeetingsChange: 0,
        totalMeetingsChange: calculateChange(
          currentMonthMeetings.length,
          previousMonthMeetings.length
        ),
        relatedOrdersChange: calculateChange(
          currentRelatedOrders,
          previousRelatedOrders
        ),
      });

      const activities: Activity[] = [];

      const statusIcons: Record<
        string,
        { icon: any; bgColor: string; iconColor: string; text: string }
      > = {
        Tamamlandi: {
          icon: Check,
          bgColor: "bg-green-100",
          iconColor: "text-green-600",
          text: "completed",
        },
        Sevk: {
          icon: Truck,
          bgColor: "bg-blue-100",
          iconColor: "text-blue-600",
          text: "dispatched",
        },
        Lojistik: {
          icon: Package,
          bgColor: "bg-orange-100",
          iconColor: "text-orange-600",
          text: "in logistics",
        },
        Hazir: {
          icon: CheckCircle,
          bgColor: "bg-teal-100",
          iconColor: "text-teal-600",
          text: "ready",
        },
        Uretim: {
          icon: Settings,
          bgColor: "bg-purple-100",
          iconColor: "text-purple-600",
          text: "in production",
        },
        Planlama: {
          icon: Calendar,
          bgColor: "bg-indigo-100",
          iconColor: "text-indigo-600",
          text: "in planning",
        },
        Siparis: {
          icon: ShoppingCart,
          bgColor: "bg-cyan-100",
          iconColor: "text-cyan-600",
          text: "ordered",
        },
        Teklif: {
          icon: FileText,
          bgColor: "bg-yellow-100",
          iconColor: "text-yellow-600",
          text: "offer sent",
        },
      };

      const completedOffers = filteredOffers
        .filter((offer) => offer.siparisMiTeklifMi === "Tamamlandi")
        .sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.tarih || 0).getTime();
          const dateB = new Date(b.updatedAt || b.tarih || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 3);

      completedOffers.forEach((offer) => {
        activities.push({
          id: `offer-${offer.siparisNo}`,
          title: `Order #${offer.siparisNo} completed`,
          time: getTimeAgo(offer.updatedAt || offer.tarih),
          icon: Check,
          bgColor: "bg-green-100",
          iconColor: "text-green-600",
        });
      });

      const newClients = filteredClients
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || b.createdAt || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 2);

      newClients.forEach((client) => {
        activities.push({
          id: `client-${client.id}`,
          title: `New customer: ${client.first_name + " " + client.last_name || "Unknown"}`,
          time: getTimeAgo(client.createdAt || client.createdAt),
          icon: UserPlus,
          bgColor: "bg-blue-100",
          iconColor: "text-blue-600",
        });
      });

      const dispatchedOffers = filteredOffers
        .filter((offer) => offer.siparisMiTeklifMi === "Sevk")
        .sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.tarih || 0).getTime();
          const dateB = new Date(b.updatedAt || b.tarih || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 2);

      dispatchedOffers.forEach((offer) => {
        activities.push({
          id: `dispatch-${offer.siparisAlID}`,
          title: `Order #${offer.siparisNo || offer.siparisAlID} dispatched`,
          time: getTimeAgo(offer.updatedAt || offer.tarih),
          icon: Truck,
          bgColor: "bg-orange-100",
          iconColor: "text-orange-600",
        });
      });

      const recentMeetings = filteredMeetings
        .sort((a, b) => {
          const dateA = new Date(a.meetingDate || a.createdAt || 0).getTime();
          const dateB = new Date(b.meetingDate || b.createdAt || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 2);

      recentMeetings.forEach((meeting) => {
        activities.push({
          id: `meeting-${meeting.id}`,
          title: `Meeting: ${meeting.title || meeting.description || "Scheduled"}`,
          time: getTimeAgo(meeting.meetingDate || meeting.createdAt),
          icon: Calendar,
          bgColor: "bg-purple-100",
          iconColor: "text-purple-600",
        });
      });

      const sortedActivities = activities
        .sort((a, b) => {
          return 0;
        })
        .slice(0, 5);

      setRecentActivities(
        sortedActivities.length > 0
          ? sortedActivities
          : [
              {
                id: "1",
                title: "No recent activities",
                time: "Start working to see activities here",
                icon: Clock,
                bgColor: "bg-gray-100",
                iconColor: "text-gray-600",
              },
            ]
      );

      const pendingOffers = filteredOffers.filter(
        (offer) => offer.siparisMiTeklifMi === "Teklif"
      ).length;

      const activeOffers = filteredOffers.filter((offer) =>
        ["Siparis", "Planlama", "Uretim", "Hazir", "Sevk", "Lojistik"].includes(
          offer.siparisMiTeklifMi || ""
        )
      ).length;

      const completedOffersCount = filteredOffers.filter(
        (offer) => offer.siparisMiTeklifMi === "Tamamlandi"
      ).length;

      const relatedOrders = filteredOffers.filter((offer) =>
        [
          "Siparis",
          "Planlama",
          "Uretim",
          "Hazir",
          "Sevk",
          "Lojistik",
          "Tamamlandi",
        ].includes(offer.siparisMiTeklifMi || "")
      ).length;

      setDashboardData({
        totalOffers: filteredOffers.length,
        pendingOffers,
        activeOffers,
        completedOffers: completedOffersCount,
        totalClients: filteredClients.length,
        todayMeetings,
        totalMeetings: filteredMeetings.length,
        relatedOrders,
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const getStatCards = (): StatCard[] => {
    const isAdmin = user?.role === "Yonetici";

    const formatChange = (value: number) => {
      return `${value > 0 ? "+" : ""}${value}%`;
    };

    if (isAdmin) {
      return [
        {
          title: "Total Offers",
          value: loading ? "..." : dashboardData.totalOffers.toString(),
          change: formatChange(percentageChanges.totalOffersChange),
          changeType:
            percentageChanges.totalOffersChange >= 0 ? "positive" : "negative",
          icon: FileText,
          bgColor: "bg-blue-100",
          iconColor: "text-blue-600",
        },
        {
          title: "Pending Offers",
          value: loading ? "..." : dashboardData.pendingOffers.toString(),
          change: formatChange(percentageChanges.pendingOffersChange),
          changeType:
            percentageChanges.pendingOffersChange >= 0
              ? "positive"
              : "negative",
          icon: Clock,
          bgColor: "bg-orange-100",
          iconColor: "text-orange-600",
        },
        {
          title: "Active Orders",
          value: loading ? "..." : dashboardData.activeOffers.toString(),
          change: formatChange(percentageChanges.activeOffersChange),
          changeType:
            percentageChanges.activeOffersChange >= 0 ? "positive" : "negative",
          icon: ShoppingCart,
          bgColor: "bg-green-100",
          iconColor: "text-green-600",
        },
        {
          title: "Completed Offers",
          value: loading ? "..." : dashboardData.completedOffers.toString(),
          change: formatChange(percentageChanges.completedOffersChange),
          changeType:
            percentageChanges.completedOffersChange >= 0
              ? "positive"
              : "negative",
          icon: Check,
          bgColor: "bg-purple-100",
          iconColor: "text-purple-600",
        },
        {
          title: "Total Customers",
          value: loading ? "..." : dashboardData.totalClients.toString(),
          change: formatChange(percentageChanges.totalClientsChange),
          changeType:
            percentageChanges.totalClientsChange >= 0 ? "positive" : "negative",
          icon: Users,
          bgColor: "bg-cyan-100",
          iconColor: "text-cyan-600",
        },
        {
          title: "Today's Meetings",
          value: loading ? "..." : dashboardData.todayMeetings.toString(),
          change: "Today",
          changeType: "positive",
          icon: Calendar,
          bgColor: "bg-amber-100",
          iconColor: "text-amber-600",
        },
        {
          title: "Total Meetings",
          value: loading ? "..." : dashboardData.totalMeetings.toString(),
          change: formatChange(percentageChanges.totalMeetingsChange),
          changeType:
            percentageChanges.totalMeetingsChange >= 0
              ? "positive"
              : "negative",
          icon: ClipboardList,
          bgColor: "bg-pink-100",
          iconColor: "text-pink-600",
        },
        {
          title: "Total Orders",
          value: loading ? "..." : dashboardData.relatedOrders.toString(),
          change: formatChange(percentageChanges.relatedOrdersChange),
          changeType:
            percentageChanges.relatedOrdersChange >= 0
              ? "positive"
              : "negative",
          icon: Package,
          bgColor: "bg-indigo-100",
          iconColor: "text-indigo-600",
        },
      ];
    } else {
      return [
        {
          title: "My offers",
          value: loading ? "..." : dashboardData.totalOffers.toString(),
          change: formatChange(percentageChanges.totalOffersChange),
          changeType:
            percentageChanges.totalOffersChange >= 0 ? "positive" : "negative",
          icon: FileText,
          bgColor: "bg-blue-100",
          iconColor: "text-blue-600",
        },
        {
          title: "waiting",
          value: loading ? "..." : dashboardData.pendingOffers.toString(),
          change: formatChange(percentageChanges.pendingOffersChange),
          changeType:
            percentageChanges.pendingOffersChange >= 0
              ? "positive"
              : "negative",
          icon: Clock,
          bgColor: "bg-orange-100",
          iconColor: "text-orange-600",
        },
        {
          title: "My Active Works",
          value: loading ? "..." : dashboardData.activeOffers.toString(),
          change: formatChange(percentageChanges.activeOffersChange),
          changeType:
            percentageChanges.activeOffersChange >= 0 ? "positive" : "negative",
          icon: ShoppingCart,
          bgColor: "bg-green-100",
          iconColor: "text-green-600",
        },
        {
          title: "My Meetings Today",
          value: loading ? "..." : dashboardData.todayMeetings.toString(),
          change: "Today",
          changeType: "positive",
          icon: Calendar,
          bgColor: "bg-amber-100",
          iconColor: "text-amber-600",
        },
        {
          title: "My meetings",
          value: loading ? "..." : dashboardData.totalMeetings.toString(),
          change: formatChange(percentageChanges.totalMeetingsChange),
          changeType:
            percentageChanges.totalMeetingsChange >= 0
              ? "positive"
              : "negative",
          icon: ClipboardList,
          bgColor: "bg-purple-100",
          iconColor: "text-purple-600",
        },
        {
          title: "My orders",
          value: loading ? "..." : dashboardData.relatedOrders.toString(),
          change: formatChange(percentageChanges.relatedOrdersChange),
          changeType:
            percentageChanges.relatedOrdersChange >= 0
              ? "positive"
              : "negative",
          icon: Package,
          bgColor: "bg-indigo-100",
          iconColor: "text-indigo-600",
        },
      ];
    }
  };

  const getTimeAgo = (dateValue: string | Date | undefined | null): string => {
    if (!dateValue) return "Unknown time";

    const date =
      typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const allCards = getStatCards();
  if (allCards.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">
          No dashboard content available for your role.
        </p>
      </div>
    );
  }
  return (
    <>
      <div className="mb-8">
        <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl p-6 text-white relative overflow-hidden">
          <h2 className="text-2xl lg:text-3xl font-bold mb-2">
            {t("welcome")}, {user?.fullName || "User"}!
          </h2>
          <p className="text-blue-100 text-sm lg:text-base mb-4">
            {user?.role === "Yonetici"
              ? "Yönetici paneline hoş geldiniz"
              : "Kullanıcı paneline hoş geldiniz"}
          </p>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs lg:text-sm text-blue-100">
                {t("dashboard.serverStatus")}: {t("common.online")}
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
