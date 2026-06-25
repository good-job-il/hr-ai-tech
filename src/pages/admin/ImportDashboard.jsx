/**
 * ImportDashboard — PHASE 5
 * Full Import → CRM → ATS → AI pipeline management
 * Includes: batch history, per-batch stats, retry, validation test
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Upload, CheckCircle2, AlertTriangle, Clock, RefreshCw,
  Users, FileText, Zap, Eye, Play, ChevronDown, ChevronUp,
  Download, XCircle, Info, FileScan
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import ResumeFileImporter from '@/components/admin/ResumeFileImporter';

// ── 3 validation test candidates ─────────────────────────────────────────────
const TEST_CSV = `full_name,email,phone,role_name,domain_name,location,experience_years,skills,summary,resume_url
ישראל ישראלי,israel@test.com,0501234567,מפתח Full Stack,פיתוח תוכנה,תל אביב,5,React;Node.js;PostgreSQL,מפתח מנוסה עם ניסיון ב-SaaS,
שרה כהן,,0529876543,מנהלת מוצר,ניהול מוצר,הרצליה,8,Product Strategy;Agile;B2B,מנהלת מוצר ותיקה ללא אימייל,
ישראל ישראלי,israel@test.com,0501234567,מפתח Full Stack,פיתוח תוכנה,תל אביב,5,React;Node.js,כפילות מכוונת לבדיקה,`;

const STATUS_CONFIG = {
  pending:     { label: 'ממתין',    color: 'bg-gray-100 text-gray-600',   icon: Clock },
  in_progress: { label: 'בתהליך',  color: 'bg-yellow-100 text-yellow-700', icon: RefreshCw },
  completed:   { label: 'הושלם',   color: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  failed:      { label: 'נכשל',    color: 'bg-red-100 text-red-700',      icon: XCircle },
};

export default function ImportDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('resume'); // 'resume' | 'csv'
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null); // { type: 'success'|'error', text }
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [runningValidation, setRunningValidation] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const { data: batches = [], refetch } = useQuery({
    queryKey: ['import-batches'],
    queryFn: () => base44.entities.CandidateImportBatch.list('-created_date', 50),
    refetchInterval: (query) => {
      const data = query.state?.data;
      const hasActive = Array.isArray(data) && data.some(b => b.status === 'in_progress');
      return hasActive ? 4000 : false;
    },
  });

  // ── File upload & import ──────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const batch = await base44.entities.CandidateImportBatch.create({
        batch_name: `${file.name.replace(/\.[^/.]+$/, '')} — ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: he })}`,
        source_file: file.name,
        file_type: file.name.endsWith('.csv') ? 'csv' : file.name.endsWith('.json') ? 'json' : 'xlsx',
        imported_by: user?.email,
        status: 'pending',
      });
      const res = await base44.functions.invoke('importCandidatesFromFile', {
        fileUrl: file_url,
        batchId: batch.id,
        fileName: file.name,
      });
      const d = res.data;
      setUploadMsg({ type: 'success', text: `יובאו ${d.successful} מועמדים • ${d.duplicates} כפילויות • ${d.failed} כשלונות` });
      setFile(null);
      document.getElementById('importFileInput').value = '';
      refetch();
    } catch (e) {
      setUploadMsg({ type: 'error', text: e.message });
    } finally {
      setUploading(false);
    }
  };

  // ── Validation test with 3 test candidates ───────────────────────────────
  const runValidationTest = async () => {
    setRunningValidation(true);
    setValidationResult(null);
    try {
      const blob = new Blob([TEST_CSV], { type: 'text/csv' });
      const testFile = new File([blob], 'validation_test.csv', { type: 'text/csv' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file: testFile });
      const batch = await base44.entities.CandidateImportBatch.create({
        batch_name: `Validation Test — ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: he })}`,
        source_file: 'validation_test.csv',
        file_type: 'csv',
        imported_by: user?.email,
        status: 'pending',
      });
      const res = await base44.functions.invoke('importCandidatesFromFile', {
        fileUrl: file_url,
        batchId: batch.id,
        fileName: 'validation_test.csv',
      });
      const d = res.data;
      setValidationResult({
        success: true,
        batch_id: batch.id,
        successful: d.successful,
        duplicates: d.duplicates,
        failed: d.failed,
        missingEmail: d.missingEmail,
        checks: [
          { label: 'מועמד עם email + phone', pass: d.successful >= 1, note: `${d.successful} נקלטו` },
          { label: 'מועמד ללא email', pass: d.missingEmail >= 1, note: `${d.missingEmail} ללא אימייל` },
          { label: 'זיהוי כפילות', pass: d.duplicates >= 1, note: `${d.duplicates} כפילויות זוהו` },
        ],
      });
      refetch();
    } catch (e) {
      setValidationResult({ success: false, error: e.message });
    } finally {
      setRunningValidation(false);
    }
  };

  // ── Retry failed batch ────────────────────────────────────────────────────
  const retryBatch = async (batch) => {
    if (!batch.source_file) return;
    setUploadMsg({ type: 'success', text: `מנסה שוב batch: ${batch.batch_name}...` });
    await base44.entities.CandidateImportBatch.update(batch.id, { status: 'pending', retry_count: (batch.retry_count || 0) + 1 });
    refetch();
  };

  // ── CSV template download ─────────────────────────────────────────────────
  const downloadTemplate = () => {
    const template = 'full_name,email,phone,role_name,domain_name,location,experience_years,desired_salary_min,desired_salary_max,skills,languages,summary,resume_url,resume_filename,recruiter_id,employer_id,job_id\n';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([template], { type: 'text/csv' }));
    a.download = 'candidates_import_template.csv';
    a.click();
  };

  const totalImported = batches.reduce((s, b) => s + (b.successful_imports || 0), 0);
  const totalDuplicates = batches.reduce((s, b) => s + (b.duplicate_found || 0), 0);
  const totalFailed = batches.reduce((s, b) => s + (b.failed_imports || 0), 0);
  const totalConversionFailed = batches.reduce((s, b) => s + (b.conversion_failures || 0), 0);
  const totalParsingFailed = batches.reduce((s, b) => s + (b.parsing_failures || 0), 0);

  return (
    <div dir="rtl" className="p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-[#0F172A]">דשבורד ייבואים</h1>
            <p className="text-sm text-[#64748B] mt-0.5">ייבוא מועמדים → CRM → ATS → AI Matching</p>
          </div>
          <Button size="sm" variant="outline" onClick={downloadTemplate} className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> הורד תבנית CSV
          </Button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'אצוות', value: batches.length, color: '#7C3AED', icon: FileText },
            { label: 'יובאו', value: totalImported, color: '#10B981', icon: Users },
            { label: 'כפילויות', value: totalDuplicates, color: '#F59E0B', icon: Info },
            { label: 'כשלונות', value: totalFailed, color: '#EF4444', icon: XCircle },
            { label: 'המרה נכשלה', value: totalConversionFailed, color: '#F97316', icon: RefreshCw },
            { label: 'Parsing נכשל', value: totalParsingFailed, color: '#8B5CF6', icon: FileScan },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-[#E4ECFF] p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div>
                  <div className="text-2xl font-black text-[#0F172A]">{s.value}</div>
                  <div className="text-xs text-[#94A3B8] font-semibold">{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Import Tabs */}
        <div className="bg-white rounded-2xl border border-[#E4ECFF] overflow-hidden">
          {/* Tab header */}
          <div className="flex border-b border-[#E4ECFF]">
            <button
              onClick={() => setActiveTab('resume')}
              className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors border-b-2 ${
                activeTab === 'resume'
                  ? 'border-[#7C3AED] text-[#7C3AED] bg-[#F3EFFF]'
                  : 'border-transparent text-[#64748B] hover:text-[#7C3AED]'
              }`}
            >
              <FileScan className="w-4 h-4" />
              ייבוא קבצי קורות חיים
              <span className="text-xs bg-[#7C3AED] text-white px-1.5 py-0.5 rounded-full">חדש</span>
            </button>
            <button
              onClick={() => setActiveTab('csv')}
              className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors border-b-2 ${
                activeTab === 'csv'
                  ? 'border-[#7C3AED] text-[#7C3AED] bg-[#F3EFFF]'
                  : 'border-transparent text-[#64748B] hover:text-[#7C3AED]'
              }`}
            >
              <FileText className="w-4 h-4" />
              ייבוא CSV
            </button>
          </div>

          <div className="p-6">
            {/* Resume file import tab */}
            {activeTab === 'resume' && (
              <div>
                <p className="text-sm text-[#64748B] mb-4 font-semibold">
                  העלה קבצי PDF, DOC או DOCX — המערכת תמיר ל-DOCX, תנתח אוטומטית ותיצור מועמד ב-CRM
                </p>
                <ResumeFileImporter onImportComplete={() => refetch()} />
              </div>
            )}

            {/* CSV import tab */}
            {activeTab === 'csv' && (
              <div>
                <p className="text-sm text-[#64748B] mb-4 font-semibold">ייבא מועמדים מקובץ CSV עם עמודות מוגדרות</p>
                <div
                  className="border-2 border-dashed border-[#E4ECFF] rounded-xl p-8 text-center hover:border-[#7C3AED] transition-colors cursor-pointer"
                  onClick={() => document.getElementById('importFileInput').click()}
                >
                  <Upload className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" />
                  <p className="font-bold text-[#374151]">{file ? file.name : 'גרור קובץ CSV כאן או לחץ להעלאה'}</p>
                  <p className="text-xs text-[#94A3B8] mt-1">CSV בלבד • עמודות: full_name, email, phone, role_name, skills...</p>
                  <input id="importFileInput" type="file" accept=".csv" className="hidden"
                    onChange={e => { setFile(e.target.files?.[0] || null); setUploadMsg(null); }} />
                </div>

                {uploadMsg && (
                  <div className={`mt-3 p-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${uploadMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {uploadMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                    {uploadMsg.text}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button onClick={handleUpload} disabled={!file || uploading} className="flex-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
                    {uploading ? <><RefreshCw className="w-4 h-4 animate-spin ml-2" />מייבא...</> : <><Upload className="w-4 h-4 ml-2" />ייבא מועמדים</>}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Validation Test */}
        <div className="bg-white rounded-2xl border border-[#E4ECFF] p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-black text-[#0F172A]">בדיקת אימות</h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">מריץ 3 מועמדי בדיקה: עם email+phone, ללא email, כפילות</p>
            </div>
            <Button size="sm" onClick={runValidationTest} disabled={runningValidation}
              className="bg-[#F3EFFF] text-[#7C3AED] hover:bg-[#E9E3FF] border border-[#C4B5FD] gap-1.5">
              {runningValidation ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              {runningValidation ? 'רץ...' : 'הרץ בדיקה'}
            </Button>
          </div>

          {validationResult && (
            <div className={`rounded-xl p-4 ${validationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {validationResult.success ? (
                <div className="space-y-2">
                  {validationResult.checks.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {c.pass
                        ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                      <span className={`text-sm font-semibold ${c.pass ? 'text-green-800' : 'text-red-700'}`}>{c.label}</span>
                      <span className="text-xs text-[#64748B] mr-auto">{c.note}</span>
                    </div>
                  ))}
                  <div className="text-xs text-[#64748B] pt-2 border-t border-green-200 mt-2">
                    Batch ID: {validationResult.batch_id}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-red-700 font-semibold">שגיאה: {validationResult.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Batch History */}
        <div className="bg-white rounded-2xl border border-[#E4ECFF] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-[#0F172A]">היסטוריית אצוות</h2>
            <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> רענן
            </Button>
          </div>

          {batches.length === 0 ? (
            <div className="text-center py-10 text-[#94A3B8]">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-sm">אין batches עדיין</p>
            </div>
          ) : (
            <div className="space-y-2">
              {batches.map(batch => {
                const cfg = STATUS_CONFIG[batch.status] || STATUS_CONFIG.pending;
                const StatusIcon = cfg.icon;
                const isExpanded = expandedBatch === batch.id;

                return (
                  <div key={batch.id} className="border border-[#E4ECFF] rounded-xl overflow-hidden">
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#F7F8FC] transition-colors"
                      onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}
                    >
                      <StatusIcon className={`w-4 h-4 flex-shrink-0 ${batch.status === 'in_progress' ? 'animate-spin' : ''}`}
                        style={{ color: cfg.color.includes('green') ? '#10B981' : cfg.color.includes('yellow') ? '#F59E0B' : cfg.color.includes('red') ? '#EF4444' : '#64748B' }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-[#0F172A] truncate">{batch.batch_name}</div>
                        <div className="text-xs text-[#94A3B8]">
                          {batch.created_date ? format(new Date(batch.created_date), 'dd/MM/yyyy HH:mm', { locale: he }) : ''} • {batch.source_file}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
                        {batch.status === 'failed' && (
                          <button onClick={e => { e.stopPropagation(); retryBatch(batch); }}
                            className="text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> retry
                          </button>
                        )}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[#94A3B8]" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-[#F0F1F5] bg-[#F7F8FC]">
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-4">
                          {[
                            { label: 'נקלטו', value: batch.successful_imports || 0, color: '#10B981' },
                            { label: 'כשלונות', value: batch.failed_imports || 0, color: '#EF4444' },
                            { label: 'כפילויות', value: batch.duplicate_found || 0, color: '#F59E0B' },
                            { label: 'המרה נכשלה', value: batch.conversion_failures || 0, color: '#F97316' },
                            { label: 'Parsing נכשל', value: batch.parsing_failures || 0, color: '#8B5CF6' },
                            { label: 'ללא CV', value: batch.missing_resume || 0, color: '#64748B' },
                          ].map(stat => (
                            <div key={stat.label} className="text-center bg-white rounded-xl p-3 border border-[#E4ECFF]">
                              <div className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</div>
                              <div className="text-xs text-[#94A3B8] font-semibold mt-0.5">{stat.label}</div>
                            </div>
                          ))}
                        </div>
                        {batch.error_log && (
                          <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
                            <p className="text-xs font-bold text-red-700 mb-1">שגיאות:</p>
                            <pre className="text-xs text-red-600 whitespace-pre-wrap max-h-32 overflow-y-auto">{batch.error_log}</pre>
                          </div>
                        )}
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => navigate('/admin/crm')}
                            className="text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" /> צפה במועמדים ב-CRM
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}