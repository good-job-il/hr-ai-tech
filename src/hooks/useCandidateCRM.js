/**
 * useCandidateCRM — Central CRM hook (lazy-loading refactor)
 *
 * EAGER (loaded on mount):  candidate, notes, interviews, applications, documents, tags
 * LAZY  (loaded on demand): timeline (when 'timeline'/'overview' tab opened)
 *                           communications (when 'whatsapp' tab opened)
 *
 * All mutations stamp organization_id.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const EAGER_STALE_MS = 3 * 60 * 1000; // 3 min

// Simple per-candidate in-memory cache
const _cache = new Map();

export function useCandidateCRM(candidateId) {
  const { user } = useAuth();
  const [candidate, setCandidate]         = useState(null);
  const [notes, setNotes]                 = useState([]);
  const [interviews, setInterviews]       = useState([]);
  const [timeline, setTimeline]           = useState([]);
  const [tags, setTags]                   = useState([]);
  const [documents, setDocuments]         = useState([]);
  const [communications, setCommunications] = useState([]);
  const [applications, setApplications]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [commsLoading, setCommsLoading]   = useState(false);
  const [error, setError]                 = useState(null);
  const timelineLoadedRef                 = useRef(false);
  const commsLoadedRef                    = useRef(false);

  // ── EAGER LOAD (candidate + core data) ──────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!candidateId) return;

    // Cache hit — avoid redundant fetches within STALE window
    const cached = _cache.get(candidateId);
    if (cached && Date.now() - cached.ts < EAGER_STALE_MS) {
      setCandidate(cached.candidate);
      setNotes(cached.notes);
      setInterviews(cached.interviews);
      setApplications(cached.applications);
      setDocuments(cached.documents);
      setTags(cached.tags);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    // Reset lazy flags on reload
    timelineLoadedRef.current = false;
    commsLoadedRef.current = false;

    try {
      const candList = await base44.entities.Candidate.filter({ id: candidateId }, '-created_date', 1);
      const cand = candList[0] || null;
      setCandidate(cand);

      const [notesData, interviewsData, tagsData, docsData, appsData] = await Promise.all([
        base44.entities.CandidateNote.filter({ candidate_id: candidateId }, '-created_date', 50),
        base44.entities.Interview.filter({ candidate_id: candidateId }, '-date', 20),
        base44.entities.CandidateTag.filter({ candidate_id: candidateId }, '', 30),
        base44.entities.CandidateDocument.filter({ candidate_id: candidateId }, '-created_date', 20),
        cand?.email
          ? base44.entities.Application.filter({ candidate_email: cand.email }, '-created_date', 20)
          : base44.entities.Application.filter({ candidate_id: candidateId }, '-created_date', 20),
      ]);

      setNotes(notesData);
      setInterviews(interviewsData);
      setTags(tagsData);
      setDocuments(docsData);
      setApplications(appsData);

      _cache.set(candidateId, {
        ts: Date.now(),
        candidate: cand,
        notes: notesData,
        interviews: interviewsData,
        tags: tagsData,
        documents: docsData,
        applications: appsData,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── LAZY: Timeline ────────────────────────────────────────────────────────
  const loadTimeline = useCallback(async () => {
    if (!candidateId || timelineLoadedRef.current) return;
    timelineLoadedRef.current = true;
    setTimelineLoading(true);
    try {
      const data = await base44.entities.CandidateTimeline.filter(
        { candidate_id: candidateId }, '-created_date', 50
      );
      setTimeline(data);
    } finally {
      setTimelineLoading(false);
    }
  }, [candidateId]);

  // ── LAZY: Communications ──────────────────────────────────────────────────
  const loadCommunications = useCallback(async () => {
    if (!candidateId || commsLoadedRef.current) return;
    commsLoadedRef.current = true;
    setCommsLoading(true);
    try {
      const data = await base44.entities.CommunicationLog.filter(
        { candidate_id: candidateId }, '-created_date', 30
      );
      setCommunications(data);
    } finally {
      setCommsLoading(false);
    }
  }, [candidateId]);

  // ── HELPERS ───────────────────────────────────────────────────────────────
  const orgId = () => user?.organization_id || candidate?.organization_id || null;

  const invalidateCache = useCallback(() => {
    _cache.delete(candidateId);
  }, [candidateId]);

  const reload = useCallback(() => {
    invalidateCache();
    timelineLoadedRef.current = false;
    commsLoadedRef.current = false;
    setTimeline([]);
    setCommunications([]);
    loadAll();
  }, [invalidateCache, loadAll]);

  const addTimelineEvent = useCallback(async (eventType, description, metadata = {}, visibilityOpts = {}) => {
    if (!candidateId || !user?.email) return;
    const event = await base44.entities.CandidateTimeline.create({
      candidate_id: candidateId,
      candidate_email: candidate?.email || '',
      organization_id: orgId(),
      event_type: eventType,
      description,
      performed_by: user.email,
      performed_by_name: user.full_name,
      performed_by_role: user.role || 'recruiter',
      metadata,
      is_visible_to_candidate: visibilityOpts.candidate || false,
      is_visible_to_employer: visibilityOpts.employer || false,
    });
    setTimeline(prev => [event, ...prev]);
    return event;
  }, [candidateId, candidate, user]);

  // ── NOTES ─────────────────────────────────────────────────────────────────
  const addNote = useCallback(async ({ content, visibility = 'internal', note_type = 'general', is_pinned = false, related_application_id, related_interview_id }) => {
    const note = await base44.entities.CandidateNote.create({
      candidate_id: candidateId,
      candidate_email: candidate?.email || '',
      organization_id: orgId(),
      author_email: user.email,
      author_name: user.full_name,
      author_role: user.role || 'recruiter',
      content, visibility, note_type, is_pinned,
      related_application_id, related_interview_id,
    });
    setNotes(prev => [note, ...prev]);
    invalidateCache();
    await addTimelineEvent('note_added', `הערה נוספה על ידי ${user.full_name}`, { note_id: note.id, visibility }, { employer: visibility === 'employer_visible' });
    return note;
  }, [candidateId, candidate, user, addTimelineEvent, invalidateCache]);

  const updateNote = useCallback(async (noteId, updates) => {
    const updated = await base44.entities.CandidateNote.update(noteId, updates);
    setNotes(prev => prev.map(n => n.id === noteId ? updated : n));
    invalidateCache();
    return updated;
  }, [invalidateCache]);

  const deleteNote = useCallback(async (noteId) => {
    await base44.entities.CandidateNote.delete(noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
    invalidateCache();
  }, [invalidateCache]);

  // ── INTERVIEWS ────────────────────────────────────────────────────────────
  const scheduleInterview = useCallback(async (interviewData) => {
    const interview = await base44.entities.Interview.create({
      ...interviewData,
      candidate_id: candidateId,
      candidate_email: candidate?.email || '',
      candidate_name: candidate?.full_name || '',
      organization_id: orgId(),
      recruiter_id: user.email,
      status: 'scheduled',
    });
    setInterviews(prev => [interview, ...prev]);
    invalidateCache();
    await addTimelineEvent(
      'interview_scheduled',
      `ראיון ${interview.type === 'phone' ? 'טלפוני' : interview.type === 'video' ? 'וידאו' : 'פרונטלי'} נקבע ל-${interview.date} ${interview.time}`,
      { interview_id: interview.id, job_title: interview.job_title },
      { candidate: true }
    );
    return interview;
  }, [candidateId, candidate, user, addTimelineEvent, invalidateCache]);

  const updateInterview = useCallback(async (interviewId, updates) => {
    const updated = await base44.entities.Interview.update(interviewId, updates);
    setInterviews(prev => prev.map(i => i.id === interviewId ? updated : i));
    if (updates.status) {
      const statusMap = { completed: 'interview_completed', cancelled: 'interview_cancelled' };
      const evType = statusMap[updates.status];
      if (evType) await addTimelineEvent(evType, `ראיון ${updates.status === 'completed' ? 'הושלם' : 'בוטל'}`, { interview_id: interviewId });
    }
    return updated;
  }, [addTimelineEvent]);

  // ── STATUS ────────────────────────────────────────────────────────────────
  const updateStatus = useCallback(async (newStatus, rejectReason) => {
    const oldStatus = candidate?.status;
    const updated = await base44.entities.Candidate.update(candidateId, { status: newStatus });
    setCandidate(updated);
    invalidateCache();
    const description = newStatus === 'rejected' && rejectReason
      ? `מועמד נדחה — סיבה: ${rejectReason}`
      : `סטטוס שונה מ-${oldStatus} ל-${newStatus}`;
    await addTimelineEvent('status_changed', description, { old_value: oldStatus, new_value: newStatus, reject_reason: rejectReason }, { candidate: true });
    return updated;
  }, [candidateId, candidate, addTimelineEvent, invalidateCache]);

  // ── RECRUITER ASSIGNMENT ──────────────────────────────────────────────────
  const assignRecruiter = useCallback(async (recruiterEmail, recruiterName) => {
    const updated = await base44.entities.Candidate.update(candidateId, { recruiter_id: recruiterEmail });
    setCandidate(updated);
    invalidateCache();
    await addTimelineEvent('recruiter_assigned', `הוקצה מגייס: ${recruiterName || recruiterEmail}`, { recruiter_email: recruiterEmail });
    return updated;
  }, [candidateId, addTimelineEvent, invalidateCache]);

  // ── TAGS ──────────────────────────────────────────────────────────────────
  const addTag = useCallback(async (tag, color = '#7C3AED') => {
    const existing = tags.find(t => t.tag === tag);
    if (existing) return existing;
    const newTag = await base44.entities.CandidateTag.create({
      candidate_id: candidateId,
      organization_id: orgId(),
      tag, color, added_by: user.email,
    });
    setTags(prev => [...prev, newTag]);
    invalidateCache();
    await addTimelineEvent('tag_added', `תגית נוספה: ${tag}`, { tag });
    return newTag;
  }, [candidateId, tags, user, addTimelineEvent, invalidateCache]);

  const removeTag = useCallback(async (tagId, tagName) => {
    await base44.entities.CandidateTag.delete(tagId);
    setTags(prev => prev.filter(t => t.id !== tagId));
    invalidateCache();
    await addTimelineEvent('tag_removed', `תגית הוסרה: ${tagName}`, { tag: tagName });
  }, [addTimelineEvent, invalidateCache]);

  // ── DOCUMENTS ─────────────────────────────────────────────────────────────
  const uploadDocument = useCallback(async (file, docType = 'cv') => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const doc = await base44.entities.CandidateDocument.create({
      candidate_id: candidateId,
      candidate_email: candidate?.email || '',
      organization_id: orgId(),
      doc_type: docType,
      filename: file.name,
      file_url,
      file_size: file.size,
      uploaded_by: user.email,
      is_latest_cv: docType === 'cv',
    });
    setDocuments(prev => [doc, ...prev]);
    invalidateCache();
    await addTimelineEvent('document_uploaded', `מסמך הועלה: ${file.name} (${docType})`, { doc_id: doc.id, doc_type: docType });
    return doc;
  }, [candidateId, candidate, user, addTimelineEvent, invalidateCache]);

  // ── SEND TO EMPLOYER ──────────────────────────────────────────────────────
  const sendToEmployer = useCallback(async (employerId, jobId, jobTitle) => {
    if (!employerId?.trim()) throw new Error('נדרש אימייל מעסיק');
    const updated = await base44.entities.Candidate.update(candidateId, { employer_id: employerId.trim() });
    setCandidate(updated);
    invalidateCache();
    await addTimelineEvent('sent_to_employer', `מועמד נשלח למעסיק עבור: ${jobTitle || jobId}`, { employer_id: employerId, job_id: jobId, job_title: jobTitle }, { employer: true });
    base44.functions.invoke('createCompanyNotification', {
      employer_id: employerId,
      type: 'candidate_sent',
      title: 'מועמד חדש נשלח אליך',
      message: `${candidate?.full_name} נשלח אליך עבור המשרה: ${jobTitle || ''}`,
      candidate_id: candidateId,
      candidate_name: candidate?.full_name,
      job_title: jobTitle,
    }).catch(() => {});
    return updated;
  }, [candidateId, candidate, addTimelineEvent, invalidateCache]);

  // ── REQUEST DOCUMENTS ─────────────────────────────────────────────────────
  const requestDocuments = useCallback(async (docType) => {
    await addNote({ content: `בקשת מסמך: ${docType}`, visibility: 'internal', note_type: 'document_request' });
  }, [addNote]);

  return {
    candidate, notes, interviews, timeline, tags, documents, communications, applications,
    loading, timelineLoading, commsLoading, error,
    reload, loadTimeline, loadCommunications,
    addNote, updateNote, deleteNote,
    scheduleInterview, updateInterview,
    updateStatus, assignRecruiter,
    addTag, removeTag,
    uploadDocument, sendToEmployer, requestDocuments,
    addTimelineEvent,
  };
}