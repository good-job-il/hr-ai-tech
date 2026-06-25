import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, MessageCircle } from 'lucide-react';
import Navbar from '@/components/home/Navbar';
import { useAuth } from '@/lib/AuthContext';
import EmployerLayout from '@/components/employer/EmployerLayout';

function ConversationList({ applications, selectedId, onSelect, user, unreadCounts }) {
  return (
    <div className="w-full md:w-72 bg-white border-l border-gray-100 flex-shrink-0">
      <div className="p-4 border-b border-gray-100 font-semibold text-gray-800">שיחות</div>
      <div className="overflow-y-auto max-h-[calc(100vh-180px)]">
        {applications.length === 0 && (
          <div className="p-6 text-center text-gray-400 text-sm">אין שיחות עדיין</div>
        )}
        {applications.map((app) => (
          <button
            key={app.id}
            onClick={() => onSelect(app)}
            className={`w-full text-right px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedId === app.id ? 'bg-hhblue/5 border-r-2 border-r-hhblue' : ''}`}
          >
            <div className="font-medium text-gray-900 text-sm truncate">{app.candidate_name}</div>
            <div className="text-xs text-gray-500 truncate">{app.job_title}</div>
            {unreadCounts[app.id] > 0 && (
              <span className="inline-block bg-hhred text-white text-xs rounded-full px-1.5 py-0.5 mt-1">{unreadCounts[app.id]}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatWindow({ application, user }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();
  const isEmployer = user?.role === 'employer' || user?.role === 'admin';

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', application?.id],
    queryFn: () => base44.entities.Message.filter({ application_id: application.id }, 'created_date', 100),
    enabled: !!application,
    refetchInterval: 5000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Mark messages as read
    if (application && messages.length > 0) {
      messages
        .filter(m => !m.is_read && m.sender_email !== user?.email)
        .forEach(m => base44.entities.Message.update(m.id, { is_read: true }));
    }
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: () => base44.entities.Message.create({
      application_id: application.id,
      sender_email: user.email,
      sender_role: isEmployer ? 'employer' : 'candidate',
      content: text,
    }),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['messages', application.id] });
    },
  });

  if (!application) return (
    <div className="flex-1 flex items-center justify-center text-gray-400">
      <div className="text-center">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p className="text-sm">בחר שיחה</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="font-semibold text-gray-900">{application.candidate_name}</div>
        <div className="text-sm text-gray-500">{application.job_title} — {application.company}</div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg) => {
          const isMine = msg.sender_email === user?.email;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMine ? 'bg-white border border-gray-200 text-gray-800' : 'bg-hhblue text-white'}`}>
                {msg.content}
                <div className={`text-xs mt-1 opacity-60`}>
                  {new Date(msg.created_date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && text.trim() && sendMutation.mutate()}
          placeholder="כתוב הודעה..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
        />
        <button
          onClick={() => text.trim() && sendMutation.mutate()}
          disabled={!text.trim() || sendMutation.isPending}
          className="bg-hhblue text-white px-4 py-2 rounded-xl hover:bg-hhblue/90 transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const isEmployer = user?.role === 'employer' || user?.role === 'admin';

  const { data: applications = [] } = useQuery({
    queryKey: ['messages-apps', user?.email],
    queryFn: async () => {
      if (isEmployer) return base44.entities.Application.filter({ employer_id: user.email }, '-created_date', 50);
      return base44.entities.Application.filter({ candidate_email: user.email }, '-created_date', 50);
    },
    enabled: !!user,
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ['all-messages-unread', user?.email],
    queryFn: async () => {
      const msgs = [];
      for (const app of applications) {
        const m = await base44.entities.Message.filter({ application_id: app.id, is_read: false });
        msgs.push(...m.filter(msg => msg.sender_email !== user.email));
      }
      return msgs;
    },
    enabled: applications.length > 0,
    refetchInterval: 10000,
  });

  const unreadCounts = {};
  allMessages.forEach(m => {
    unreadCounts[m.application_id] = (unreadCounts[m.application_id] || 0) + 1;
  });

  const content = (
    <div className="flex h-[calc(100vh-56px)] md:h-[calc(100vh-0px)]" dir="rtl">
      <ConversationList applications={applications} selectedId={selected?.id} onSelect={setSelected} user={user} unreadCounts={unreadCounts} />
      <ChatWindow application={selected} user={user} />
    </div>
  );

  if (isEmployer) return <EmployerLayout>{content}</EmployerLayout>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#eaf7fb' }} dir="rtl">
      <Navbar />
      {content}
    </div>
  );
}