/**
 * JobRecommendationsPanel
 * Shows top matching Candidates for a given Job.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { rankCandidatesForJob } from '@/lib/aiMatching';
import AIMatchBadge from './AIMatchBadge';
import { UserPlus, MapPin, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';

export default function JobRecommendationsPanel({ job, onAddToPipeline }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!job) return;
    setLoading(true);
    base44.entities.Candidate.list('-created_date', 100)
      .then(candidates => {
        const ranked = rankCandidatesForJob(job, candidates || []).slice(0, 10);
        setResults(ranked);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [job?.id]);

  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" />
    </div>
  );

  if (!results.length) return (
    <div className="py-8 text-center text-[#94A3B8] text-sm font-semibold">
      לא נמצאו מועמדים מתאימים
    </div>
  );

  return (
    <div className="space-y-3" dir="rtl">
      <p className="text-xs text-[#94A3B8] font-semibold">
        {results.length} מועמדים דורגו לפי התאמה AI
      </p>
      {results.map(({ candidate, score, explanation }) => (
        <div key={candidate.id} className="rounded-2xl border border-[#E4ECFF] bg-white overflow-hidden">
          <div
            className="flex items-start gap-3 p-4 cursor-pointer hover:bg-[#F7FBFF] transition-all"
            onClick={() => setExpanded(expanded === candidate.id ? null : candidate.id)}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] flex items-center justify-center text-white text-sm font-black flex-shrink-0">
              {(candidate.full_name || '?')[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-[#0F172A] text-sm">{candidate.full_name}</span>
                {!explanation.requiredMet && (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" title="חסרות דרישות חובה" />
                )}
              </div>
              <div className="text-xs text-[#7C3AED] font-semibold">{candidate.role_name || candidate.domain_name}</div>
              {candidate.location && (
                <div className="flex items-center gap-1 text-xs text-[#94A3B8] mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {candidate.location}
                </div>
              )}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {(candidate.skills || []).slice(0, 3).map(s => (
                  <span key={s} className="text-xs bg-[#F3EFFF] text-[#7C3AED] px-2 py-0.5 rounded-full font-semibold">{s}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <AIMatchBadge score={score} missingRequired={!explanation.requiredMet} />
              <ChevronRight className={`w-4 h-4 text-[#94A3B8] transition-transform ${expanded === candidate.id ? 'rotate-90' : ''}`} />
            </div>
          </div>

          {expanded === candidate.id && (
            <div className="border-t border-[#E4ECFF] px-4 pb-4 pt-3 space-y-3 bg-[#FAFBFF]">
              {explanation.gaps.length > 0 && (
                <div>
                  <div className="text-xs font-black text-red-500 mb-1">פערים</div>
                  {explanation.gaps.map((g, i) => <div key={i} className="text-xs text-[#374151]">• {g}</div>)}
                </div>
              )}
              {explanation.recommendations.length > 0 && (
                <div>
                  <div className="text-xs font-black text-[#7C3AED] mb-1">המלצה</div>
                  {explanation.recommendations.slice(0, 2).map((r, i) => <div key={i} className="text-xs text-[#374151]">• {r}</div>)}
                </div>
              )}
              {explanation.nextAction && (
                <div className="text-xs font-black text-[#2F80FF]">← {explanation.nextAction}</div>
              )}
              {onAddToPipeline && (
                <button
                  onClick={() => onAddToPipeline(candidate)}
                  className="w-full h-9 rounded-xl bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] text-white text-xs font-black flex items-center justify-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  הוסף ל-Pipeline
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}