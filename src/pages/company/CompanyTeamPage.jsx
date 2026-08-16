import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userService } from '@/api/services/userService';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Users, UserPlus, Search, Edit2, Trash2,
  Mail, Phone, ShieldCheck, Briefcase, Crown, Plus,
  AlertCircle,
} from 'lucide-react';

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLE_STYLE = {
  org_admin:          { color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', Icon: Crown },
  hr_manager:         { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', Icon: ShieldCheck },
  internal_recruiter: { color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', Icon: Briefcase },
};

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color = '#7C3AED', loading }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + '18' }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-black text-gray-900">
          {loading
            ? <span className="inline-block w-10 h-5 bg-gray-100 rounded animate-pulse" />
            : value}
        </div>
        <div className="text-xs font-semibold text-gray-500">{label}</div>
      </div>
    </div>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role, t }) {
  const style = ROLE_STYLE[role] || ROLE_STYLE.hr_manager;
  const { Icon } = style;
  const label = t(`company.team.roles.${role}`, { defaultValue: role });
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold whitespace-nowrap"
      style={{ color: style.color, backgroundColor: style.bg, border: `1px solid ${style.border}` }}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// ─── Member card ──────────────────────────────────────────────────────────────

function MemberCard({ member, onEdit, onDelete, isRtl, t }) {
  const initials = (member.full_name || '??')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const style = ROLE_STYLE[member.role] || ROLE_STYLE.hr_manager;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4 hover:shadow-md hover:border-purple-200 transition-all group">
      {/* Avatar */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
        style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
      >
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className={`flex items-start justify-between gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 leading-tight truncate">{member.full_name}</h3>
            <div className="mt-1.5">
              <RoleBadge role={member.role} t={t} />
            </div>
          </div>
          {/* Actions — visible on hover */}
          <div className={`flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
              onClick={() => onEdit(member)}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
              onClick={() => onDelete(member)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-2 space-y-1">
          {member.email && (
            <div className={`flex items-center gap-1.5 text-xs text-gray-500 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Mail className="w-3 h-3 flex-shrink-0" />
              <span dir="ltr" className="truncate">{member.email}</span>
            </div>
          )}
          {member.phone && (
            <div className={`flex items-center gap-1.5 text-xs text-gray-500 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Phone className="w-3 h-3 flex-shrink-0" />
              <span dir="ltr">{member.phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Member modal (invite / edit) ─────────────────────────────────────────────

const EMPTY_FORM = { full_name: '', email: '', phone: '', role: 'hr_manager' };

function MemberModal({ open, onOpenChange, member, onSubmit, loading, isRtl, t }) {
  const isEdit = Boolean(member?.id);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    setForm(member ? { ...member } : EMPTY_FORM);
  }, [member, open]);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir={isRtl ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('company.team.editMember') : t('company.team.inviteNew')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <Label className="text-sm font-semibold">
              {t('company.team.form.fullName')} *
            </Label>
            <Input
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              required
              placeholder={t('company.team.form.fullNamePlaceholder')}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold">
              {t('company.team.form.email')} *
            </Label>
            <Input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              required
              dir="ltr"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold">
              {t('company.team.form.phone')}
            </Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              dir="ltr"
              placeholder={t('company.team.form.phonePlaceholder')}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold">
              {t('company.team.form.role')} *
            </Label>
            <Select value={form.role} onValueChange={val => set('role', val)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hr_manager">
                  {t('company.team.roles.hr_manager')}
                </SelectItem>
                <SelectItem value="internal_recruiter">
                  {t('company.team.roles.internal_recruiter')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className={`flex gap-3 pt-4 border-t ${isRtl ? 'flex-row-reverse' : 'justify-end'}`}>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? t('company.team.form.saving') : t('company.team.form.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────

function DeleteConfirmDialog({ open, onOpenChange, member, onConfirm, loading, isRtl, t }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir={isRtl ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            {t('common.confirm')}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-600">{t('company.team.confirmDelete')}</p>
        {member && (
          <p className="text-sm font-semibold text-gray-900 mt-1">{member.full_name}</p>
        )}

        <div className={`flex gap-3 pt-4 border-t ${isRtl ? 'flex-row-reverse' : 'justify-end'}`}>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? t('common.loading') : t('common.delete')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function MemberSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-2/3" />
          <div className="h-5 bg-gray-100 rounded w-1/3" />
          <div className="h-3 bg-gray-100 rounded w-3/4 mt-2" />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CompanyTeamPage() {
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');
  const { organization } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);

  // Determine which sub-route is active
  const routeFilter = useMemo(() => {
    if (location.pathname.endsWith('/members')) return 'members';
    if (location.pathname.endsWith('/recruiters')) return 'recruiters';
    return 'all';
  }, [location.pathname]);

  // ── Query ─────────────────────────────────────────────────────────────────

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['company-staff', organization?.id],
    queryFn: () => userService.list({ organization_id: organization?.id, limit: 500, sort: 'full_name', order: 'ASC' }),
    enabled: !!organization?.id,
  });

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total: staffList.length,
    admins: staffList.filter(s => s.role === 'org_admin').length,
    hrManagers: staffList.filter(s => s.role === 'hr_manager').length,
    recruiters: staffList.filter(s => s.role === 'internal_recruiter').length,
  }), [staffList]);

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filteredList = useMemo(() => {
    let list = [...staffList];

    // Route-level filter
    if (routeFilter === 'members') {
      list = list.filter(s => s.role === 'hr_manager' || s.role === 'org_admin');
    } else if (routeFilter === 'recruiters') {
      list = list.filter(s => s.role === 'internal_recruiter');
    }

    // Tab-level role filter (only applies on /team root)
    if (routeFilter === 'all' && roleFilter !== 'all') {
      list = list.filter(s => s.role === roleFilter);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.full_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [staffList, routeFilter, roleFilter, search]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: data => userService.invite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-staff'] });
      setShowModal(false);
      setEditingMember(null);
      toast({ title: t('company.team.savedSuccess') });
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      const { email: _email, ...updates } = data;
      return userService.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-staff'] });
      setShowModal(false);
      setEditingMember(null);
      toast({ title: t('company.team.savedSuccess') });
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: id => userService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-staff'] });
      setDeletingMember(null);
      toast({ title: t('company.team.deletedSuccess') });
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSubmit = data => {
    if (editingMember?.id) {
      updateMutation.mutate({ id: editingMember.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = member => {
    setEditingMember(member);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMember(null);
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  // ── Page meta ─────────────────────────────────────────────────────────────

  const pageTitle = routeFilter === 'members'
    ? t('company.team.members')
    : routeFilter === 'recruiters'
    ? t('company.team.recruiters')
    : t('company.team.title');

  const pageSubtitle = routeFilter === 'members'
    ? t('company.team.membersSubtitle')
    : routeFilter === 'recruiters'
    ? t('company.team.recruitersSubtitle')
    : t('company.team.subtitle');

  const filterTabs = [
    { key: 'all',               label: t('company.team.filters.all') },
    { key: 'org_admin',         label: t('company.team.filters.org_admin') },
    { key: 'hr_manager',        label: t('company.team.filters.hr_manager') },
    { key: 'internal_recruiter',label: t('company.team.filters.internal_recruiter') },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{pageTitle}</h1>
          <p className="text-gray-500 font-semibold mt-1">{pageSubtitle}</p>
        </div>
        <Button
          onClick={() => { setEditingMember(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t('company.team.invite')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label={t('company.team.totalMembers')}
          value={stats.total}
          color="#059669"
          loading={isLoading}
        />
        <StatCard
          icon={Crown}
          label={t('company.team.orgAdmins')}
          value={stats.admins}
          color="#7C3AED"
          loading={isLoading}
        />
        <StatCard
          icon={ShieldCheck}
          label={t('company.team.hrManagers')}
          value={stats.hrManagers}
          color="#2563EB"
          loading={isLoading}
        />
        <StatCard
          icon={Briefcase}
          label={t('company.team.internalRecruiters')}
          value={stats.recruiters}
          color="#EA580C"
          loading={isLoading}
        />
      </div>

      {/* Search + Filter */}
      <div className={`flex items-center gap-3 flex-wrap ${isRtl ? 'flex-row-reverse' : ''}`}>
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search
            className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none ${isRtl ? 'right-3' : 'left-3'}`}
          />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('company.team.searchPlaceholder')}
            className={isRtl ? 'pr-9' : 'pl-9'}
          />
        </div>

        {/* Role filter tabs — only visible on /company/team root */}
        {routeFilter === 'all' && (
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1 flex-wrap">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setRoleFilter(tab.key)}
                className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${
                  roleFilter === tab.key
                    ? 'bg-white text-purple-600 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Member grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <MemberSkeleton key={i} />)}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
            <UserPlus className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="font-black text-gray-900 text-lg mb-1">
            {search ? t('company.team.noResults') : t('company.team.noMembers')}
          </h3>
          <p className="text-sm text-gray-500 font-semibold mb-4">
            {search ? t('company.team.noResultsHint') : t('company.team.noMembersHint')}
          </p>
          {!search && (
            <Button
              onClick={() => { setEditingMember(null); setShowModal(true); }}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('company.team.invite')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              onEdit={handleEdit}
              onDelete={setDeletingMember}
              isRtl={isRtl}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <MemberModal
        open={showModal}
        onOpenChange={v => { if (!v) handleCloseModal(); else setShowModal(true); }}
        member={editingMember}
        onSubmit={handleSubmit}
        loading={isMutating}
        isRtl={isRtl}
        t={t}
      />

      <DeleteConfirmDialog
        open={Boolean(deletingMember)}
        onOpenChange={v => { if (!v) setDeletingMember(null); }}
        member={deletingMember}
        onConfirm={() => deletingMember?.id && deleteMutation.mutate(deletingMember.id)}
        loading={deleteMutation.isPending}
        isRtl={isRtl}
        t={t}
      />
    </div>
  );
}
