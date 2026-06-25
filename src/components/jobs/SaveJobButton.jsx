import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SaveJobButton({ job, user }) {
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    base44.entities.SavedJob.filter({ user_email: user.email, job_id: job.id }).then((res) => {
      if (res.length > 0) {
        setSaved(true);
        setSavedId(res[0].id);
      }
    });
  }, [user, job.id]);

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    setLoading(true);
    if (saved) {
      await base44.entities.SavedJob.delete(savedId);
      setSaved(false);
      setSavedId(null);
    } else {
      const res = await base44.entities.SavedJob.create({
        user_email: user.email,
        job_id: job.id,
        job_title: job.title,
        company: job.company,
      });
      setSaved(true);
      setSavedId(res.id);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={saved ? 'הסר שמירה' : 'שמור משרה'}
      className={`p-1.5 rounded-lg transition-colors ${saved ? 'text-hhblue bg-hhblue/10' : 'text-gray-400 hover:text-hhblue hover:bg-hhblue/10'}`}
    >
      <Bookmark className={`w-4 h-4 ${saved ? 'fill-hhblue' : ''}`} />
    </button>
  );
}