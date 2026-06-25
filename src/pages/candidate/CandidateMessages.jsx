import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  MessageCircle, Send, RefreshCw, X, Briefcase,
  ChevronLeft, Inbox, MessagesSquare,
} from 'lucide-react';

// ─── Conversation List ─────────────────────────────────────────────────────────

function ConversationItem({ application, isSelected, onSelect, unreadCount }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(isSelected ? null : application)}
      className={`w-full text-start px-4 py-3 border-b border-[#F0F1F5] transition-colors last:border-0 ${
        isSelected
          ? 'bg-[#F3EFFF]'
          : 'hover:bg-[#F7F8FC]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#EEF4FF] flex items-center justify-center flex-shrink-0 font-black text-sm text-[#7C3AED]">
          {(application.company || '?').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-sm text-[#0F172A] truncate">
              {application.job_title || '—'}
            </span>
            {unreadCount > 0 && (
              <span className="flex-shrink-0 bg-[#EF4444] text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div className="text-xs text-[#64748B] font-semibold truncate mt-0.5">
            {application.company || '—'}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Chat Window ───────────────────────────────────────────────────────────────

function ChatWindow({ application, user, onClose }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['candidate-messages-chat', application?.id],
    queryFn: () =>
      base44.entities.Message.filter({ application_id: application.id }, 'created_date', 100),
    enabled: !!application,
    refetchInterval: 5000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (application && messages.length > 0) {
      messages
        .filter(m => !m.is_read && m.sender_email !== user?.email)
        .forEach(m => base44.entities.Message.update(m.id, { is_read: true }));
    }
  }, [messages, application, user?.email]);

  const sendMutation = useMutation({
    mutationFn: () =>
      base44.entities.Message.create({
        application_id: application.id,
        sender_email: user.email,
        sender_role: 'candidate',
        content: text,
      }),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['candidate-messages-chat', application.id] });
      queryClient.invalidateQueries({ queryKey: ['candidate-messages-unread'] });
    },
  });

  const handleSend = () => {
    if (text.trim()) sendMutation.mutate();
  };

  return (
    <div className="flex-1 flex flex-col bg-white rounded-2xl border border-[#E4ECFF] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#F0F1F5]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#EEF4FF] flex items-center justify-center flex-shrink-0 font-black text-sm text-[#7C3AED]">
            {(application.company || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-black text-[#0F172A] text-sm truncate">
              {application.job_title || '—'}
            </div>
            <div className="text-xs font-semibold text-[#7C3AED] truncate">
              {application.company || '—'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {application.job_id && (
            <a
              href={`/jobs/${application.job_id}`}
              className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E4ECFF] text-xs font-bold text-[#374151] hover:border-[#C4B5FD] hover:text-[#7C3AED] transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5" />
              {t('candidate.messages.viewJob')}
            </a>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-[#E4ECFF] flex items-center justify-center text-[#94A3B8] hover:border-[#C4B5FD] hover:text-[#374151] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className="h-10 w-40 bg-white rounded-2xl border border-[#E4ECFF] animate-pulse" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F3EFFF] flex items-center justify-center mb-3">
              <MessageCircle className="w-7 h-7 text-[#7C3AED]" />
            </div>
            <p className="font-black text-[#0F172A]">{t('candidate.messages.noMessages')}</p>
            <p className="text-sm font-semibold text-[#64748B] mt-1">
              {t('candidate.messages.noMessagesHint')}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_email === user?.email;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isMine
                      ? 'bg-gradient-to-br from-[#7C3AED] to-[#2F80FF] text-white'
                      : 'bg-white border border-[#E4ECFF] text-[#0F172A]'
                  }`}
                >
                  {msg.content}
                  <div className={`text-xs mt-1 ${isMine ? 'opacity-70 text-white' : 'text-[#94A3B8]'}`}>
                    {new Date(msg.created_date).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-[#F0F1F5] flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={t('candidate.messages.inputPlaceholder')}
          className="flex-1 border border-[#E4ECFF] rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#C4B5FD] transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sendMutation.isPending}
          className="bg-gradient-to-br from-[#7C3AED] to-[#2F80FF] text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function SelectConversationPrompt() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 bg-white rounded-2xl border border-[#E4ECFF] flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#F3EFFF] flex items-center justify-center mb-4">
        <MessagesSquare className="w-8 h-8 text-[#7C3AED]" />
      </div>
      <p className="font-black text-[#0F172A] text-lg">{t('candidate.messages.selectTitle')}</p>
      <p className="text-sm font-semibold text-[#64748B] mt-1">{t('candidate.messages.selectHint')}</p>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color = '#7C3AED', loading }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E4ECFF] p-5 flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + '18' }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-black text-[#0F172A]">
          {loading ? (
            <span className="inline-block w-10 h-5 bg-gray-100 rounded animate-pulse" />
          ) : value}
        </div>
        <div className="text-xs font-semibold text-[#64748B]">{label}</div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CandidateMessages() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading, refetch } = useQuery({
    queryKey: ['candidate-messages-apps', user?.email],
    queryFn: () =>
      base44.entities.Application.filter(
        { candidate_email: user.email },
        '-created_date',
        50,
      ),
    enabled: !!user?.email,
  });

  const { data: unreadMessages = [] } = useQuery({
    queryKey: ['candidate-messages-unread', user?.email],
    queryFn: async () => {
      const results = [];
      for (const app of applications) {
        const msgs = await base44.entities.Message.filter({
          application_id: app.id,
          is_read: false,
        }).catch(() => []);
        results.push(...msgs.filter(m => m.sender_email !== user.email));
      }
      return results;
    },
    enabled: applications.length > 0,
    refetchInterval: 15000,
  });

  const unreadCounts = {};
  unreadMessages.forEach(m => {
    unreadCounts[m.application_id] = (unreadCounts[m.application_id] || 0) + 1;
  });

  const totalUnread = unreadMessages.length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A]">{t('candidate.messages.title')}</h1>
          <p className="text-[#64748B] font-semibold mt-1">{t('candidate.messages.subtitle')}</p>
        </div>
        <button
          onClick={() => { refetch(); queryClient.invalidateQueries({ queryKey: ['candidate-messages-unread'] }); }}
          disabled={isLoading}
          className="h-9 w-9 rounded-xl border border-[#E4ECFF] flex items-center justify-center text-[#64748B] hover:border-[#C4B5FD] disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={MessageCircle}
          label={t('candidate.messages.stats.conversations')}
          value={applications.length}
          color="#2563EB"
          loading={isLoading}
        />
        <StatCard
          icon={Inbox}
          label={t('candidate.messages.stats.unread')}
          value={totalUnread}
          color="#7C3AED"
          loading={isLoading}
        />
      </div>

      {/* Main panel */}
      <div className="flex gap-4 min-h-[520px]">
        {/* Conversation list */}
        <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-[#E4ECFF] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#F0F1F5]">
            <span className="font-black text-sm text-[#0F172A]">
              {t('candidate.messages.conversations')}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-14 bg-[#F8FAFC] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
                <MessageCircle className="w-10 h-10 text-[#CBD5E1] mb-3" />
                <p className="font-bold text-[#94A3B8] text-sm">{t('candidate.messages.noConversations')}</p>
                <p className="text-xs text-[#CBD5E1] mt-1">{t('candidate.messages.noConversationsHint')}</p>
              </div>
            ) : (
              applications.map(app => (
                <ConversationItem
                  key={app.id}
                  application={app}
                  isSelected={selected?.id === app.id}
                  onSelect={setSelected}
                  unreadCount={unreadCounts[app.id] || 0}
                />
              ))
            )}
          </div>
        </div>

        {/* Chat or empty state */}
        {selected ? (
          <ChatWindow
            application={selected}
            user={user}
            onClose={() => setSelected(null)}
          />
        ) : (
          <SelectConversationPrompt />
        )}
      </div>
    </div>
  );
}
