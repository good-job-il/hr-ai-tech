/**
 * AIMatchBadge — compact score pill used in cards and tables.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, AlertTriangle } from 'lucide-react';

export default function AIMatchBadge({ score, missingRequired = false, size = 'sm' }) {
  const { t } = useTranslation();
  
  if (score == null) return null;

  const color = score >= 85 ? { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0' }
              : score >= 70 ? { bg: '#FEF9C3', text: '#CA8A04', border: '#FEF08A' }
              : score >= 50 ? { bg: '#FFEDD5', text: '#EA580C', border: '#FED7AA' }
              :               { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' };

  const pxClass = size === 'lg' ? 'px-3 py-1.5 text-sm gap-1.5' : 'px-2 py-1 text-xs gap-1';

  return (
    <div
      className={`inline-flex items-center rounded-full font-black border ${pxClass}`}
      style={{ background: color.bg, color: color.text, borderColor: color.border }}
      title={t('aiMatching.matchBadge.aiMatchScore', { score })}
    >
      {missingRequired
        ? <AlertTriangle className="w-3 h-3" />
        : <Sparkles className="w-3 h-3" />
      }
      {score}%
    </div>
  );
}