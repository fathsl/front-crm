import type { FC } from "react";
import type { Activity } from "~/help";



interface RecentActivityProps {
  activities: Activity[];
}

const RecentActivity: FC<RecentActivityProps> = ({ activities }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
      <button className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors">View All</button>
    </div>
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = activity.icon;
        return (
          <div key={activity.id} className="flex items-center space-x-3">
            <div className={`w-8 h-8 ${activity.bgColor} rounded-lg flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${activity.iconColor}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">{activity.title}</p>
              <p className="text-xs text-slate-500">{activity.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default RecentActivity;
