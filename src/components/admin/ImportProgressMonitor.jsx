import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

export default function ImportProgressMonitor({ batchId }) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkProgress = async () => {
      try {
        const batch = await base44.entities.CandidateImportBatch.get(batchId);
        if (batch) {
          setProgress({
            status: batch.status,
            processed: batch.successful_imports + batch.failed_imports + batch.duplicate_found,
            total: batch.total_records,
            successful: batch.successful_imports,
            failed: batch.failed_imports,
            duplicates: batch.duplicate_found,
            review_required: batch.review_required
          });
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    checkProgress();
    const interval = setInterval(checkProgress, 2000);
    return () => clearInterval(interval);
  }, [batchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!progress) return null;

  const percentProcessed = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;
  const percentSuccessful = progress.processed > 0 ? Math.round((progress.successful / progress.processed) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="flex items-center gap-3">
        {progress.status === 'in_progress' && (
          <>
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-blue-700">בעיבוד...</span>
          </>
        )}
        {progress.status === 'completed' && (
          <>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">הושלם</span>
          </>
        )}
        {progress.status === 'failed' && (
          <>
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-red-700">נכשל</span>
          </>
        )}
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium text-gray-900">התקדמות</p>
          <p className="text-sm text-gray-600">{progress.processed} / {progress.total}</p>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-violet-600 transition-all"
            style={{ width: `${percentProcessed}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-700 font-medium">הצליחו</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{progress.successful}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs text-red-700 font-medium">כשלו</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{progress.failed}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-700 font-medium">כפילויות</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{progress.duplicates}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-xs text-orange-700 font-medium">ביקורת</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{progress.review_required}</p>
        </div>
      </div>
    </div>
  );
}