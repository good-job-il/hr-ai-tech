import React, { useState } from "react"
import { useAuth } from "@/lib/AuthContext"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { publicJobService } from "@/api/services/publicJobService"
import { applicationService } from "@/api/services/applicationService"
import { candidateProfileService } from "@/api/services/candidateProfileService"
import { fileService } from "@/api/services/fileService"
import { publicWorkflowService } from "@/api/services/publicWorkflowService"

import { logError, getErrorMessage } from "@/lib/errorHandler"

// Validation
const validateForm = (form) => {
  const errors = {}

  if (!form.candidate_name?.trim()) {
    errors.candidate_name = "Full name is required"
  }

  if (!form.candidate_email?.trim()) {
    errors.candidate_email = "Email is required"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.candidate_email)) {
    errors.candidate_email = "Invalid email address"
  }

  if (!form.candidate_phone?.trim()) {
    errors.candidate_phone = "Phone is required"
  }

  if (
    form.desired_salary_min &&
    form.desired_salary_max &&
    Number(form.desired_salary_min) > Number(form.desired_salary_max)
  ) {
    errors.desired_salary_max = "Maximum salary must be higher than minimum"
  }

  return errors
}

// Retry helper
const withRetry = async (fn, retries = 2, label = "") => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === retries) {
        throw err
      }

      console.warn(`[RETRY ${i + 1}/${retries}] ${label}`, err?.message)
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
}

const typeLabels = { full: "Full-time", part: "Part-time", daily: "Daily", remote: "Remote" }

