import { FileText, Mail, Plus, UserPlus } from "lucide-react";
import type { FC } from "react";

const QuickActions: FC = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors duration-200 space-y-2 text-sm font-medium text-slate-700">
          <Plus className="w-5 h-5 text-blue-600" />
          <span>New Order</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors duration-200 space-y-2 text-sm font-medium text-slate-700">
          <UserPlus className="w-5 h-5 text-green-600" />
          <span>Add Customer</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors duration-200 space-y-2 text-sm font-medium text-slate-700">
          <FileText className="w-5 h-5 text-purple-600" />
          <span>Generate Report</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors duration-200 space-y-2 text-sm font-medium text-slate-700">
          <Mail className="w-5 h-5 text-orange-600" />
          <span>Send Mail</span>
        </button>
      </div>
    </div>
  );
  
  export default QuickActions;