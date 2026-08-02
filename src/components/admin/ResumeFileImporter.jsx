/**
 * ResumeFileImporter
 * Upload single or multiple PDF/DOC/DOCX files.
 * Shows per-file progress, conversion status, parsing results.
 */
import { useState, useRef } from 'react';
import { candidateImportService } from '@/api/services/candidateImportService';
import { fileService } from '@/api/services/fileService';
import { useAuth } from '@/lib/AuthContext';
import {
  Upload, FileText, CheckCircle2, XCircle, AlertTriangle,
  Loader2, ChevronDown, ChevronUp, FileCheck2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.txt';
const TYPE_LABELS = { pdf: 'PDF', doc: 'DOC', docx: 'DOCX', txt: 'TXT' };
const TYPE_COLORS = {
  pdf: 'bg-red-50 text-red-700 border-red-200',
  doc: 'bg-blue-50 text-blue-700 border-blue-200',
  docx: 'bg-blue-50 text-blue-700 border-blue-200',
  txt: 'bg-gray-50 text-gray-700 border-gray-200',
};

function getFileExt(filename) {
  return (filename || '').split('.').pop().toLowerCase().replace(/[^a-z]/g, '');
}

function FileRow({ file, status }) {
  const [expanded, setExpanded] = useState(false);
  const ext = getFileExt(file.name);
  const typeColor = TYPE_COLORS[ext] || 'bg-gray-50 text-gray-600 border-gray-200';

  return (
    <div className="border border-[#E4ECFF] rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <FileText className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
        <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${typeColor}`}>{TYPE_LABELS[ext] || ext.toUpperCase()}</span>
        <span className="text-sm font-semibold text-[#0F172A] flex-1 truncate">{file.name}</span>
        <span className="text-xs text-[#94A3B8]">{(file.size / 1024).toFixed(0)} KB</span>

        {!status && <span className="w-4 h-4 rounded-full border-2 border-[#E4ECFF] flex-shrink-0" />}
        {status === 'uploading' && <Loader2 className="w-4 h-4 text-[#7C3AED] animate-spin flex-shrink-0" />}
        {status?.candidate_id && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
        {status?.errors?.length > 0 && !status?.candidate_id && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
        {status?.duplicate_of_id && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}

        {status && status !== 'uploading' && (
          <button onClick={() => setExpanded(x => !x)} className="text-[#94A3B8] hover:text-[#64748B]">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {expanded && status && status !== 'uploading' && (
        <div className="px-4 pb-3 border-t border-[#F0F1F5] bg-[#F7F8FC] space-y-2 pt-3">
          {/* Steps */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(status.steps || {}).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                {String(val).includes('fail') || String(val).includes('error')
                  ? <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  : <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                <span className="text-xs text-[#64748B]"><b>{key}:</b> {String(val).substring(0, 40)}</span>
              </div>
            ))}
          </div>

          {/* IDs */}
          {status.candidate_id && (
            <p className="text-xs text-[#94A3B8]">
              Candidate ID: <span className="font-mono font-bold text-[#7C3AED]">{status.candidate_id}</span>
              {status.document_id && <> • Doc ID: <span className="font-mono font-bold text-[#2563EB]">{status.document_id}</span></>}
            </p>
          )}
          {status.duplicate_of_id && (
            <p className="text-xs text-amber-700 font-semibold">⚠ כפילות — קיים מועמד: {status.duplicate_of_id}</p>
          )}

          {/* Errors */}
          {status.errors?.length > 0 && (
            <div className="p-2 bg-red-50 rounded-lg border border-red-100">
              {status.errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResumeFileImporter({ onImportComplete }) {
  const { user } = useAuth();
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [fileStatuses, setFileStatuses] = useState({}); // filename → status object | 'uploading'
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (newFiles) => {
    const arr = Array.from(newFiles).filter(f => {
      const ext = getFileExt(f.name);
      return ['pdf', 'doc', 'docx', 'txt'].includes(ext);
    });
    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      return [...prev, ...arr.filter(f => !existingNames.has(f.name))];
    });
    setSummary(null);
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const runImport = async () => {
    if (!files.length || running) return;
    setRunning(true);
    setSummary(null);

    // Mark all as uploading
    const initStatuses = {};
    files.forEach(f => { initStatuses[f.name] = 'uploading'; });
    setFileStatuses(initStatuses);

    try {
      // Upload all files to storage
      const uploaded = [];
      for (const file of files) {
        const { file_url } = await fileService.upload(file);
        uploaded.push({
          file_url,
          filename: file.name,
          file_size: file.size,
        });
      }

      // Create batch record
      const batch = await candidateImportService.create({
        organization_id: user?.organization_id,
        batch_name: `Resume Import ${files.length} קבצים — ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: he })}`,
        source_file: files.map(f => f.name).join(', '),
        file_type: 'zip', // multi-file
        imported_by: user?.email,
        recruiter_id: user?.id,
        team_manager_id: user?.role === 'team_manager' ? user.id : user?.team_manager_id,
        recruitment_manager_id: user?.recruitment_manager_id,
        status: 'pending',
      });

      // Call importResumeFiles backend function
      const res = await candidateImportService.importResumes({
        files: uploaded,
        batchId: batch.id,
        employer_id: '',
        recruiter_id: user?.id,
      });

      const d = res.data;

      // Map results back to file statuses
      const newStatuses = {};
      (d.results || []).forEach(r => {
        newStatuses[r.filename] = r;
      });
      setFileStatuses(newStatuses);

      setSummary({
        batch_id: batch.id,
        successful: d.successful,
        failed: d.failed,
        duplicates: d.duplicates,
        conversionFailed: d.conversionFailed,
        parsingFailed: d.parsingFailed,
      });

      onImportComplete?.();

    } catch (err) {
      setSummary({ error: err.message });
      const errStatuses = {};
      files.forEach(f => { errStatuses[f.name] = { errors: [err.message], steps: {} }; });
      setFileStatuses(errStatuses);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          dragging ? 'border-[#7C3AED] bg-[#F3EFFF]' : 'border-[#E4ECFF] hover:border-[#7C3AED]'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <Upload className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" />
        <p className="font-bold text-[#374151]">גרור קבצי קורות חיים כאן או לחץ להעלאה</p>
        <p className="text-xs text-[#94A3B8] mt-1">PDF • DOC • DOCX • TXT • כמה קבצים בו זמנית</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div key={file.name} className="flex items-center gap-2">
              <div className="flex-1">
                <FileRow file={file} status={fileStatuses[file.name] || null} />
              </div>
              {!running && !fileStatuses[file.name] && (
                <button onClick={() => removeFile(idx)} className="text-[#94A3B8] hover:text-red-500 transition-colors flex-shrink-0">
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {summary && !summary.error && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck2 className="w-4 h-4 text-green-600" />
            <span className="font-bold text-green-800">הייבוא הסתיים</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
            {[
              { label: 'נקלטו', val: summary.successful, color: 'text-green-700' },
              { label: 'כפילויות', val: summary.duplicates, color: 'text-amber-600' },
              { label: 'כשלונות', val: summary.failed, color: 'text-red-600' },
              { label: 'המרה נכשלה', val: summary.conversionFailed, color: 'text-orange-600' },
              { label: 'Parsing נכשל', val: summary.parsingFailed, color: 'text-purple-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-lg border border-green-100 p-2">
                <div className={`text-lg font-black ${s.color}`}>{s.val ?? 0}</div>
                <div className="text-xs text-[#94A3B8]">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#64748B] mt-2">Batch ID: <span className="font-mono">{summary.batch_id}</span></p>
        </div>
      )}
      {summary?.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-red-700">{summary.error}</span>
        </div>
      )}

      {/* Action */}
      <div className="flex gap-2">
        <Button
          onClick={runImport}
          disabled={!files.length || running}
          className="flex-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
        >
          {running
            ? <><Loader2 className="w-4 h-4 animate-spin ml-2" />מעבד {files.length} קבצים...</>
            : <><Upload className="w-4 h-4 ml-2" />ייבא {files.length || ''} קבצי קורות חיים</>}
        </Button>
        {files.length > 0 && !running && (
          <Button variant="outline" onClick={() => { setFiles([]); setFileStatuses({}); setSummary(null); }}>
            נקה
          </Button>
        )}
      </div>
    </div>
  );
}