export default function JobDetail() {
  const { id } = useParams()

  const { user } = useAuth()

  const queryClient = useQueryClient()

  const [showApply, setShowApply] = useState(false)

  const [form, setForm] = useState({
    candidate_name: "",
    candidate_email: "",
    candidate_phone: "",
    cover_letter: "",
    desired_salary_min: "",
    desired_salary_max: "",
    location: "",
    resume_url: "",
    resume_filename: "",
    resume_file: null,
  })

  const [uploading, setUploading] = useState(false)

  const [submitted, setSubmitted] = useState(false)

  const [extracting, setExtracting] = useState(false)

  const [scrollPosition, setScrollPosition] = useState(0)

  const [formErrors, setFormErrors] = useState({})

  const [applyError, setApplyError] = useState(null)

  const [uploadError, setUploadError] = useState(null)

  const [profileResume, setProfileResume] = useState(null) // {url, filename}

  const [useProfileResume, setUseProfileResume] = useState(false)

  const {
    data: job,
    isLoading,
    isError: jobLoadError,
    refetch: refetchJob,
  } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      console.info(`[JobDetail] Loading job id=${id}`)

      const j = await withRetry(() => publicJobService.get(id), 2, "fetch job")

      if (j) {
        publicJobService.incrementViews(id).catch(() => {})
      }

      return j || null
    },
    retry: 1,
    staleTime: 30_000,
  })

  // Load candidate profile to offer existing resume
  useQuery({
    queryKey: ["candidate-profile-resume", user?.email],
    queryFn: async () => {
      if (!user?.email) {
        return null
      }

      const profile = await candidateProfileService.me()

      if (profile?.resume_url) {
        setProfileResume({ url: profile.resume_url, filename: "Existing Resume" })
      }

      return profile || null
    },
    enabled: !!user?.email,
  })

  const { data: similarJobs = [] } = useQuery({
    queryKey: ["similar-jobs", job?.category, id],
    queryFn: async () => {
      if (!job?.category) {
        return []
      }

      const result = await publicWorkflowService.similarJobs(Number(id), 3)

      return result.recommendations
    },
    enabled: !!job?.category,
  })

  React.useEffect(() => {
    const handleScroll = () => setScrollPosition(window.scrollY)

    window.addEventListener("scroll", handleScroll)

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleFileUpload = async (file) => {
    if (!file) {
      return null
    }

    setUploading(true)
    setUploadError(null)

    try {
      const result = await withRetry(() => fileService.upload(file), 2, "upload file")

      console.info(`[JobDetail] File uploaded: ${file.name}`)

      return result.file_url
    } catch (error) {
      logError(error, "JobDetail.handleFileUpload")
      setUploadError(
        "File upload failed. Please check that the file is valid (PDF/Word up to 10MB) and try again.",
      )

      return null
    } finally {
      setUploading(false)
    }
  }

  const handleResumeUpload = async (file) => {
    if (!file) {
      return
    }

    const MAX_SIZE = 10 * 1024 * 1024

    if (file.size > MAX_SIZE) {
      setUploadError("File is too large. Maximum size is 10MB.")

      return
    }

    setUploadError(null)

    const fileUrl = await handleFileUpload(file)

    if (!fileUrl) {
      return
    }

    setExtracting(true)

    try {
      console.info(`[JobDetail] Extracting resume data from ${file.name}`)

      const result = await withRetry(
        () => publicWorkflowService.extractResume(fileUrl),
        1,
        "extract resume",
      )

      if (result.data) {
        const extracted = result.data

        setForm((prev) => ({
          ...prev,
          candidate_name: extracted.full_name || prev.candidate_name,
          candidate_email: extracted.email || prev.candidate_email,
          candidate_phone: extracted.phone || prev.candidate_phone,
          location: extracted.location || prev.location,
          desired_salary_min: extracted.salary_min || prev.desired_salary_min,
          desired_salary_max: extracted.salary_max || prev.desired_salary_max,
          resume_url: fileUrl,
          resume_filename: file.name,
          resume_file: null,
        }))
        console.info("[JobDetail] Resume data extracted successfully")
      } else {
        // File uploaded but extraction failed — still keep the file URL
        setForm((prev) => ({
          ...prev,
          resume_url: fileUrl,
          resume_filename: file.name,
          resume_file: null,
        }))
      }
    } catch (error) {
      logError(error, "JobDetail.handleResumeUpload")
      // Still keep the file URL even if extraction fails
      setForm((prev) => ({
        ...prev,
        resume_url: fileUrl,
        resume_filename: file.name,
        resume_file: null,
      }))
    } finally {
      setExtracting(false)
    }
  }

  const applyMutation = useMutation({
    mutationFn: async (data) => {
      let resumeUrl = data.resume_url

      if (data.resume_file) {
        resumeUrl = await handleFileUpload(data.resume_file)
      }

      console.info(`[JobDetail] Submitting application for job ${job.id}`)

      const { candidate_email: _ignoredEmail, resume_file: _ignoredFile, ...candidateData } = data

      return withRetry(
        () =>
          applicationService.submit({
            ...candidateData,
            resume_url: resumeUrl || null,
            desired_salary_min:
              data.desired_salary_min !== "" ? Number(data.desired_salary_min) : null,
            desired_salary_max:
              data.desired_salary_max !== "" ? Number(data.desired_salary_max) : null,
            job_id: job.id,
          }),
        2,
        "create application",
      )
    },
    onError: (error) => {
      logError(error, "JobDetail.applyMutation")

      const msg = getErrorMessage(error)

      setApplyError(msg || "Application submission failed. Please try again.")
    },
    onSuccess: async () => {
      setApplyError(null)
      setSubmitted(true)
      queryClient.invalidateQueries({ queryKey: ["job", id] })
    },
  })

  const handleApply = (e) => {
    e.preventDefault()
    setApplyError(null)

    const errors = validateForm(form)

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)

      return
    }

    setFormErrors({})
    applyMutation.mutate(form)
  }

  if (isLoading) {
    return (
      <div
        className="min-h-screen"
        style={{ background: "linear-gradient(to bottom, #F7FBFF 0%, #EEF5FF 100%)" }}
      >
        <Navbar />

        <div className="flex flex-col items-center justify-center py-32 gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent animate-pulse" />

            <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>

          <p className="text-[15px] font-bold text-[#64748B]">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (jobLoadError || !job) {
    return (
      <div
        className="min-h-screen"
        style={{ background: "linear-gradient(to bottom, #F7FBFF 0%, #EEF5FF 100%)" }}
      >
        <Navbar />

        <div className="flex flex-col items-center justify-center py-32 gap-6 text-center px-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FEE2E2] to-[#FECACA] flex items-center justify-center shadow-lg">
            <AlertCircle className="w-10 h-10 text-[#DC2626]" />
          </div>

          <div className="max-w-md">
            <h2 className="text-[22px] font-black text-[#0F172A] mb-2">
              {jobLoadError ? "Error Loading Job" : "Job Not Found"}
            </h2>

            <p className="text-[15px] font-semibold text-[#64748B]">
              {jobLoadError
                ? "A server connection error occurred. Please try again."
                : "This job may have been removed or the link is invalid."}
            </p>
          </div>

          <div className="flex gap-3">
            {jobLoadError && (
              <button
                onClick={() => refetchJob()}
                className="flex items-center gap-2 h-11 px-6 rounded-xl text-[14px] font-bold text-white shadow-lg hover:shadow-xl transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #8B5CF6 0%, #2F80FF 100%)",
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            )}

            <Link
              to="/jobs"
              className="flex items-center gap-2 border-2 border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] px-6 h-11 rounded-xl text-[14px] font-bold transition-all active:scale-95"
            >
              Back to All Jobs
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const seoTitle = job
    ? `${job.title} at ${job.company}${job.location ? ` | ${job.location}` : ""} | HeadHunter`
    : "Job"

  const seoDesc = job
    ? `Job Opening: ${job.title} at ${job.company}${job.location ? ` in ${job.location}` : ""}. ${job.salary_min && job.salary_max ? `Salary ₪${job.salary_min.toLocaleString()}–₪${job.salary_max.toLocaleString()}.` : ""} ${job.type ? `${typeLabels[job.type]}.` : ""} Apply now on HeadHunter.`
    : ""

  const jobPostingSchema = job
    ? {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: job.title,
        description: job.description || `${job.title} at ${job.company}`,
        datePosted: job.created_date?.split("T")[0],
        validThrough: new Date(
          new Date(job.created_date).setMonth(new Date(job.created_date).getMonth() + 3),
        )
          .toISOString()
          .split("T")[0],
        employmentType:
          job.type === "full"
            ? "FULL_TIME"
            : job.type === "part"
              ? "PART_TIME"
              : job.type === "remote"
                ? "TELECOMMUTE"
                : "CONTRACTOR",
        hiringOrganization: {
          "@type": "Organization",
          name: job.company,
        },
        jobLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: job.location || "Israel",
            addressCountry: "IL",
          },
        },
        ...(job.salary_min && job.salary_max
          ? {
              baseSalary: {
                "@type": "MonetaryAmount",
                currency: "ILS",
                value: {
                  "@type": "QuantitativeValue",
                  minValue: job.salary_min,
                  maxValue: job.salary_max,
                  unitText: "MONTH",
                },
              },
            }
          : {}),
        url: `https://headhunter.co.il/jobs/${id}`,
        identifier: {
          "@type": "PropertyValue",
          name: "HeadHunter",
          value: id,
        },
      }
    : null

  const glass = {
    background: "rgba(255,255,255,0.78)",
    backdropFilter: "blur(28px)",
    WebkitBackdropFilter: "blur(28px)",
    border: "1px solid rgba(221,235,255,0.86)",
    borderRadius: 24,
    boxShadow: "0 28px 80px rgba(79,124,255,0.11), 0 3px 12px rgba(15,23,42,0.04)",
  }

  const daysAgo = Math.max(
    0,
    Math.floor((Date.now() - new Date(job.created_date || Date.now())) / 86400000),
  )

  const isNew = daysAgo <= 3

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(to bottom, #F7FBFF 0%, #EEF5FF 100%)" }}
    >
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        keywords={`${job?.title} jobs, ${job?.title} ${job?.location || ""}, ${job?.company} careers, ${job?.category || ""} positions`}
        canonical={`https://headhunter.co.il/jobs/${id}`}
        schemaData={jobPostingSchema}
      />

      <Navbar />

      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 mb-6 text-[14px] font-bold text-[#64748B] hover:text-[#7C3AED] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to All Jobs
            </Link>

            {/* Hero Card */}
            <div
              className="relative group overflow-hidden transition-all duration-300 mb-6"
              style={glass}
            >
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-l from-[#A855F7] via-[#6C4DFF] to-[#2FB8FF]" />

              <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-[#8B5CF6]/8 blur-3xl" />

              <div className="p-8 relative">
                <div className="flex items-start gap-6 mb-6">
                  <div
                    className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-white text-[20px] font-black shadow-[0_20px_45px_rgba(108,77,255,0.25)] flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${job.company_color || "#8B5CF6"}, #2F80FF)`,
                    }}
                  >
                    {job.company_initials || job.company?.slice(0, 2) || "HH"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start gap-3 mb-3">
                      {isNew && (
                        <span className="px-3 py-1.5 rounded-full text-xs font-black bg-[#EEF6FF] text-[#2F80FF] border border-[#DDEBFF] inline-flex items-center gap-1">
                          ✨ New
                        </span>
                      )}

                      {job.views > 0 && (
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] inline-flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          {job.views} views
                        </span>
                      )}
                    </div>

                    <h1 className="text-[32px] leading-[1.25] font-black text-[#0F172A] mb-2">
                      {job.title}
                    </h1>

                    <p className="text-[18px] font-black text-[#7C3AED] mb-4">{job.company}</p>

                    <div className="flex flex-wrap items-center gap-4 text-[14px] font-bold text-[#64748B]">
                      {job.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#60A5FA]" />

                          {job.location}
                        </span>
                      )}

                      {job.type && (
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-[#8B5CF6]" />

                          {typeLabels[job.type]}
                        </span>
                      )}

                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#94A3B8]" />

                        {new Date(job.created_date).toLocaleDateString("en-US")}
                      </span>
                    </div>
                  </div>

                  <SaveJobButton job={job} user={user} />
                </div>

                {/* Salary Badge */}
                {job.salary_min && job.salary_max && (
                  <div className="mb-6 pb-6 border-b border-[#E4ECFF]">
                    <p className="text-[13px] font-bold text-[#64748B] mb-2">💰 Monthly Salary</p>

                    <div className="inline-flex items-baseline gap-2 px-5 py-3 rounded-2xl bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] border border-[#BAE6FD]">
                      <span className="text-[28px] font-black bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] bg-clip-text text-transparent">
                        ₪{job.salary_min.toLocaleString()}
                      </span>

                      <span className="text-[18px] font-bold text-[#64748B]">-</span>

                      <span className="text-[28px] font-black bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] bg-clip-text text-transparent">
                        ₪{job.salary_max.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Job Description */}
                {job.description && (
                  <div className="mb-6">
                    <h2 className="text-[18px] font-black text-[#0F172A] mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] flex items-center justify-center text-white text-sm">
                        📋
                      </span>
                      Job Description
                    </h2>

                    <div className="prose prose-sm max-w-none">
                      <p className="text-[15px] leading-relaxed text-[#475569] whitespace-pre-wrap">
                        {job.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Share Section */}
                <div className="pt-6 border-t border-[#E4ECFF]">
                  <ShareButtons job={job} user={user} />
                </div>
              </div>
            </div>

            {/* Related Links Card */}
            <div
              className="transition-all duration-300 mb-6"
              style={{
                ...glass,
                background: "rgba(248,250,252,0.82)",
              }}
            >
              <div className="p-6">
                <h3 className="text-[16px] font-black text-[#0F172A] mb-4 flex items-center gap-2">
                  🔗 Related Jobs
                </h3>

                <div className="flex flex-wrap gap-2.5">
                  {job.location && (
                    <Link
                      to={`/jobs/city/${encodeURIComponent(job.location)}`}
                      className="px-4 py-2.5 rounded-xl text-[13px] font-bold bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD] text-[#0369A1] border border-[#7DD3FC] hover:shadow-lg transition-all active:scale-95"
                    >
                      📍 Jobs in {job.location}
                    </Link>
                  )}

                  {job.category && (
                    <Link
                      to={`/jobs/category/${encodeURIComponent(job.category)}`}
                      className="px-4 py-2.5 rounded-xl text-[13px] font-bold bg-gradient-to-br from-[#F3E8FF] to-[#E9D5FF] text-[#7C3AED] border border-[#C4B5FD] hover:shadow-lg transition-all active:scale-95"
                    >
                      💼 {job.category} Jobs
                    </Link>
                  )}

                  {job.location && job.category && (
                    <Link
                      to={`/jobs?search=${encodeURIComponent(job.category)}&location=${encodeURIComponent(job.location)}`}
                      className="px-4 py-2.5 rounded-xl text-[13px] font-bold bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-lg transition-all active:scale-95"
                    >
                      {job.category} in {job.location}
                    </Link>
                  )}

                  <Link
                    to="/jobs"
                    className="px-4 py-2.5 rounded-xl text-[13px] font-bold bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-lg transition-all active:scale-95"
                  >
                    All Jobs
                  </Link>
                </div>
              </div>
            </div>

            {/* Similar Jobs */}
            <SimilarJobsList jobId={id} title={job.title} />
          </div>

          {/* Sidebar - Apply Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {job.is_closed ? (
                <div
                  className="text-center transition-all duration-300"
                  style={{
                    ...glass,
                    background: "rgba(254,242,242,0.95)",
                    border: "1px solid rgba(254,202,202,0.8)",
                  }}
                >
                  <div className="p-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EF4444] to-[#DC2626] flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-lg">
                      🚫
                    </div>

                    <p className="text-[16px] font-black text-[#DC2626]">This Job is Closed</p>

                    <p className="text-[13px] font-medium text-[#991B1B] mt-2">
                      This position is no longer active
                    </p>
                  </div>
                </div>
              ) : !showApply ? (
                <button
                  onClick={() => setShowApply(true)}
                  className="w-full h-14 rounded-2xl font-black text-[16px] text-white transition-all duration-300 shadow-[0_20px_45px_rgba(124,58,237,0.35)] hover:shadow-[0_25px_55px_rgba(124,58,237,0.45)] active:scale-[0.98] flex items-center justify-center gap-2.5"
                  style={{
                    background: "linear-gradient(135deg, #8B5CF6 0%, #2F80FF 100%)",
                  }}
                >
                  <Send className="w-5 h-5" />
                  Apply Now
                </button>
              ) : submitted ? (
                <div
                  className="text-center transition-all duration-300"
                  style={{
                    ...glass,
                    background: "rgba(240,253,244,0.95)",
                    border: "1px solid rgba(167,243,208,0.8)",
                  }}
                >
                  <div className="p-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white text-3xl mx-auto mb-4 shadow-lg">
                      🎉
                    </div>

                    <h3 className="text-[20px] font-black text-[#047857] mb-2">
                      Application Submitted!
                    </h3>

                    <p className="text-[14px] font-semibold text-[#059669] mb-6">
                      We've sent a confirmation to your email. The team will get back to you soon.
                    </p>

                    <button
                      onClick={() => {
                        setSubmitted(false)
                        setShowApply(false)
                        setForm({
                          candidate_name: "",
                          candidate_email: "",
                          candidate_phone: "",
                          cover_letter: "",
                          desired_salary_min: "",
                          desired_salary_max: "",
                          location: "",
                          resume_url: "",
                          resume_filename: "",
                          resume_file: null,
                        })
                      }}
                      className="text-[13px] font-bold text-[#047857] hover:text-[#065F46] underline transition-colors"
                    >
                      Submit Another Application
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleApply} className="transition-all duration-300" style={glass}>
                  <div className="p-6 space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] flex items-center justify-center text-white shadow-lg">
                        📝
                      </div>

                      <h3 className="text-[18px] font-black text-[#0F172A]">Submit Application</h3>
                    </div>

                    {/* Global apply error */}
                    {applyError && (
                      <div className="flex items-start gap-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3.5">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#DC2626]" />

                        <span className="text-[13px] font-semibold text-[#DC2626]">
                          {applyError}
                        </span>
                      </div>
                    )}

                    <div className="space-y-3.5">
                      <div>
                        <input
                          placeholder="Full Name *"
                          value={form.candidate_name}
                          onChange={(e) => {
                            setForm({ ...form, candidate_name: e.target.value })
                            setFormErrors((p) => ({ ...p, candidate_name: "" }))
                          }}
                          className={`w-full h-11 border rounded-xl px-4 text-[14px] font-semibold bg-white text-[#0F172A] outline-none transition-all placeholder:text-[#94A3B8] placeholder:font-medium ${formErrors.candidate_name ? "border-[#F87171] focus:ring-2 focus:ring-[#FCA5A5]" : "border-[#E2E8F0] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#DDD6FE]"}`}
                        />

                        {formErrors.candidate_name && (
                          <p className="text-[#DC2626] text-xs font-semibold mt-1.5 pr-1">
                            {formErrors.candidate_name}
                          </p>
                        )}
                      </div>

                      <div>
                        <input
                          type="email"
                          placeholder="Email *"
                          value={form.candidate_email}
                          dir="ltr"
                          onChange={(e) => {
                            setForm({ ...form, candidate_email: e.target.value })
                            setFormErrors((p) => ({ ...p, candidate_email: "" }))
                          }}
                          className={`w-full h-11 border rounded-xl px-4 text-[14px] font-semibold bg-white text-[#0F172A] outline-none transition-all placeholder:text-[#94A3B8] placeholder:font-medium ${formErrors.candidate_email ? "border-[#F87171] focus:ring-2 focus:ring-[#FCA5A5]" : "border-[#E2E8F0] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#DDD6FE]"}`}
                        />

                        {formErrors.candidate_email && (
                          <p className="text-[#DC2626] text-xs font-semibold mt-1.5 pr-1">
                            {formErrors.candidate_email}
                          </p>
                        )}
                      </div>

                      <div>
                        <input
                          placeholder="Phone *"
                          value={form.candidate_phone}
                          onChange={(e) => {
                            setForm({ ...form, candidate_phone: e.target.value })
                            setFormErrors((p) => ({ ...p, candidate_phone: "" }))
                          }}
                          className={`w-full h-11 border rounded-xl px-4 text-[14px] font-semibold bg-white text-[#0F172A] outline-none transition-all placeholder:text-[#94A3B8] placeholder:font-medium ${formErrors.candidate_phone ? "border-[#F87171] focus:ring-2 focus:ring-[#FCA5A5]" : "border-[#E2E8F0] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#DDD6FE]"}`}
                        />

                        {formErrors.candidate_phone && (
                          <p className="text-[#DC2626] text-xs font-semibold mt-1.5 pr-1">
                            {formErrors.candidate_phone}
                          </p>
                        )}
                      </div>

                      <input
                        placeholder="City"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        className="w-full h-11 border border-[#E2E8F0] rounded-xl px-4 text-[14px] font-semibold bg-white text-[#0F172A] outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#DDD6FE] transition-all placeholder:text-[#94A3B8] placeholder:font-medium"
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          placeholder="Min Salary (₪)"
                          value={form.desired_salary_min}
                          onChange={(e) => {
                            setForm({
                              ...form,
                              desired_salary_min: e.target.value ? parseInt(e.target.value) : "",
                            })
                            setFormErrors((p) => ({ ...p, desired_salary_max: "" }))
                          }}
                          className="w-full h-11 border border-[#E2E8F0] rounded-xl px-4 text-[14px] font-semibold bg-white text-[#0F172A] outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#DDD6FE] transition-all placeholder:text-[#94A3B8] placeholder:font-medium"
                        />

                        <div>
                          <input
                            type="number"
                            placeholder="Max Salary (₪)"
                            value={form.desired_salary_max}
                            onChange={(e) => {
                              setForm({
                                ...form,
                                desired_salary_max: e.target.value ? parseInt(e.target.value) : "",
                              })
                              setFormErrors((p) => ({ ...p, desired_salary_max: "" }))
                            }}
                            className={`w-full h-11 border rounded-xl px-4 text-[14px] font-semibold bg-white text-[#0F172A] outline-none transition-all placeholder:text-[#94A3B8] placeholder:font-medium ${formErrors.desired_salary_max ? "border-[#F87171] focus:ring-2 focus:ring-[#FCA5A5]" : "border-[#E2E8F0] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#DDD6FE]"}`}
                          />

                          {formErrors.desired_salary_max && (
                            <p className="text-[#DC2626] text-xs font-semibold mt-1.5 pr-1">
                              {formErrors.desired_salary_max}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <textarea
                      placeholder="Cover Letter (optional)"
                      value={form.cover_letter}
                      onChange={(e) => setForm({ ...form, cover_letter: e.target.value })}
                      rows={3}
                      className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-[14px] font-semibold bg-white text-[#0F172A] outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#DDD6FE] resize-none placeholder:text-[#94A3B8] placeholder:font-medium transition-all"
                    />

                    {/* Existing resume from profile */}
                    {profileResume && (
                      <div className="space-y-2">
                        <p className="text-[13px] text-[#64748B] font-bold">Resume:</p>

                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setUseProfileResume(true)
                              setForm((prev) => ({
                                ...prev,
                                resume_url: profileResume.url,
                                resume_filename: profileResume.filename,
                                resume_file: null,
                              }))
                            }}
                            className={`h-10 px-4 rounded-xl text-[13px] font-bold border transition-all ${useProfileResume ? "bg-gradient-to-br from-[#F3E8FF] to-[#E9D5FF] border-[#C4B5FD] text-[#7C3AED]" : "bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#C4B5FD]"}`}
                          >
                            ✓ Use Resume from Profile
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setUseProfileResume(false)
                              setForm((prev) => ({
                                ...prev,
                                resume_url: "",
                                resume_filename: "",
                                resume_file: null,
                              }))
                            }}
                            className={`h-10 px-4 rounded-xl text-[13px] font-bold border transition-all ${!useProfileResume ? "bg-gradient-to-br from-[#F3E8FF] to-[#E9D5FF] border-[#C4B5FD] text-[#7C3AED]" : "bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#C4B5FD]"}`}
                          >
                            📤 Upload New File
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Upload area */}
                    {!useProfileResume && (
                      <label
                        className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${uploadError ? "border-[#FCA5A5] bg-[#FEF2F2]" : "border-[#DDD6FE] hover:border-[#C4B5FD] hover:bg-[#FAF5FF]"}`}
                      >
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleResumeUpload(e.target.files?.[0] || null)}
                          className="hidden"
                          disabled={extracting || uploading}
                        />

                        <Upload
                          className={`w-7 h-7 mx-auto mb-3 ${uploadError ? "text-[#DC2626]" : "text-[#94A3B8]"}`}
                        />

                        <div
                          className={`text-[14px] font-bold mb-1.5 ${uploadError ? "text-[#DC2626]" : "text-[#0F172A]"}`}
                        >
                          {uploading
                            ? "📤 Uploading..."
                            : extracting
                              ? "🔄 Extracting data..."
                              : form.resume_filename
                                ? `✓ ${form.resume_filename}`
                                : "Upload Resume"}
                        </div>

                        {uploadError ? (
                          <p className="text-[#DC2626] text-xs font-semibold">{uploadError}</p>
                        ) : (
                          <p className="text-[12px] text-[#64748B] font-medium">
                            PDF, Word up to 10MB • Auto-fill
                          </p>
                        )}
                      </label>
                    )}

                    {useProfileResume && form.resume_url && (
                      <div className="flex items-center gap-2.5 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl px-4 py-3">
                        <span className="text-[13px] font-bold text-[#0369A1]">
                          ✓ Resume from profile will be used
                        </span>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowApply(false)
                          setFormErrors({})
                          setApplyError(null)
                          setUploadError(null)
                        }}
                        className="flex-1 h-11 border-2 border-[#E2E8F0] text-[#64748B] rounded-xl text-[14px] font-bold hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all active:scale-95"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={applyMutation.isPending || uploading || extracting}
                        className="flex-1 h-11 rounded-xl text-[14px] font-black text-white shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
                        style={{
                          background: "linear-gradient(135deg, #8B5CF6 0%, #2F80FF 100%)",
                        }}
                      >
                        {uploading
                          ? "📤 Uploading..."
                          : extracting
                            ? "🔄 Extracting..."
                            : applyMutation.isPending
                              ? "⏳ Submitting..."
                              : "✓ Submit Application"}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
import SaveJobButton from "@/components/jobs/SaveJobButton"
import ShareButtons from "@/components/jobs/ShareButtons"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Eye,
  Clock,
  Send,
  Upload,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import Navbar from "@/components/home/Navbar"
import SEOHead from "@/components/SEOHead"
import SimilarJobsList from "@/components/jobs/SimilarJobsList"
