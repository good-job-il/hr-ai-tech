import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';

const REJECT_REASONS = [
  'אין התאמה לתפקיד',
  'ציפיות שכר גבוהות מדי',
  'חוסר ניסיון רלוונטי',
  'מיקום גאוגרפי לא מתאים',
  'ראיון לא מוצלח',
  'לא עמד בדרישות טכניות',
  'הצעה קיבל ממקום אחר',
  'אחר',
];

export default function RejectModal({ candidateName, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);

  const finalReason = reason === 'אחר' ? custom : reason;

  const handleConfirm = async () => {
    if (!finalReason.trim()) return;
    setLoading(true);
    await onConfirm(finalReason.trim());
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#F0F1F5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h2 className="font-black text-[#0F172A] text-base">דחיית מועמד</h2>
              <p className="text-xs text-[#94A3B8]">{candidateName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0F172A] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-sm font-semibold text-[#64748B]">בחר סיבת דחייה:</p>
          <div className="grid grid-cols-1 gap-2">
            {REJECT_REASONS.map(r => (
              <button key={r} onClick={() => setReason(r)}
                className={`text-sm font-semibold text-right px-4 py-2.5 rounded-xl border-2 transition-all ${
                  reason === r
                    ? 'bg-red-50 border-red-400 text-red-600'
                    : 'border-[#E4ECFF] text-[#374151] hover:border-red-200 hover:bg-red-50/50'
                }`}>
                {r}
              </button>
            ))}
          </div>

          {reason === 'אחר' && (
            <textarea
              value={custom}
              onChange={e => setCustom(e.target.value)}
              placeholder="פרט את הסיבה..."
              className="w-full border border-[#E4ECFF] rounded-xl px-4 py-2.5 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          )}
        </div>

        <div className="flex gap-2 p-5 pt-0">
          <Button variant="ghost" onClick={onClose} className="flex-1 text-sm">ביטול</Button>
          <Button
            onClick={handleConfirm}
            disabled={!finalReason.trim() || loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm">
            {loading ? 'מבצע...' : 'אשר דחייה'}
          </Button>
        </div>
      </div>
    </div>
  );
}