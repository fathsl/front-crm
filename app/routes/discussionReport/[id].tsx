import { ArrowLeft, Calendar, ChevronDown, ChevronUp, Clock, Filter, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { Discussion } from "~/help";


enum DiscussionStatus {
    NotStarted = 0,
    InProgress = 1,
    Completed = 2
  }
  
  enum TaskStatus {
    Backlog = 0,
    ToDo = 1,
    InProgress = 2,
    InReview = 3,
    Done = 4
  }

  interface GroupedDiscussions {
    [key: string]: Discussion[];
  }

// const DiscussionReportsPage: React.FC = () => {
//     const { id } = useParams<{ id: string }>();
//     const navigate = useNavigate();
    
//     const [discussions, setDiscussions] = useState<Discussion[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [userName, setUserName] = useState('');
//     const [expandedStatuses, setExpandedStatuses] = useState<Set<DiscussionStatus>>(
//       new Set([DiscussionStatus.NotStarted, DiscussionStatus.InProgress, DiscussionStatus.Completed])
//     );
//     const [selectedFilter, setSelectedFilter] = useState<DiscussionStatus | 'all'>('all');
//     const [showFilterMenu, setShowFilterMenu] = useState(false);
  
//     useEffect(() => {
//       fetchDiscussions();
//     }, [id]);
  
//     const fetchDiscussions = async () => {
//       try {
//         setLoading(true);
//         const response = await fetch(`/api/discussions/${id}`);
//         const data = await response.json();
        
//         if (data.length > 0) {
//           setUserName(data[0].senderName || data[0].receiverName || 'User');
//         }
        
//         setDiscussions(data);
//       } catch (error) {
//         console.error('Error fetching discussions:', error);
//       } finally {
//         setLoading(false);
//       }
//     };
  
//     const getStatusText = (status: DiscussionStatus): string => {
//       switch (status) {
//         case DiscussionStatus.NotStarted:
//           return 'Not Started';
//         case DiscussionStatus.InProgress:
//           return 'In Progress';
//         case DiscussionStatus.Completed:
//           return 'Completed';
//         default:
//           return 'Unknown';
//       }
//     };
  
//     const getStatusColor = (status: DiscussionStatus): string => {
//       switch (status) {
//         case DiscussionStatus.NotStarted:
//           return 'bg-gray-500';
//         case DiscussionStatus.InProgress:
//           return 'bg-blue-500';
//         case DiscussionStatus.Completed:
//           return 'bg-green-500';
//         default:
//           return 'bg-gray-400';
//       }
//     };
  
//     const getStatusBorderColor = (status: DiscussionStatus): string => {
//       switch (status) {
//         case DiscussionStatus.NotStarted:
//           return 'border-gray-200';
//         case DiscussionStatus.InProgress:
//           return 'border-blue-200';
//         case DiscussionStatus.Completed:
//           return 'border-green-200';
//         default:
//           return 'border-gray-200';
//       }
//     };
  
//     const getTaskStatusText = (status: TaskStatus): string => {
//       switch (status) {
//         case TaskStatus.Backlog:
//           return 'Backlog';
//         case TaskStatus.ToDo:
//           return 'To Do';
//         case TaskStatus.InProgress:
//           return 'In Progress';
//         case TaskStatus.InReview:
//           return 'In Review';
//         case TaskStatus.Done:
//           return 'Done';
//         default:
//           return 'Unknown';
//       }
//     };
  
//     const groupDiscussionsByStatus = (): GroupedDiscussions => {
//       const grouped: GroupedDiscussions = {
//         [DiscussionStatus.NotStarted]: [],
//         [DiscussionStatus.InProgress]: [],
//         [DiscussionStatus.Completed]: []
//       };
  
//       discussions.forEach(discussion => {
//         const status = discussion.status ?? DiscussionStatus.NotStarted;
//         if (grouped[status]) {
//           grouped[status].push(discussion);
//         }
//       });
  
//       return grouped;
//     };
  
//     const toggleStatus = (status: DiscussionStatus) => {
//       setExpandedStatuses(prev => {
//         const newSet = new Set(prev);
//         if (newSet.has(status)) {
//           newSet.delete(status);
//         } else {
//           newSet.add(status);
//         }
//         return newSet;
//       });
//     };
  
//     const filteredDiscussions = selectedFilter === 'all' 
//       ? discussions 
//       : discussions.filter(d => d.status === selectedFilter);
  
//     const groupedDiscussions = groupDiscussionsByStatus();
  
//     const getFilteredGroupedDiscussions = () => {
//       if (selectedFilter === 'all') {
//         return groupedDiscussions;
//       }
//       return {
//         [selectedFilter]: groupedDiscussions[selectedFilter] || []
//       };
//     };
  
//     const filteredGrouped = getFilteredGroupedDiscussions();
  
//     const totalCount = discussions.length;
//     const notStartedCount = groupedDiscussions[DiscussionStatus.NotStarted].length;
//     const inProgressCount = groupedDiscussions[DiscussionStatus.InProgress].length;
//     const completedCount = groupedDiscussions[DiscussionStatus.Completed].length;
  
//     if (loading) {
//       return (
//         <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
//           <div className="text-center">
//             <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//             <p className="text-gray-600 font-medium">Loading discussions...</p>
//           </div>
//         </div>
//       );
//     }
  
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
//         <div className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
//             <div className="flex items-center justify-between gap-4">
//               <div className="flex items-center gap-3 min-w-0 flex-1">
//                 <button
//                   onClick={() => navigate(-1)}
//                   className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
//                   aria-label="Go back"
//                 >
//                   <ArrowLeft className="w-5 h-5 text-gray-600" />
//                 </button>
//                 <div className="min-w-0 flex-1">
//                   <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
//                     Discussion Reports
//                   </h1>
//                   <p className="text-sm text-gray-600 truncate">{userName}</p>
//                 </div>
//               </div>
              
//               <div className="relative flex-shrink-0">
//                 <button
//                   onClick={() => setShowFilterMenu(!showFilterMenu)}
//                   className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//                 >
//                   <Filter className="w-4 h-4" />
//                   <span className="text-sm font-medium hidden sm:inline">
//                     {selectedFilter === 'all' ? 'All' : getStatusText(selectedFilter)}
//                   </span>
//                 </button>
                
//                 {showFilterMenu && (
//                   <>
//                     <div 
//                       className="fixed inset-0 z-10" 
//                       onClick={() => setShowFilterMenu(false)}
//                     />
//                     <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
//                       <button
//                         onClick={() => {
//                           setSelectedFilter('all');
//                           setShowFilterMenu(false);
//                         }}
//                         className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
//                           selectedFilter === 'all' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
//                         }`}
//                       >
//                         All Statuses ({totalCount})
//                       </button>
//                       <div className="border-t border-gray-100 my-1"></div>
//                       <button
//                         onClick={() => {
//                           setSelectedFilter(DiscussionStatus.NotStarted);
//                           setShowFilterMenu(false);
//                         }}
//                         className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
//                           selectedFilter === DiscussionStatus.NotStarted ? 'bg-gray-50 text-gray-600 font-medium' : 'text-gray-700'
//                         }`}
//                       >
//                         Not Started ({notStartedCount})
//                       </button>
//                       <button
//                         onClick={() => {
//                           setSelectedFilter(DiscussionStatus.InProgress);
//                           setShowFilterMenu(false);
//                         }}
//                         className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
//                           selectedFilter === DiscussionStatus.InProgress ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
//                         }`}
//                       >
//                         In Progress ({inProgressCount})
//                       </button>
//                       <button
//                         onClick={() => {
//                           setSelectedFilter(DiscussionStatus.Completed);
//                           setShowFilterMenu(false);
//                         }}
//                         className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
//                           selectedFilter === DiscussionStatus.Completed ? 'bg-green-50 text-green-600 font-medium' : 'text-gray-700'
//                         }`}
//                       >
//                         Completed ({completedCount})
//                       </button>
//                     </div>
//                   </>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
  
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//           <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
//             <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
//               <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">Total</p>
//               <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalCount}</p>
//             </div>
//             <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-gray-500">
//               <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">Not Started</p>
//               <p className="text-2xl sm:text-3xl font-bold text-gray-900">{notStartedCount}</p>
//             </div>
//             <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
//               <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">In Progress</p>
//               <p className="text-2xl sm:text-3xl font-bold text-gray-900">{inProgressCount}</p>
//             </div>
//             <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
//               <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">Completed</p>
//               <p className="text-2xl sm:text-3xl font-bold text-gray-900">{completedCount}</p>
//             </div>
//           </div>
//         </div>
  
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
//           {discussions.length === 0 ? (
//             <div className="bg-white rounded-xl shadow-sm p-8 text-center">
//               <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//               <h3 className="text-lg font-semibold text-gray-900 mb-2">No Discussions Found</h3>
//               <p className="text-gray-600">There are no discussions for this user yet.</p>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {Object.entries(filteredGrouped).map(([statusKey, statusDiscussions]) => {
//                 const status = parseInt(statusKey) as DiscussionStatus;
//                 const isExpanded = expandedStatuses.has(status);
//                 const count = statusDiscussions.length;
  
//                 if (count === 0) return null;
  
//                 return (
//                   <div key={status} className="bg-white rounded-xl shadow-sm overflow-hidden">
//                     <button
//                       onClick={() => toggleStatus(status)}
//                       className={`w-full p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50 transition-colors border-l-4 ${getStatusBorderColor(status)}`}
//                     >
//                       <div className="flex items-center gap-3">
//                         <div className={`w-10 h-10 rounded-lg ${getStatusColor(status)} flex items-center justify-center flex-shrink-0`}>
//                           <span className="text-white font-bold text-lg">{count}</span>
//                         </div>
//                         <div className="text-left">
//                           <h2 className="text-base sm:text-lg font-semibold text-gray-900">
//                             {getStatusText(status)}
//                           </h2>
//                           <p className="text-xs sm:text-sm text-gray-600">
//                             {count} {count === 1 ? 'discussion' : 'discussions'}
//                           </p>
//                         </div>
//                       </div>
//                       {isExpanded ? (
//                         <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
//                       ) : (
//                         <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
//                       )}
//                     </button>
  
//                     {isExpanded && (
//                       <div className="border-t border-gray-100">
//                         <div className="p-3 sm:p-4 space-y-3">
//                           {statusDiscussions.map((discussion) => (
//                             <div
//                               key={discussion.id}
//                               className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
//                               onClick={() => navigate(`/discussions/${discussion.id}`)}
//                             >
//                               <div className="flex items-start justify-between gap-3 mb-3">
//                                 <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex-1 break-words">
//                                   {discussion.title}
//                                 </h3>
//                                 {discussion.lastTaskStatus !== undefined && (
//                                   <span className="text-xs px-2 py-1 rounded-full bg-white text-gray-700 border border-gray-300 whitespace-nowrap flex-shrink-0">
//                                     Task: {getTaskStatusText(discussion.lastTaskStatus)}
//                                   </span>
//                                 )}
//                               </div>
                              
//                               <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2 break-words">
//                                 {discussion.description}
//                               </p>
  
//                               <div className="space-y-2">
//                                 <div className="flex items-center gap-2 text-xs text-gray-600">
//                                   <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
//                                   <span className="font-medium flex-shrink-0">From:</span>
//                                   <span className="truncate">{discussion.senderName}</span>
//                                 </div>
//                                 <div className="flex items-center gap-2 text-xs text-gray-600">
//                                   <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
//                                   <span className="font-medium flex-shrink-0">To:</span>
//                                   <span className="truncate">{discussion.receiverName}</span>
//                                 </div>
//                               </div>
  
//                               <div className="mt-3 pt-3 border-t border-gray-200 flex flex-col sm:flex-row gap-2 sm:items-center justify-between text-xs text-gray-500">
//                                 <div className="flex items-center gap-1.5">
//                                   <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
//                                   <span className="truncate">
//                                     {new Date(discussion.createdAt).toLocaleDateString()}
//                                   </span>
//                                 </div>
//                                 {discussion.updatedAt && discussion.updatedAt !== discussion.createdAt && (
//                                   <div className="flex items-center gap-1.5 text-blue-600">
//                                     <Clock className="w-3.5 h-3.5 flex-shrink-0" />
//                                     <span className="truncate">
//                                       Updated {new Date(discussion.updatedAt).toLocaleDateString()}
//                                     </span>
//                                   </div>
//                                 )}
//                               </div>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   };
  
//   export default DiscussionReportsPage;