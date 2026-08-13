import React from "react";
import { FiInbox, FiAlertCircle, FiSearch, FiRefreshCw } from "react-icons/fi";

const EmptyState = ({ 
  title = "No Data Available", 
  message = "We couldn't find any records matching your criteria.", 
  type = "empty", // "empty", "error", "search"
  onRetry,
  actionLabel = "Retry Connection"
}) => {
  const icons = {
    empty: <FiInbox className="text-slate-200" size={48} />,
    error: <FiAlertCircle className="text-rose-200" size={48} />,
    search: <FiSearch className="text-slate-200" size={48} />,
  };

  const bgColors = {
    empty: "bg-slate-50",
    error: "bg-rose-50/30",
    search: "bg-slate-50",
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className={`w-24 h-24 rounded-[2.5rem] ${bgColors[type]} flex items-center justify-center mb-6 shadow-inner border border-white`}>
        {icons[type]}
      </div>
      
      <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-2">
        {title}
      </h3>
      
      <p className="text-xs text-slate-500 max-w-sm mx-auto mb-8 leading-relaxed font-bold">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10 border border-slate-700"
        >
          <FiRefreshCw size={14} className={type === "error" ? "animate-spin-slow" : ""} />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
