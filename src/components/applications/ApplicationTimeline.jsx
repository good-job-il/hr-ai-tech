import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { heIL } from 'date-fns/locale';
import { MessageCircle, CheckCircle2, Clock, AlertCircle, FileText, Award, Eye } from 'lucide-react';

const eventIcons = {
  submitted: FileText,
  status_changed: AlertCircle,
  note_added: MessageCircle,
  interview_scheduled: Clock,
  interview_completed: CheckCircle2,
  offer_made: Award,
  rejected: AlertCircle,
  assigned: Clock,
  resume_viewed: Eye
};

const eventLabels = {
  submitted: 'מועמדות הוגשה',
  status_changed: 'סטטוס השתנה',
  note_added: 'הוסיפו הערה',
  interview_scheduled: 'ראיון תוזמן',
  interview_completed: 'ראיון הסתיים',
  offer_made: 'הצעה הוגשה',
  rejected: 'דחויה',
  assigned: 'הוקצתה',
  resume_viewed: 'קורות חיים נצפו'
};

export default function ApplicationTimeline({ applicationId }) {
  const { data: timeline = [], isLoading } = useQuery({
    queryKey: ['application-timeline', applicationId],
    queryFn: () => base44.entities.ApplicationTimeline.filter({ application_id: applicationId }, 'created_date', 100)
  });

  if (isLoading) {
    return <div className="text-gray-400">טוען ציר זמן...</div>;
  }

  if (timeline.length === 0) {
    return <div className="text-gray-500 text-sm">אין אירועים בציר הזמן</div>;
  }

  return (
    <div className="space-y-4">
      {timeline.map((event, index) => {
        const IconComponent = eventIcons[event.event_type] || Clock;
        const label = eventLabels[event.event_type] || event.event_type;
        
        return (
          <div key={event.id} className="flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center flex-shrink-0">
                <IconComponent className="w-4 h-4 text-purple-300" />
              </div>
              {index < timeline.length - 1 && <div className="w-0.5 h-8 bg-purple-500/30 my-2" />}
            </div>

            {/* Event details */}
            <div className="pb-4 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-white text-sm">{label}</p>
                  <p className="text-gray-400 text-xs mt-1">{event.description}</p>
                  
                  {event.previous_value && event.new_value && (
                    <div className="mt-2 text-xs text-gray-500">
                      מ: <span className="text-red-400">{event.previous_value}</span> → ל: <span className="text-green-400">{event.new_value}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <span>
                  {new Date(event.created_date).toLocaleString('he-IL', {
                    timeZone: 'Asia/Jerusalem',
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: false,
                  })}
                </span>
                {event.performed_by && (
                  <span>• {event.performed_by} ({event.performed_by_role})</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}