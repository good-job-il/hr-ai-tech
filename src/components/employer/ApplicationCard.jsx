import React from 'react';
import { Trash2 } from 'lucide-react';

export default function ApplicationCard({ app, onDelete }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{app.candidate_name}</p>
          <p className="text-xs text-gray-600 truncate">{app.job_title}</p>
        </div>
        <button
          onClick={() => onDelete(app.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {app.match_score && (
        <div className="mb-2 flex items-center gap-1">
          <span className="text-xs font-semibold text-hhblue">{app.match_score}% התאמה</span>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-hhblue"
              style={{ width: `${app.match_score}%` }}
            />
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 line-clamp-2">{app.match_reason}</p>
    </div>
  );
}