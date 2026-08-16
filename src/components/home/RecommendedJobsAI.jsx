import React, { useEffect, useState } from 'react';
import { publicWorkflowService } from '@/api/services/publicWorkflowService';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function RecommendedJobsAI() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user?.email) return;
      try {
        const result = await publicWorkflowService.recommendedJobs();
        setJobs(result.jobs || []);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user?.email]);

  if (!user) return null;
  if (loading) return <div className="text-center py-4 text-gray-400">טוען המלצות AI...</div>;
  if (jobs.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-[#0f1629] to-background border-t border-purple-500/20">
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <h2 className="text-2xl font-bold" style={{ background: 'linear-gradient(to right, #67e8f9, #d8b4fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>משרות המומלצות עבורך</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map(job => (
            <Link key={job.id} to={`/jobs/${job.id}`} className="group">
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl border border-white/15 p-5 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all h-full">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-white group-hover:text-cyan-300 transition-colors">{job.title}</h3>
                  <span className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                    {job.match_score}% AI
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-2">{job.company}</p>
                <p className="text-xs text-gray-400 line-clamp-2">{job.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
