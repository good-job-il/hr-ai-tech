import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Search, RefreshCw, User, Mail, Copy, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const POOL_EMAIL_ADDRESS = 'r.rodion2802+pool@gmail.com'; // General Pool Email

const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  interview: 'bg-purple-100 text-purple-700',
  offer: 'bg-orange-100 text-orange-700',
  hired: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  inactive: 'bg-gray-100 text-gray-500',
};
const STATUS_LABELS = {
  new: 'חדש', contacted: 'פנייה', interview: 'ראיון',
  offer: 'הצעה', hired: 'גויס', rejected: 'נדחה', inactive: 'לא פעיל',
};

// Resolve candidate route based on current URL path (which layout we're inside)
function useCandidateRoute() {
  const location = useLocation();
  const path = location.pathname;
  if (path.startsWith('/recruitment/')) return '/recruitment/crm/candidate';
  if (path.startsWith('/admin/')) return '/admin/crm/candidate';
  if (path.startsWith('/recruiter/')) return '/recruiter/crm/candidate';
  if (path.startsWith('/employer/')) return '/employer/crm/candidate';
  return '/crm/candidate';
}

export default function GeneralPoolPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const candidateRoute = useCandidateRoute();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const loadPoolCandidates = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch all candidates from the general pool (source === 'pool' or no job applications)
      const allCandidates = await base44.entities.Candidate.list('-created_date', 500);
      
      // Filter: candidates from pool source OR without applications
      const poolCandidates = allCandidates.filter(c => 
        c.source === 'pool' || c.source === 'import'
      );
      
      setCandidates(poolCandidates);
    } catch (err) {
      console.error('Failed to load pool candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user) loadPoolCandidates(); 
  }, [user?.email]);

  const filtered = candidates.filter(c =>
    !search ||
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.role_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.domain_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.skills?.some(skill => skill.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(POOL_EMAIL_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div dir="rtl" className="p-4 bg-[#F7F8FC] min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header with Pool Email */}
        <div className="bg-white rounded-2xl border border-[#E4ECFF] p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black text-[#0F172A] mb-2">מאגר מועמדים כללי</h1>
              <p className="text-sm text-[#64748B]">
                קורות חיים שנשלחים לכתובת המייל הכללית נכנסים למאגר זה ללא שיוך למשרה
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={loadPoolCandidates} className="gap-1.5 text-xs">
                <RefreshCw className="w-3.5 h-3.5" /> רענן
              </Button>
            </div>
          </div>

          {/* Pool Email Display */}
          <div className="bg-gradient-to-l from-[#F3EFFF] to-[#EFF6FF] rounded-xl p-5 border border-[#C4B5FD]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-black text-[#7C3AED] uppercase tracking-wide">כתובת מייל כללית</div>
                <div className="text-sm font-bold text-[#0F172A]">שלח קורות חיים לכתובת זו</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-[#E4ECFF]">
              <code className="text-sm font-bold text-[#7C3AED] flex-1 dir-ltr text-left">
                {POOL_EMAIL_ADDRESS}
              </code>
              <Button 
                size="sm" 
                onClick={handleCopyEmail}
                className="gap-1.5 text-xs bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
              >
                {copied ? (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> הועתק</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> העתק</>
                )}
              </Button>
            </div>
            <div className="mt-3 text-xs text-[#64748B] flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              <span>
                {candidates.length} מועמדים במאגר הכללי
              </span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-[#E4ECFF] p-4 mb-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <Input 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="חפש לפי שם, אימייל, תפקיד, תחום, או מיומנות..." 
              className="pr-9 text-sm" 
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#E4ECFF] overflow-hidden">
          {loading ? (
            <div className="space-y-0">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 border-b border-[#F0F1F5] animate-pulse bg-gray-50/50" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-[#94A3B8]">
              <User className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-bold">לא נמצאו מועמדים</p>
              <p className="text-xs mt-1">שלח קורות חיים לכתובת המייל הכללית</p>
            </div>
          ) : (
            <div>
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-[#F7F8FC] border-b border-[#E4ECFF] text-xs font-black text-[#94A3B8] uppercase tracking-wide">
                <div className="col-span-4">מועמד</div>
                <div className="col-span-2">תפקיד</div>
                <div className="col-span-2">תחום</div>
                <div className="col-span-1 text-center">ניסיון</div>
                <div className="col-span-1 text-center">ציון</div>
                <div className="col-span-2 text-center">סטטוס</div>
              </div>
              {filtered.map(candidate => (
                <CandidateRow
                  key={candidate.id}
                  candidate={candidate}
                  onClick={() => navigate(`${candidateRoute}?id=${candidate.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CandidateRow({ candidate, onClick }) {
  const initials = candidate.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  const score = candidate.data_quality_score || candidate.parsing_confidence || 0;

  return (
    <div onClick={onClick}
      className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-[#F0F1F5] hover:bg-[#F7F8FC] cursor-pointer transition-colors group items-center">
      {/* Name */}
      <div className="col-span-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-[#0F172A] truncate">{candidate.full_name}</div>
          <div className="text-xs text-[#94A3B8] truncate">{candidate.email}</div>
        </div>
      </div>
      {/* Role */}
      <div className="col-span-2 text-sm text-[#64748B] truncate">{candidate.role_name || '—'}</div>
      {/* Domain */}
      <div className="col-span-2 text-sm text-[#64748B] truncate">{candidate.domain_name || '—'}</div>
      {/* Experience */}
      <div className="col-span-1 text-center">
        <span className="text-sm font-bold text-[#0F172A]">{candidate.experience_years ?? '—'}</span>
        {candidate.experience_years && <span className="text-xs text-[#94A3B8]">y</span>}
      </div>
      {/* Score */}
      <div className="col-span-1 text-center">
        <span className={`text-sm font-black ${score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-[#CBD5E1]'}`}>
          {score ? `${score}%` : '—'}
        </span>
      </div>
      {/* Status */}
      <div className="col-span-2 flex items-center justify-center gap-2">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[candidate.status] || 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABELS[candidate.status] || candidate.status}
        </span>
        <User className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#7C3AED] transition-colors" />
      </div>
    </div>
  );
}