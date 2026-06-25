import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import SaveJobButton from '@/components/jobs/SaveJobButton';
import ShareButtons from '@/components/jobs/ShareButtons';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowRight, MapPin, Briefcase, Eye, Clock, Send, Upload, AlertCircle, RefreshCw } from 'lucide-react';
import Navbar from '@/components/home/Navbar';
import SEOHead from '@/components/SEOHead';
import SimilarJobsList from '@/components/jobs/SimilarJobsList';
import { logError, getErrorMessage } from '@/lib/errorHandler';

// Validation
const validateForm = (form) => {
  const errors = {};
  if (!form.candidate_name?.trim()) errors.candidate_name = 'שם מלא הוא שדה חובה';
  if (!form.candidate_email?.trim()) errors.candidate_email = 'אימייל הוא שדה חובה';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.candidate_email)) errors.candidate_email = 'כתובת אימייל לא תקינה';
  if (!form.candidate_phone?.trim()) errors.candidate_phone = 'טלפון הוא שדה חובה';
  if (form.desired_salary_min && form.desired_salary_max && Number(form.desired_salary_min) > Number(form.desired_salary_max)) {
    errors.desired_salary_max = 'שכר מקסימום חייב להיות גבוה ממינימום';
  }
  return errors;
};

// Retry helper
const withRetry = async (fn, retries = 2, label = '') => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      console.warn(`[RETRY ${i + 1}/${retries}] ${label}`, err?.message);
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
};

