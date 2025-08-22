import type { FC } from "react";
import type { StatCard } from "~/help";

interface StatCardsProps {
  statCards: StatCard[];
}

const StatCards: FC<StatCardsProps> = ({ statCards }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    {statCards.map((stat, index) => {
      const Icon = stat.icon;
      return (
        <div 
          key={index}
          className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">{stat.title}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${stat.iconColor}`} />
            </div>
          </div>
          <div className="mt-3 flex items-center">
            <span className={`text-xs font-medium ${stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
              {stat.change}
            </span>
            <span className="text-slate-500 text-xs ml-1">vs last month</span>
          </div>
        </div>
      );
    })}
  </div>
);

export default StatCards;
