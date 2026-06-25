import { X, FileText, MapPin, Briefcase, Building2, Globe, Download, ExternalLink } from 'lucide-react';
import { usePermissionMatrix } from '@/hooks/usePermissionMatrix';

export default function ResumePreviewModal({ candidate, onClose }) {
  const { can } = usePermissionMatrix();
  if (!candidate) return null;

  const resumeUrl = candidate.resume_url;
  const convertedUrl = candidate.converted_resume_url;
  const originalUrl = candidate.original_resume_url;
  const isPdf = resumeUrl && (
    candidate.original_file_type === 'pdf' ||
    resumeUrl.toLowerCase().includes('.pdf')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col mx-4"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4ECFF]">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#7C3AED]" />
            <h2 className="text-base font-black text-[#0F172A]">קורות חיים — {candidate.full_name}</h2>
          </div>
          <div className="flex items-center gap-2">
            {resumeUrl && (
              <>
                <a href={resumeUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] hover:text-[#6D28D9] px-3 py-1.5 rounded-lg border border-[#E4ECFF] hover:border-[#7C3AED] transition-all">
                  <ExternalLink className="w-3.5 h-3.5" /> פתח
                </a>
                {can('download_cv') && (
                  <a href={resumeUrl} download
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] px-3 py-1.5 rounded-lg transition-all">
                    <Download className="w-3.5 h-3.5" /> הורד
                  </a>
                )}
              </>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F0F1F5] text-[#64748B] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* DOCX / Original file links */}
        {can('download_cv') && (convertedUrl || originalUrl) && (
          <div className="px-6 pt-4 flex flex-wrap gap-2">
            {convertedUrl && (
              <a href={convertedUrl} download
                className="flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] bg-[#EEF4FF] hover:bg-[#E0E7FF] px-3 py-1.5 rounded-lg transition-all">
                <Download className="w-3.5 h-3.5" /> הורד DOCX
              </a>
            )}
            {originalUrl && (
              <a href={originalUrl} download
                className="flex items-center gap-1.5 text-xs font-bold text-[#64748B] bg-[#F7F8FC] hover:bg-[#F0F1F5] px-3 py-1.5 rounded-lg transition-all border border-[#E4ECFF]">
                <Download className="w-3.5 h-3.5" /> הורד מקור ({candidate.original_file_type || 'קובץ'})
              </a>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isPdf && resumeUrl ? (
            // PDF: show inline
            <iframe
              src={resumeUrl}
              className="w-full rounded-xl border border-[#E4ECFF]"
              style={{ height: '60vh' }}
              title="קורות חיים"
            />
          ) : (
            // DOCX / no URL: show parsed data
            <div className="space-y-5">
              {/* Summary */}
              {candidate.summary && (
                <Section title="סיכום מקצועי">
                  <p className="text-sm text-[#374151] leading-relaxed">{candidate.summary}</p>
                </Section>
              )}

              {/* Basic Info */}
              <Section title="פרטים">
                <div className="grid grid-cols-2 gap-3">
                  {candidate.role_name && <InfoRow icon={<Briefcase className="w-4 h-4" />} label="תפקיד" value={candidate.role_name} />}
                  {candidate.domain_name && <InfoRow icon={<Globe className="w-4 h-4" />} label="תחום" value={candidate.domain_name} />}
                  {candidate.experience_years && <InfoRow icon={<Briefcase className="w-4 h-4" />} label="ניסיון" value={`${candidate.experience_years} שנים`} />}
                  {candidate.location && <InfoRow icon={<MapPin className="w-4 h-4" />} label="מיקום" value={candidate.location} />}
                  {(candidate.desired_salary_min || candidate.desired_salary_max) && (
                    <InfoRow icon={<Briefcase className="w-4 h-4" />} label="ציפיות שכר"
                      value={`₪${candidate.desired_salary_min?.toLocaleString() || ''}${candidate.desired_salary_max ? `–${candidate.desired_salary_max.toLocaleString()}` : ''}`}
                    />
                  )}
                </div>
              </Section>

              {/* Skills */}
              {candidate.skills?.length > 0 && (
                <Section title="כישורים">
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.map((s, i) => (
                      <span key={i} className="text-sm bg-[#EEF4FF] text-[#4F46E5] font-semibold px-3 py-1 rounded-lg">{s}</span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Previous Companies */}
              {candidate.previous_companies?.length > 0 && (
                <Section title="חברות קודמות">
                  <div className="space-y-2">
                    {candidate.previous_companies.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-[#374151]">
                        <Building2 className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
                        {c}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Languages */}
              {candidate.languages?.length > 0 && (
                <Section title="שפות">
                  <div className="flex flex-wrap gap-2">
                    {candidate.languages.map((l, i) => (
                      <span key={i} className="text-sm bg-[#F0FDF4] text-[#16A34A] font-semibold px-3 py-1 rounded-lg">{l}</span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Notes */}
              {candidate.notes && (
                <Section title="הערות">
                  <p className="text-sm text-[#374151] leading-relaxed">{candidate.notes}</p>
                </Section>
              )}

              {!candidate.summary && !candidate.skills?.length && !candidate.previous_companies?.length && (
                <div className="text-center py-10 text-[#94A3B8]">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">אין נתונים מפורסרים</p>
                  <p className="text-xs mt-1">הנתונים טרם נחלצו מקורות החיים</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-black text-[#94A3B8] uppercase tracking-wide mb-2">{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[#94A3B8] mt-0.5">{icon}</span>
      <div>
        <div className="text-xs text-[#94A3B8] font-semibold">{label}</div>
        <div className="text-sm font-bold text-[#1F2937]">{value}</div>
      </div>
    </div>
  );
}