const typeLabels = { full: 'משרה מלאה', part: 'חלקית', daily: 'יומי', remote: 'מרחוק' };

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({ 
    candidate_name: '', 
    candidate_email: '', 
    candidate_phone: '', 
    cover_letter: '',
    desired_salary_min: '',
    desired_salary_max: '',
    location: '',
    resume_url: '',
    resume_filename: '',
    resume_file: null
  });
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [applyError, setApplyError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [profileResume, setProfileResume] = useState(null); // {url, filename}
  const [useProfileResume, setUseProfileResume] = useState(false);

  const { data: job, isLoading, isError: jobLoadError, refetch: refetchJob } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      console.info(`[JobDetail] Loading job id=${id}`);
      const j = await withRetry(() => base44.entities.Job.get(id), 2, 'fetch job');
      if (j) base44.entities.Job.update(id, { views: (j.views || 0) + 1 }).catch(() => {});
      return j || null;
    },
    retry: 1,
    staleTime: 30_000,
  });

  // Load candidate profile to offer existing resume
  useQuery({
    queryKey: ['candidate-profile-resume', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.CandidateProfile.filter({ user_email: user.email });
      const profile = profiles?.[0];
      if (profile?.resume_url) {
        setProfileResume({ url: profile.resume_url, filename: 'קורות חיים קיימים' });
      }
      return profile || null;
    },
    enabled: !!user?.email,
  });

  const { data: similarJobs = [] } = useQuery({
    queryKey: ['similar-jobs', job?.category, id],
    queryFn: async () => {
      if (!job?.category) return [];
      const allJobs = await base44.entities.Job.list('-created_date', 50);
      return allJobs.filter(j => j.category === job.category && j.id !== id && !j.is_closed).slice(0, 3);
    },
    enabled: !!job?.category,
  });

  React.useEffect(() => {
    const handleScroll = () => setScrollPosition(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return null;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await withRetry(() => base44.integrations.Core.UploadFile({ file }), 2, 'upload file');
      console.info(`[JobDetail] File uploaded: ${file.name}`);
      return result.file_url;
    } catch (error) {
      logError(error, 'JobDetail.handleFileUpload');
      setUploadError('העלאת הקובץ נכשלה. אנא בדוק שהקובץ תקין (PDF/Word עד 10MB) ונסה שוב.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleResumeUpload = async (file) => {
    if (!file) return;
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError('הקובץ גדול מדי. גודל מקסימלי הוא 10MB.');
      return;
    }
    setUploadError(null);

    const fileUrl = await handleFileUpload(file);
    if (!fileUrl) return;

    setExtracting(true);
    try {
      console.info(`[JobDetail] Extracting resume data from ${file.name}`);
      const result = await withRetry(
        () => base44.functions.invoke('extractAndTranslateResume', { file_url: fileUrl }),
        1, 'extract resume'
      );
      if (result.data?.data) {
        const extracted = result.data.data;
        setForm(prev => ({
          ...prev,
          candidate_name: extracted.full_name || prev.candidate_name,
          candidate_email: extracted.email || prev.candidate_email,
          candidate_phone: extracted.phone || prev.candidate_phone,
          location: extracted.location || prev.location,
          desired_salary_min: extracted.salary_min || prev.desired_salary_min,
          desired_salary_max: extracted.salary_max || prev.desired_salary_max,
          resume_url: fileUrl,
          resume_filename: file.name,
          resume_file: null
        }));
        console.info('[JobDetail] Resume data extracted successfully');
      } else {
        // File uploaded but extraction failed — still keep the file URL
        setForm(prev => ({ ...prev, resume_url: fileUrl, resume_filename: file.name, resume_file: null }));
      }
    } catch (error) {
      logError(error, 'JobDetail.handleResumeUpload');
      // Still keep the file URL even if extraction fails
      setForm(prev => ({ ...prev, resume_url: fileUrl, resume_filename: file.name, resume_file: null }));
    } finally {
      setExtracting(false);
    }
  };

  const applyMutation = useMutation({
   mutationFn: async (data) => {
     let resumeUrl = data.resume_url;
     if (data.resume_file) {
       resumeUrl = await handleFileUpload(data.resume_file);
     }
     console.info(`[JobDetail] Submitting application for job ${job.id}`);
     return withRetry(() => base44.entities.Application.create({
       ...data,
       resume_url: resumeUrl || null,
       resume_file: undefined,
       desired_salary_min: data.desired_salary_min !== '' ? Number(data.desired_salary_min) : null,
       desired_salary_max: data.desired_salary_max !== '' ? Number(data.desired_salary_max) : null,
       job_id: job.id,
       job_title: job.title,
       company: job.company || null,
       employer_id: job.employer_id || null,
       status: 'new',
       source: 'app',
     }), 2, 'create application');
   },
   onError: (error) => {
     logError(error, 'JobDetail.applyMutation');
     const msg = getErrorMessage(error);
     setApplyError(msg || 'שליחת המועמדות נכשלה. אנא נסה שוב.');
   },
   onSuccess: async (newApp) => {
     setApplyError(null);
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['job', id] });

      // Create timeline entry for submission
      await base44.functions.invoke('createApplicationTimeline', {
        application_id: newApp.id,
        event_type: 'submitted',
        description: `המועמד הגיש מועמדות עבור תפקיד ${job.title}`,
        performed_by_role: 'candidate'
      }).catch(() => {});

      // שלח הודעה למועמד
      await base44.integrations.Core.SendEmail({
        to: form.candidate_email,
        subject: `✓ מועמדותך נקלטה - ${job.title}`,
        body: `שלום ${form.candidate_name},\n\nתודה על הגשת המועמדות שלך עבור תפקיד ${job.title}.\n\nמועמדותך נקלטה בהצלחה במערכת שלנו.\n\nצוות הגיוס שלנו יבדוק אותה ויצור איתך קשר בקרוב אם תתאים למשרה.\n\nבהצלחה!\n\n---\nHeadHunter - פלטפורמת דרושים`
      }).catch(() => {});

      // שלח הודעה למעסיק
      if (job.employer_id) {
        await base44.integrations.Core.SendEmail({
          to: job.employer_id,
          subject: `📧 מועמדות חדשה - ${job.title}`,
          body: `הודעה חדשה!\n\nמועמד חדש הגיש מועמדות עבור תפקיד ${job.title}.\n\nפרטי המועמד:\nשם: ${form.candidate_name}\nטלפון: ${form.candidate_phone}\nאימייל: ${form.candidate_email}\nעיר: ${form.location}\nציפיות שכר: ₪${form.desired_salary_min || '-'} - ₪${form.desired_salary_max || '-'}\n\nאנא בדוק את המועמדות במערכת.`
        }).catch(() => {});
      }

      // Trigger AI match score in background
      base44.functions.invoke('scoreApplication', { application_id: newApp.id }).catch(() => {});
    },
  });

  const handleApply = (e) => {
    e.preventDefault();
    setApplyError(null);
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    applyMutation.mutate(form);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[#0f1629] to-background" dir="rtl">
      <Navbar />
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">טוען פרטי משרה...</p>
      </div>
    </div>
  );

  if (jobLoadError || !job) return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[#0f1629] to-background" dir="rtl">
      <Navbar />
      <div className="flex flex-col items-center justify-center py-32 gap-6 text-center px-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <div>
          <h2 className="text-xl font-bold text-white mb-2">{jobLoadError ? 'שגיאה בטעינת המשרה' : 'המשרה לא נמצאה'}</h2>
          <p className="text-gray-400 text-sm">{jobLoadError ? 'אירעה שגיאה בחיבור לשרת. אנא נסה שוב.' : 'ייתכן שהמשרה הוסרה או שהקישור אינו תקין.'}</p>
        </div>
        <div className="flex gap-3">
          {jobLoadError && (
            <button onClick={() => refetchJob()} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-5 h-10 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all active:scale-95">
              <RefreshCw className="w-4 h-4" /> נסה שוב
            </button>
            )}
            <Link to="/jobs" className="flex items-center gap-2 border border-white/20 text-gray-300 hover:text-white hover:border-white/40 px-5 h-10 rounded-xl text-sm font-semibold transition-all active:scale-95 inline-flex">
            חזרה לכל המשרות
            </Link>
        </div>
      </div>
    </div>
  );

  const seoTitle = job ? `${job.title} ב-${job.company}${job.location ? ` | ${job.location}` : ''} | HeadHunter` : 'משרה';
  const seoDesc = job ? `דרושים: ${job.title} בחברת ${job.company}${job.location ? ` ב${job.location}` : ''}. ${job.salary_min && job.salary_max ? `שכר ₪${job.salary_min.toLocaleString()}–₪${job.salary_max.toLocaleString()}.` : ''} ${job.type ? `${typeLabels[job.type]}.` : ''} הגש מועמדות עכשיו ב-HeadHunter.` : '';

  const jobPostingSchema = job ? {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description || `${job.title} בחברת ${job.company}`,
    "datePosted": job.created_date?.split('T')[0],
    "validThrough": new Date(new Date(job.created_date).setMonth(new Date(job.created_date).getMonth() + 3)).toISOString().split('T')[0],
    "employmentType": job.type === 'full' ? 'FULL_TIME' : job.type === 'part' ? 'PART_TIME' : job.type === 'remote' ? 'TELECOMMUTE' : 'CONTRACTOR',
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company,
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.location || 'ישראל',
        "addressCountry": "IL"
      }
    },
    ...(job.salary_min && job.salary_max ? {
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "ILS",
        "value": {
          "@type": "QuantitativeValue",
          "minValue": job.salary_min,
          "maxValue": job.salary_max,
          "unitText": "MONTH"
        }
      }
    } : {}),
    "url": `https://headhunter.co.il/jobs/${id}`,
    "identifier": {
      "@type": "PropertyValue",
      "name": "HeadHunter",
      "value": id
    }
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[#0f1629] to-background" dir="rtl">
      <SEOHead 
        title={seoTitle}
        description={seoDesc}
        keywords={`דרושים ${job?.title}, ${job?.title} ${job?.location || ''}, ${job?.company} דרושים, משרות ${job?.category || ''}`}
        canonical={`https://headhunter.co.il/jobs/${id}`}
        schemaData={jobPostingSchema}
      />
      <Navbar />



      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Link to="/jobs" className="text-cyan-300 hover:text-purple-300 text-sm font-medium flex items-center gap-2 mb-8">
              <ArrowRight className="w-4 h-4" />
              חזרה לכל המשרות
            </Link>

            {/* Combined Hero Section */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl border border-white/15 p-8 mb-8 shadow-xl">
              <div className="flex items-start gap-6 mb-6">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg"
                  style={{ backgroundColor: job.company_color || '#6d28d9' }}>
                  {job.company_initials || job.company?.slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h1 className="text-4xl font-bold text-white mb-1">{job.title}</h1>
                      <p className="text-cyan-300 text-lg font-semibold">{job.company}</p>
                    </div>
                    <SaveJobButton job={job} user={user} />
                  </div>
                </div>
              </div>

              {/* Key Info */}
              <div className="flex flex-wrap gap-6 mb-6 pb-6 border-b border-white/10 text-base text-gray-300">
                {job.location && <span className="flex items-center gap-2"><MapPin className="w-5 h-5 text-cyan-400" />{job.location}</span>}
                {job.type && <span className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-cyan-400" />{typeLabels[job.type]}</span>}
                {job.views > 0 && <span className="flex items-center gap-2"><Eye className="w-5 h-5 text-cyan-400" />{job.views} צפיות</span>}
                <span className="flex items-center gap-2"><Clock className="w-5 h-5 text-cyan-400" />{new Date(job.created_date).toLocaleDateString('he-IL')}</span>
              </div>

              {/* Salary */}
              {job.salary_min && job.salary_max && (
                <div className="mb-6 pb-6 border-b border-white/10">
                  <p className="text-gray-400 text-sm mb-2">שכר חודשי</p>
                  <div className="text-2xl font-bold text-cyan-300">
                    ₪{job.salary_min.toLocaleString()} – ₪{job.salary_max.toLocaleString()}
                  </div>
                </div>
              )}

              {/* Job Description */}
              {job.description && (
                <div className="mb-6 pb-6 border-b border-white/10">
                  <h2 className="text-2xl font-bold text-white mb-4">📋 תיאור המשרה</h2>
                  <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap">{job.description}</p>
                </div>
              )}

              {/* Share Buttons */}
              <ShareButtons job={job} user={user} />
            </div>

            {/* Internal SEO Links */}
            <div className="bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/10 p-6 mb-6">
              <h3 className="text-base font-bold text-white mb-4">משרות קשורות</h3>
              <div className="flex flex-wrap gap-2">
                {job.location && (
                  <Link
                    to={`/jobs/city/${encodeURIComponent(job.location)}`}
                    className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-300 hover:bg-cyan-500/20 transition-all text-sm"
                  >
                    📍 משרות ב{job.location}
                  </Link>
                )}
                {job.category && (
                  <Link
                    to={`/jobs/category/${encodeURIComponent(job.category)}`}
                    className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-300 hover:bg-purple-500/20 transition-all text-sm"
                  >
                    💼 דרושים {job.category}
                  </Link>
                )}
                {job.location && job.category && (
                  <Link
                    to={`/jobs?search=${encodeURIComponent(job.category)}&location=${encodeURIComponent(job.location)}`}
                    className="px-3 py-1.5 bg-white/5 border border-white/15 rounded-lg text-gray-300 hover:text-white transition-all text-sm"
                  >
                    {job.category} ב{job.location}
                  </Link>
                )}
                <Link
                  to="/jobs"
                  className="px-3 py-1.5 bg-white/5 border border-white/15 rounded-lg text-gray-300 hover:text-white transition-all text-sm"
                >
                  כל המשרות
                </Link>
              </div>
            </div>

            {/* Similar Jobs Using Engine */}
            <SimilarJobsList jobId={id} title={job.title} />
          </div>

          {/* Sidebar - Apply Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {job.is_closed ? (
                <div className="bg-red-500/20 text-red-300 rounded-2xl p-4 text-center text-base font-semibold border border-red-500/30">משרה זו סגורה</div>
              ) : !showApply ? (
                <button onClick={() => setShowApply(true)} className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-8 py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:shadow-purple-500/30 mb-6 active:scale-95">
                  <Send className="w-5 h-5" /> הגש מועמדות
                </button>
              ) : submitted ? (
                <div className="bg-green-500/20 text-green-300 rounded-3xl p-8 text-center border border-green-500/30 space-y-3">
                  <div className="text-4xl">🎉</div>
                  <div className="text-xl font-bold text-green-300">המועמדות נשלחה!</div>
                  <p className="text-sm text-green-400/80">שלחנו אישור לאימייל שלך. הצוות יחזור אליך בהקדם.</p>
                  <button onClick={() => { setSubmitted(false); setShowApply(false); setForm({ candidate_name: '', candidate_email: '', candidate_phone: '', cover_letter: '', desired_salary_min: '', desired_salary_max: '', location: '', resume_url: '', resume_filename: '', resume_file: null }); }}
                    className="mt-2 text-sm text-green-300 underline hover:text-green-200">
                    שלח מועמדות נוספת
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-4 bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white">הגשת מועמדות</h3>

                {/* Global apply error */}
                {applyError && (
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{applyError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input placeholder="שם מלא *" value={form.candidate_name}
                      onChange={e => { setForm({ ...form, candidate_name: e.target.value }); setFormErrors(p => ({ ...p, candidate_name: '' })); }}
                      className={`w-full border rounded-xl px-4 py-3 text-base bg-white/5 text-white outline-none focus:ring-2 focus:ring-purple-500/30 placeholder:text-gray-500 transition-all ${formErrors.candidate_name ? 'border-red-500/60' : 'border-white/20 focus:border-purple-500/50'}`} />
                    {formErrors.candidate_name && <p className="text-red-400 text-xs mt-1 pr-1">{formErrors.candidate_name}</p>}
                  </div>
                  <div>
                    <input type="email" placeholder="אימייל *" value={form.candidate_email} dir="ltr"
                      onChange={e => { setForm({ ...form, candidate_email: e.target.value }); setFormErrors(p => ({ ...p, candidate_email: '' })); }}
                      className={`w-full border rounded-xl px-4 py-3 text-base bg-white/5 text-white outline-none focus:ring-2 focus:ring-purple-500/30 placeholder:text-gray-500 transition-all ${formErrors.candidate_email ? 'border-red-500/60' : 'border-white/20 focus:border-purple-500/50'}`} />
                    {formErrors.candidate_email && <p className="text-red-400 text-xs mt-1 pr-1">{formErrors.candidate_email}</p>}
                  </div>
                  <div>
                    <input placeholder="טלפון *" value={form.candidate_phone}
                      onChange={e => { setForm({ ...form, candidate_phone: e.target.value }); setFormErrors(p => ({ ...p, candidate_phone: '' })); }}
                      className={`w-full border rounded-xl px-4 py-3 text-base bg-white/5 text-white outline-none focus:ring-2 focus:ring-purple-500/30 placeholder:text-gray-500 transition-all ${formErrors.candidate_phone ? 'border-red-500/60' : 'border-white/20 focus:border-purple-500/50'}`} />
                    {formErrors.candidate_phone && <p className="text-red-400 text-xs mt-1 pr-1">{formErrors.candidate_phone}</p>}
                  </div>
                  <input placeholder="עיר מגורים" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                   className="border border-white/20 rounded-xl px-4 py-3 text-base bg-white/5 text-white outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 placeholder:text-gray-500" />
                  <input type="number" placeholder="שכר מינימום (₪)" value={form.desired_salary_min} onChange={e => { setForm({ ...form, desired_salary_min: e.target.value ? parseInt(e.target.value) : '' }); setFormErrors(p => ({ ...p, desired_salary_max: '' })); }}
                   className="border border-white/20 rounded-xl px-4 py-3 text-base bg-white/5 text-white outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 placeholder:text-gray-500" />
                  <div>
                    <input type="number" placeholder="שכר מקסימום (₪)" value={form.desired_salary_max} onChange={e => { setForm({ ...form, desired_salary_max: e.target.value ? parseInt(e.target.value) : '' }); setFormErrors(p => ({ ...p, desired_salary_max: '' })); }}
                     className={`w-full border rounded-xl px-4 py-3 text-base bg-white/5 text-white outline-none focus:ring-2 focus:ring-purple-500/30 placeholder:text-gray-500 transition-all ${formErrors.desired_salary_max ? 'border-red-500/60' : 'border-white/20 focus:border-purple-500/50'}`} />
                    {formErrors.desired_salary_max && <p className="text-red-400 text-xs mt-1 pr-1">{formErrors.desired_salary_max}</p>}
                  </div>
                </div>
                <textarea placeholder="מכתב מוטיבציה (אופציונלי)" value={form.cover_letter} onChange={e => setForm({ ...form, cover_letter: e.target.value })}
                  rows={3} className="w-full border border-white/20 rounded-xl px-4 py-3 text-base bg-white/5 text-white outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 resize-none placeholder:text-gray-500" />
                
                {/* Existing resume from profile */}
                {profileResume && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-400 font-medium">קורות חיים:</p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => { setUseProfileResume(true); setForm(prev => ({ ...prev, resume_url: profileResume.url, resume_filename: profileResume.filename, resume_file: null })); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${useProfileResume ? 'bg-purple-600/30 border-purple-400 text-purple-200' : 'bg-white/5 border-white/20 text-gray-300 hover:border-purple-500/50'}`}
                      >
                        ✓ השתמש בקורות חיים מהפרופיל
                      </button>
                      <button
                        type="button"
                        onClick={() => { setUseProfileResume(false); setForm(prev => ({ ...prev, resume_url: '', resume_filename: '', resume_file: null })); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${!useProfileResume ? 'bg-purple-600/30 border-purple-400 text-purple-200' : 'bg-white/5 border-white/20 text-gray-300 hover:border-purple-500/50'}`}
                      >
                        📤 העלה קובץ חדש
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload area - show only when not using profile resume */}
                {!useProfileResume && (
                <label className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${uploadError ? 'border-red-500/50 bg-red-500/5' : 'border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/5'}`}>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={e => handleResumeUpload(e.target.files?.[0] || null)}
                    className="hidden" disabled={extracting || uploading} />
                  <Upload className={`w-6 h-6 mx-auto mb-3 ${uploadError ? 'text-red-400' : 'text-gray-400'}`} />
                  <div className="text-base text-gray-300 font-medium">
                    {uploading ? '📤 מעלה קובץ...' : extracting ? '🔄 מחלץ נתונים...' : form.resume_filename ? `✓ ${form.resume_filename}` : 'העלה קורות חיים (PDF, Word)'}
                  </div>
                  {uploadError ? (
                    <p className="text-red-400 text-xs mt-2">{uploadError}</p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">נתוני קורות החיים יתמלאו אוטומטית</p>
                  )}
                </label>
                )}
                {useProfileResume && form.resume_url && (
                  <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-xl px-4 py-3 text-sm text-purple-300">
                    ✓ קורות חיים מהפרופיל ישמשו להגשה
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowApply(false); setFormErrors({}); setApplyError(null); setUploadError(null); }} className="flex-1 border border-white/20 text-gray-300 px-4 h-10 rounded-xl text-base font-semibold hover:bg-white/5 hover:border-white/40 transition-all active:scale-95">ביטול</button>
                <button type="submit" disabled={applyMutation.isPending || uploading || extracting} className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-6 h-10 rounded-xl text-base font-semibold disabled:opacity-50 shadow-md hover:shadow-lg transition-all active:scale-95">
                  {uploading ? '📤 מעלה...' : extracting ? '🔄 מחלץ...' : applyMutation.isPending ? '⏳ שולח...' : '✓ שלח מועמדות'}
                </button>
                </div>
              </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}