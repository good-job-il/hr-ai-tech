/**
 * MatchExplanationCard
 * Shows full AI match explanation: strengths, gaps, risks,
 * recommendations, screening questions, next action.
 */
import React, { useState } from 'react';
import {
  CheckCircle2, XCircle, AlertTriangle, Lightbulb,
  MessageSquare, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import AIMatchBadge from './AIMatchBadge';

function Section({ icon: Icon, title, items, color, emptyText }) {
  if (!items || items.length === 0) {
    if (emptyText) return null;
    return null;
  }
  return (
    <div>
      <div className={`flex items-center gap-2 mb-2`}>
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm font-black text-[#0F172A]">{title}</span>
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[#374151]">
            <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${color.replace('text-', 'bg-')}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MatchExplanationCard({ explanation, candidateName, jobTitle, collapsed = false }) {
  const [open, setOpen] = useState(!collapsed);
  if (!explanation) return null;

  return (
    <div className="rounded-2xl border border-[#E4ECFF] bg-white overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-l from-[#F3EFFF] to-[#EAF8FF] hover:opacity-90 transition-all"
      >
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-[#7C3AED]" />
          <div className="text-right">
            <div className="font-black text-[#0F172A] text-sm">
              ניתוח AI-Assisted Matching
            </div>
            {(candidateName || jobTitle) && (
              <div className="text-xs text-[#64748B]">
                {candidateName}{candidateName && jobTitle ? ' ← ' : ''}{jobTitle}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AIMatchBadge score={explanation.score} missingRequired={!explanation.requiredMet} size="lg" />
          <span className="text-xs font-bold text-[#64748B]">{explanation.label}</span>
          {open ? <ChevronUp className="w-4 h-4 text-[#94A3B8]" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />}
        </div>
      </button>

      {open && (
        <div className="p-5 space-y-5">
          {/* Required criteria warning */}
          {!explanation.requiredMet && explanation.missingRequired?.length > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-black text-red-700">חסרות דרישות חובה</div>
                {explanation.missingRequired.map((m, i) => (
                  <div key={i} className="text-xs text-red-600 mt-0.5">{m}</div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Section
              icon={CheckCircle2} title="נקודות חוזק" color="text-green-600"
              items={explanation.strengths}
            />
            <Section
              icon={XCircle} title="פערים וחסרים" color="text-red-500"
              items={explanation.gaps}
            />
            <Section
              icon={AlertTriangle} title="סיכונים" color="text-amber-500"
              items={explanation.risks}
            />
            <Section
              icon={Lightbulb} title="המלצות" color="text-blue-500"
              items={explanation.recommendations}
            />
          </div>

          {/* Screening questions */}
          {explanation.screeningQuestions?.length > 0 && (
            <div className="border-t border-[#F1F5F9] pt-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-[#7C3AED]" />
                <span className="text-sm font-black text-[#0F172A]">שאלות מומלצות לסינון</span>
              </div>
              <ol className="space-y-2">
                {explanation.screeningQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#F3EFFF] text-[#7C3AED] text-xs font-black flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm text-[#374151]">{q}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Next action */}
          {explanation.nextAction && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7FBFF] border border-[#E4ECFF]">
              <span className="text-sm text-[#64748B] font-semibold">פעולה מומלצת הבאה</span>
              <span className="text-sm font-black text-[#7C3AED]">← {explanation.nextAction}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}