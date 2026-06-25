import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function KpiCard({ label, value, pct, icon: Icon, color, bg, link, suffix = '' }) {
  const card = (
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {pct !== null && pct !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            pct > 0 ? 'bg-green-50 text-green-600' : pct < 0 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'
          }`}>
            {pct > 0 ? <TrendingUp className="w-3 h-3" /> : pct < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {pct > 0 ? '+' : ''}{pct}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value?.toLocaleString()}{suffix}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );

  return link ? <Link to={link}>{card}</Link> : card;
}