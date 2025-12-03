import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  EyeIcon,
  EyeOff,
  FileDown,
  Filter,
  MessageSquare,
  UserIcon,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import * as XLSX from "xlsx";

enum DiscussionStatus {
  NotStarted = 0,
  InProgress = 1,
  Completed = 2,
}

interface GroupedDiscussions {
  [key: string]: Discussion[];
}

interface Discussion {
  id: number;
  title: string;
  description: string;
  createdByUserId: number;
  participantUserIds: number[];
  createdAt: Date;
  updatedAt: Date;
  senderId: number;
  receiverId: number;
  latestMessageDate: Date;
  status: DiscussionStatus;
  unreadCount: number;
  unseenCount: number;
  senderName: string;
  receiverName: string;
  creatorName: string;
  isSeen: boolean;
}

type DiscussionsByStatus = Record<DiscussionStatus, Discussion[]>;

const DiscussionReportsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const baseUrl = "https://api-crm-tegd.onrender.com";
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    DiscussionStatus | "all"
  >("all");
  const [selectedTask, setSelectedTask] = useState<Discussion | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    fetchDiscussions();
  }, [id]);

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/Chat/discussions/${id}`);
      const data = await response.json();

      if (data.length > 0) {
        setUserName(data[0].senderName || data[0].receiverName || "User");
      }

      setDiscussions(data);
    } catch (error) {
      console.error("Error fetching discussions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: DiscussionStatus): string => {
    switch (status) {
      case DiscussionStatus.NotStarted:
        return "Not Started";
      case DiscussionStatus.InProgress:
        return "In Progress";
      case DiscussionStatus.Completed:
        return "Completed";
      default:
        return "Unknown";
    }
  };

  const statusConfig = {
    0: {
      label: "Todo",
      color: "bg-gray-100",
      borderColor: "border-gray-300",
      textColor: "text-gray-700",
      badge: "bg-gray-500",
      icon: AlertCircle,
    },
    1: {
      label: "In Progress",
      color: "bg-blue-50",
      borderColor: "border-blue-300",
      textColor: "text-blue-700",
      badge: "bg-blue-500",
      icon: Zap,
    },
    2: {
      label: "Completed",
      color: "bg-green-50",
      borderColor: "border-green-300",
      textColor: "text-green-700",
      badge: "bg-green-500",
      icon: CheckCircle2,
    },
  };

  const groupDiscussionsByStatus = (): GroupedDiscussions => {
    const grouped: GroupedDiscussions = {
      [DiscussionStatus.NotStarted]: [],
      [DiscussionStatus.InProgress]: [],
      [DiscussionStatus.Completed]: [],
    };

    discussions.forEach((discussion) => {
      const status = discussion.status ?? DiscussionStatus.NotStarted;
      if (grouped[status]) {
        grouped[status].push(discussion);
      }
    });

    return grouped;
  };

  const filteredDiscussions =
    selectedFilter === "all"
      ? discussions
      : discussions.filter((d) => d.status === selectedFilter);

  const groupedDiscussions = groupDiscussionsByStatus();

  const groupedByStatus = filteredDiscussions.reduce<
    Partial<DiscussionsByStatus>
  >((acc, discussion) => {
    if (!acc[discussion.status]) {
      acc[discussion.status] = [];
    }
    acc[discussion.status]!.push(discussion);
    return acc;
  }, {} as Partial<DiscussionsByStatus>);

  const totalCount = discussions.length;
  const notStartedCount =
    groupedDiscussions[DiscussionStatus.NotStarted].length;
  const inProgressCount =
    groupedDiscussions[DiscussionStatus.InProgress].length;
  const completedCount = groupedDiscussions[DiscussionStatus.Completed].length;

  const TaskCard = ({ discussion }: { discussion: Discussion }) => {
    const config = statusConfig[discussion.status];
    const Icon = config.icon;
    const hasUnreadMessages = discussion.unreadCount > 0;
    const hasUnseenMessages = discussion.unseenCount > 0;

    return (
      <div
        onClick={() => setSelectedTask(discussion)}
        className={`p-4 rounded-lg border-2 ${config.borderColor} ${config.color} hover:shadow-md transition-all cursor-pointer relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 flex items-center gap-1 p-2">
          {hasUnreadMessages && (
            <span
              className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-semibold bg-red-500 text-white shadow-sm"
              title={`${discussion.unreadCount} unread message${discussion.unreadCount > 1 ? "s" : ""}`}
            >
              {discussion.unreadCount}
            </span>
          )}
          {hasUnseenMessages && (
            <span
              className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-semibold bg-orange-500 text-white shadow-sm"
              title={`${discussion.unseenCount} unseen message${discussion.unseenCount > 1 ? "s" : ""}`}
            >
              <EyeOff className="w-3 h-3" />
            </span>
          )}
        </div>

        <div className="mb-3 flex items-start justify-between gap-2 pr-20">
          <h3 className="text-sm font-semibold text-gray-900 flex-1 line-clamp-2">
            {discussion.title}
          </h3>
          <Icon
            className={`w-4 h-4 ${config.textColor} flex-shrink-0 mt-0.5`}
          />
        </div>

        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {discussion.description}
        </p>

        <div className="mb-3 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            {discussion.senderName && (
              <div className="flex items-center gap-1 bg-white bg-opacity-50 px-2 py-1 rounded text-xs">
                <UserIcon className="w-3 h-3 text-blue-600" />
                <span className="text-gray-700 font-medium">
                  {discussion.senderName}
                </span>
              </div>
            )}
            {discussion.receiverName && (
              <div className="flex items-center gap-1 bg-white bg-opacity-50 px-2 py-1 rounded text-xs">
                <UserIcon className="w-3 h-3 text-purple-600" />
                <span className="text-gray-700 font-medium">
                  {discussion.receiverName}
                </span>
              </div>
            )}
          </div>
          {discussion.creatorName && (
            <div className="text-xs text-gray-500 mt-1">
              Created by{" "}
              <span className="font-medium text-gray-700">
                {discussion.creatorName}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span>
              Created {new Date(discussion.createdAt).toLocaleDateString()}
            </span>
          </div>
          {discussion.updatedAt &&
            discussion.updatedAt !== discussion.createdAt && (
              <div className="flex items-center gap-1.5 text-blue-600">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span>
                  Updated {new Date(discussion.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
        </div>

        <div className="mt-2 flex items-center gap-1">
          {discussion.isSeen ? (
            <>
              <EyeIcon className="w-3 h-3 text-green-600" />
              <span className="text-xs text-green-600 font-medium">Seen</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3 h-3 text-orange-600" />
              <span className="text-xs text-orange-600 font-medium">
                Unseen
              </span>
            </>
          )}
        </div>
      </div>
    );
  };

  const StatusColumn = ({
    status,
    discussions,
  }: {
    status: DiscussionStatus;
    discussions: Discussion[];
  }) => {
    const config = statusConfig[status];

    return (
      <div className="flex flex-col">
        <div
          className={`${config.color} px-4 py-3 rounded-t-lg border-b-2 ${config.borderColor}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`${config.badge} text-white rounded-full px-2.5 py-0.5 text-xs font-semibold`}
            >
              {discussions.length}
            </div>
            <h2 className={`text-sm font-bold ${config.textColor}`}>
              {config.label}
            </h2>
          </div>
        </div>

        <div
          className={`flex-1 p-3 space-y-3 rounded-b-lg border-2 ${config.borderColor} min-h-96 bg-white overflow-y-auto`}
        >
          {discussions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageSquare className="w-8 h-8 mb-2" />
              <p className="text-xs text-center">No tasks</p>
            </div>
          ) : (
            discussions.map((discussion) => (
              <TaskCard key={discussion.id} discussion={discussion} />
            ))
          )}
        </div>
      </div>
    );
  };

  const handleExportDiscussions = () => {
    try {
      if (!discussions || discussions.length === 0) {
        alert("No discussions to export");
        return;
      }

      const exportData = discussions.map((discussion) => ({
        "Discussion ID": discussion.id,
        Title: discussion.title,
        Description: discussion.description,
        Status: getStatusLabel(discussion.status),
        Sender: discussion.senderName || "N/A",
        Receiver: discussion.receiverName || "N/A",
        "Created By": discussion.creatorName || "N/A",
        "Created Date": new Date(discussion.createdAt).toLocaleDateString(),
        "Updated Date": discussion.updatedAt
          ? new Date(discussion.updatedAt).toLocaleDateString()
          : "N/A",
        "Unread Messages": discussion.unreadCount || 0,
        "Unseen Messages": discussion.unseenCount || 0,
        "Is Seen": discussion.isSeen ? "Yes" : "No",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);

      const columnWidths = [
        { wch: 12 },
        { wch: 25 },
        { wch: 35 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
      ];

      worksheet["!cols"] = columnWidths;

      const headerStyle = {
        font: { bold: true, color: "FFFFFF" },
        fill: { fgColor: { rgb: "366092" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };

      for (let i = 0; i < exportData.length + 1; i++) {
        for (let j = 0; j < Object.keys(exportData[0]).length; j++) {
          const cellRef = XLSX.utils.encode_cell({ r: i === 0 ? 0 : i, c: j });
          if (!worksheet[cellRef]) continue;

          if (i === 0) {
            worksheet[cellRef].s = headerStyle;
          } else {
            worksheet[cellRef].s = {
              border: {
                top: { style: "thin", color: "D3D3D3" },
                bottom: { style: "thin", color: "D3D3D3" },
                left: { style: "thin", color: "D3D3D3" },
                right: { style: "thin", color: "D3D3D3" },
              },
              alignment: { vertical: "top", wrapText: true },
            };
          }
        }
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Discussions");

      const fileName = `Discussions_${userName || "User"}_${new Date().toISOString().split("T")[0]}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      console.log("Discussions exported successfully");
    } catch (error) {
      console.error("Error exporting discussions:", error);
      alert("Failed to export discussions. Please try again.");
    }
  };

  const getStatusLabel = (status: number): string => {
    const statusMap: Record<number, string> = {
      0: "Todo",
      1: "In Progress",
      2: "Completed",
    };
    return statusMap[status] || "Unknown";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading discussions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  Discussion Reports
                </h1>
                <p className="text-sm text-gray-600 truncate">{userName}</p>
              </div>
            </div>

            <div className="relative flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">
                    {selectedFilter === "all"
                      ? "All Statuses"
                      : getStatusText(selectedFilter)}
                  </span>
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => handleExportDiscussions()}
                >
                  <FileDown className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">
                    Export
                  </span>
                </button>
              </div>

              {showFilterMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowFilterMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <button
                      onClick={() => {
                        setSelectedFilter("all");
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        selectedFilter === "all"
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      All Statuses ({totalCount})
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        setSelectedFilter(DiscussionStatus.NotStarted);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        selectedFilter === DiscussionStatus.NotStarted
                          ? "bg-gray-50 text-gray-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      Not Started ({notStartedCount})
                    </button>
                    <button
                      onClick={() => {
                        setSelectedFilter(DiscussionStatus.InProgress);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        selectedFilter === DiscussionStatus.InProgress
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      In Progress ({inProgressCount})
                    </button>
                    <button
                      onClick={() => {
                        setSelectedFilter(DiscussionStatus.Completed);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        selectedFilter === DiscussionStatus.Completed
                          ? "bg-green-50 text-green-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      Completed ({completedCount})
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
            <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">
              Total
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {totalCount}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-gray-500">
            <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">
              Not Started
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {notStartedCount}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
            <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">
              In Progress
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {inProgressCount}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
            <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">
              Completed
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {completedCount}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {discussions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Discussions Found
            </h3>
            <p className="text-gray-600">
              There are no discussions for this user yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Object.entries(groupedByStatus).map(
                ([statusKey, discussions]) => (
                  <StatusColumn
                    key={statusKey}
                    status={parseInt(statusKey)}
                    discussions={discussions}
                  />
                )
              )}
            </div>

            {selectedTask && (
              <div
                className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-end sm:items-center justify-center p-4 z-50"
                onClick={() => setSelectedTask(null)}
              >
                <div
                  className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl max-h-96 overflow-y-auto shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900 flex-1 break-words pr-4">
                        {selectedTask.title}
                      </h2>
                      <button
                        onClick={() => setSelectedTask(null)}
                        className="text-gray-400 hover:text-gray-600 font-bold text-xl flex-shrink-0"
                      >
                        ×
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <div
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white ${statusConfig[selectedTask.status].badge}`}
                      >
                        {statusConfig[selectedTask.status].label}
                      </div>
                      {selectedTask.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-semibold bg-red-500 text-white">
                          {selectedTask.unreadCount} unread
                        </span>
                      )}
                      {selectedTask.unseenCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-semibold bg-orange-500 text-white">
                          {selectedTask.unseenCount} unseen
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 text-sm mb-6">
                      {selectedTask.description}
                    </p>

                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">
                        Participants
                      </h3>
                      <div className="space-y-2">
                        {selectedTask.senderName && (
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-700">
                              <span className="font-semibold">Sender:</span>{" "}
                              {selectedTask.senderName}
                            </span>
                          </div>
                        )}
                        {selectedTask.receiverName && (
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-purple-600" />
                            <span className="text-sm text-gray-700">
                              <span className="font-semibold">Receiver:</span>{" "}
                              {selectedTask.receiverName}
                            </span>
                          </div>
                        )}
                        {selectedTask.creatorName && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <span className="text-sm text-gray-700">
                              <span className="font-semibold">Created by:</span>{" "}
                              {selectedTask.creatorName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 text-sm text-gray-600 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          Created:{" "}
                          {new Date(
                            selectedTask.createdAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      {selectedTask.updatedAt &&
                        selectedTask.updatedAt !== selectedTask.createdAt && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>
                              Updated:{" "}
                              {new Date(
                                selectedTask.updatedAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      <div className="flex items-center gap-2">
                        {selectedTask.isSeen ? (
                          <>
                            <EyeIcon className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 font-medium">
                              Seen by recipients
                            </span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4 text-orange-600" />
                            <span className="text-orange-600 font-medium">
                              Not seen by recipients
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussionReportsPage;
