/**
 * useCandidateCRM — Central CRM hook (lazy-loading refactor)
 *
 * EAGER (loaded on mount):  candidate, notes, interviews, applications, documents, tags
 * LAZY  (loaded on demand): timeline (when 'timeline'/'overview' tab opened)
 *                           communications (when 'whatsapp' tab opened)
 *
 * All mutations stamp organization_id.
 *
 * Talks directly to the NestJS REST API via `httpClient` (see
 * `backend/src/modules/candidates`, `.../interviews`, `.../applications`,
 * `.../communication`) — no Base44 SDK/compatibility layer involved.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { httpClient } from '@/api/client/httpClient';
import { useAuth } from '@/lib/AuthContext';

const EAGER_STALE_MS = 3 * 60 * 1000; // 3 min

// Simple per-candidate in-memory cache
const _cache = new Map();

/** Builds a query string, skipping undefined/null/empty values. */
function qs(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    sp.append(key, String(value));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

function isNotFound(e) {
  return e?.response?.status === 404 || e?.status === 404;
}

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
      let cand = null;
      try {
        cand = await httpClient.get(`/candidates/${candidateId}`, { cache: false });
      } catch (e) {
        if (!isNotFound(e)) throw e;
      }
      setCandidate(cand);

      const appsFilter = cand?.email ? { candidate_email: cand.email } : { candidate_id: candidateId };
      const [notesData, interviewsData, tagsData, docsData, appsData] = await Promise.all([
        httpClient.get(`/candidates/${candidateId}/notes${qs({ sort: 'created_date', order: 'DESC', limit: 50 })}`, { cache: false }),
        httpClient.get(`/interviews${qs({ candidate_id: candidateId, sort: 'date', order: 'DESC', limit: 20 })}`, { cache: false }),
        httpClient.get(`/candidates/${candidateId}/tags${qs({ limit: 30 })}`, { cache: false }),
        httpClient.get(`/candidates/${candidateId}/documents${qs({ sort: 'created_date', order: 'DESC', limit: 20 })}`, { cache: false }),
        httpClient.get(`/applications${qs({ ...appsFilter, sort: 'created_date', order: 'DESC', limit: 20 })}`, { cache: false }),
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
      const data = await httpClient.get(
        `/candidates/${candidateId}/timeline${qs({ sort: 'created_date', order: 'DESC', limit: 50 })}`,
        { cache: false }
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
      const data = await httpClient.get(
        `/communication-logs${qs({ candidate_id: candidateId, sort: 'created_date', order: 'DESC', limit: 30 })}`,
        { cache: false }
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
    const event = await httpClient.post(`/candidates/${candidateId}/timeline`, {
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
    const note = await httpClient.post(`/candidates/${candidateId}/notes`, {
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
    const updated = await httpClient.patch(`/candidates/notes/${noteId}`, updates);
    setNotes(prev => prev.map(n => n.id === noteId ? updated : n));
    invalidateCache();
    return updated;
  }, [invalidateCache]);

  const deleteNote = useCallback(async (noteId) => {
    await httpClient.delete(`/candidates/notes/${noteId}`);
    setNotes(prev => prev.filter(n => n.id !== noteId));
    invalidateCache();
  }, [invalidateCache]);

  // ── INTERVIEWS ────────────────────────────────────────────────────────────
  const scheduleInterview = useCallback(async (interviewData) => {
    const interview = await httpClient.post('/interviews', {
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
    const updated = await httpClient.patch(`/interviews/${interviewId}`, updates);
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
    const updated = await httpClient.patch(`/candidates/${candidateId}`, { status: newStatus });
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
    const updated = await httpClient.patch(`/candidates/${candidateId}`, { recruiter_id: recruiterEmail });
    setCandidate(updated);
    invalidateCache();
    await addTimelineEvent('recruiter_assigned', `הוקצה מגייס: ${recruiterName || recruiterEmail}`, { recruiter_email: recruiterEmail });
    return updated;
  }, [candidateId, addTimelineEvent, invalidateCache]);

  // ── TAGS ──────────────────────────────────────────────────────────────────
  const addTag = useCallback(async (tag, color = '#7C3AED') => {
    const existing = tags.find(t => t.tag === tag);
    if (existing) return existing;
    const newTag = await httpClient.post(`/candidates/${candidateId}/tags`, {
      organization_id: orgId(),
      tag, color, added_by: user.email,
    });
    setTags(prev => [...prev, newTag]);
    invalidateCache();
    await addTimelineEvent('tag_added', `תגית נוספה: ${tag}`, { tag });
    return newTag;
  }, [candidateId, tags, user, addTimelineEvent, invalidateCache]);

  const removeTag = useCallback(async (tagId, tagName) => {
    await httpClient.delete(`/candidates/tags/${tagId}`);
    setTags(prev => prev.filter(t => t.id !== tagId));
    invalidateCache();
    await addTimelineEvent('tag_removed', `תגית הוסרה: ${tagName}`, { tag: tagName });
  }, [addTimelineEvent, invalidateCache]);

  // ── DOCUMENTS ─────────────────────────────────────────────────────────────
  const uploadDocument = useCallback(async (file, docType = 'cv') => {
    const formData = new FormData();
    formData.append('file', file);
    const { file_url } = await httpClient.post('/integrations/upload', formData);
    const doc = await httpClient.post(`/candidates/${candidateId}/documents`, {
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
    const updated = await httpClient.patch(`/candidates/${candidateId}`, { employer_id: employerId.trim() });
    setCandidate(updated);
    invalidateCache();
    await addTimelineEvent('sent_to_employer', `מועמד נשלח למעסיק עבור: ${jobTitle || jobId}`, { employer_id: employerId, job_id: jobId, job_title: jobTitle }, { employer: true });
    httpClient.post('/functions/createCompanyNotification', {
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
