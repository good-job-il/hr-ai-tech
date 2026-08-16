import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { agencyTeamsService } from '@/api/services/agencyTeamsService';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Building2, Check, Clock3, Copy, Mail, Plus, RefreshCw, Search, ShieldCheck, UserCog, Users, UserX, XCircle } from 'lucide-react';

const ROLES = ['org_admin', 'recruitment_manager', 'team_manager', 'recruiter'];
const ROLE_COLORS = {
  org_admin: 'bg-purple-50 text-purple-700 border-purple-200',
  recruitment_manager: 'bg-blue-50 text-blue-700 border-blue-200',
  team_manager: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  recruiter: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function Stat({ icon: Icon, label, value, color }) {
  return <div className="rounded-2xl border bg-white p-4 flex items-center gap-3 shadow-sm"><div className="rounded-xl p-2.5" style={{ background: `${color}18`, color }}><Icon className="w-5 h-5" /></div><div><div className="text-2xl font-black">{value}</div><div className="text-xs font-semibold text-gray-500">{label}</div></div></div>;
}

const EMPTY_INVITE = { full_name: '', email: '', phone: '', role: 'recruiter', team_id: 'none' };
function InviteDialog({ open, setOpen, teams, onSubmit, pending, t, isRtl }) {
  const [form, setForm] = useState(EMPTY_INVITE);
  const submit = e => { e.preventDefault(); onSubmit({ ...form, team_id: form.team_id === 'none' ? null : Number(form.team_id) }, () => { setForm(EMPTY_INVITE); setOpen(false); }); };
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent dir={isRtl ? 'rtl' : 'ltr'} className="sm:max-w-lg"><DialogHeader><DialogTitle>{t('agencyTeams.invite.title')}</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={submit}>
    <div><Label>{t('agencyTeams.fields.fullName')}</Label><Input className="mt-1" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
    <div><Label>{t('agencyTeams.fields.email')}</Label><Input className="mt-1" type="email" dir="ltr" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
    <div><Label>{t('agencyTeams.fields.phone')}</Label><Input className="mt-1" dir="ltr" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
    <div className="grid sm:grid-cols-2 gap-4"><div><Label>{t('agencyTeams.fields.role')}</Label><Select value={form.role} onValueChange={role => setForm({ ...form, role })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{ROLES.map(role => <SelectItem key={role} value={role}>{t(`agencyTeams.roles.${role}`)}</SelectItem>)}</SelectContent></Select></div>
    <div><Label>{t('agencyTeams.fields.team')}</Label><Select value={form.team_id} onValueChange={team_id => setForm({ ...form, team_id })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{t('agencyTeams.noTeam')}</SelectItem>{teams.filter(x => x.is_active).map(team => <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>)}</SelectContent></Select></div></div>
    <Alert><Mail className="h-4 w-4" /><AlertDescription>{t('agencyTeams.invite.hint')}</AlertDescription></Alert>
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button><Button disabled={pending}>{pending ? t('common.loading') : t('agencyTeams.invite.send')}</Button></div>
  </form></DialogContent></Dialog>;
}

function TeamDialog({ open, setOpen, managers, onSubmit, pending, t, isRtl }) {
  const [form, setForm] = useState({ name: '', description: '', manager_id: 'none' });
  const submit = e => { e.preventDefault(); onSubmit({ ...form, manager_id: form.manager_id === 'none' ? null : Number(form.manager_id) }, () => { setForm({ name: '', description: '', manager_id: 'none' }); setOpen(false); }); };
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent dir={isRtl ? 'rtl' : 'ltr'}><DialogHeader><DialogTitle>{t('agencyTeams.teamModal.title')}</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={submit}><div><Label>{t('agencyTeams.teamModal.name')}</Label><Input className="mt-1" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div><div><Label>{t('agencyTeams.teamModal.description')}</Label><Input className="mt-1" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div><div><Label>{t('agencyTeams.teamModal.manager')}</Label><Select value={form.manager_id} onValueChange={manager_id => setForm({ ...form, manager_id })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{t('agencyTeams.unassigned')}</SelectItem>{managers.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.full_name}</SelectItem>)}</SelectContent></Select></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button><Button disabled={pending}>{t('common.create')}</Button></div></form></DialogContent></Dialog>;
}

function MemberDialog({ member, setMember, teams, onSubmit, pending, t, isRtl }) {
  const [role, setRole] = useState(member?.role || 'recruiter');
  const [teamId, setTeamId] = useState(member?.team_id ? String(member.team_id) : 'none');
  if (!member) return null;
  return <Dialog open onOpenChange={open => !open && setMember(null)}><DialogContent dir={isRtl ? 'rtl' : 'ltr'}><DialogHeader><DialogTitle>{t('agencyTeams.memberModal.title', { name: member.full_name })}</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>{t('agencyTeams.fields.role')}</Label><Select value={role} onValueChange={setRole}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{ROLES.map(item => <SelectItem key={item} value={item}>{t(`agencyTeams.roles.${item}`)}</SelectItem>)}</SelectContent></Select></div><div><Label>{t('agencyTeams.fields.team')}</Label><Select value={teamId} onValueChange={setTeamId}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{t('agencyTeams.noTeam')}</SelectItem>{teams.filter(x => x.is_active).map(team => <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>)}</SelectContent></Select></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setMember(null)}>{t('common.cancel')}</Button><Button disabled={pending} onClick={() => onSubmit(member.id, { role, team_id: teamId === 'none' ? null : Number(teamId) })}>{t('common.save')}</Button></div></div></DialogContent></Dialog>;
}

export default function AgencyTeamsPage() {
  const { t, i18n } = useTranslation(); const isRtl = !i18n.language?.startsWith('en');
  const { user } = useAuth(); const canAdmin = user?.role === 'org_admin' || user?.role === 'admin';
  const { toast } = useToast(); const queryClient = useQueryClient();
  const [search, setSearch] = useState(''); const [roleFilter, setRoleFilter] = useState('all'); const [inviteOpen, setInviteOpen] = useState(false); const [teamOpen, setTeamOpen] = useState(false); const [editingMember, setEditingMember] = useState(null); const [lastLink, setLastLink] = useState('');
  const query = useQuery({ queryKey: ['agency-teams'], queryFn: agencyTeamsService.overview });
  const data = query.data || { members: [], teams: [], invitations: [] };
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['agency-teams'] });
  const fail = error => toast({ title: error?.message || t('common.error'), variant: 'destructive' });
  const invite = useMutation({ mutationFn: agencyTeamsService.invite, onError: fail });
  const createTeam = useMutation({ mutationFn: agencyTeamsService.createTeam, onError: fail });
  const updateMember = useMutation({ mutationFn: ({ id, payload }) => agencyTeamsService.updateMember(id, payload), onSuccess: invalidate, onError: fail });
  const resend = useMutation({ mutationFn: agencyTeamsService.resend, onSuccess: result => { invalidate(); showInviteLink(result.invite_token); }, onError: fail });
  const cancel = useMutation({ mutationFn: agencyTeamsService.cancel, onSuccess: invalidate, onError: fail });
  const teamById = useMemo(() => Object.fromEntries(data.teams.map(x => [x.id, x])), [data.teams]);
  const members = useMemo(() => data.members.filter(m => (roleFilter === 'all' || m.role === roleFilter) && (!search.trim() || `${m.full_name} ${m.email}`.toLowerCase().includes(search.toLowerCase()))), [data.members, roleFilter, search]);
  const pendingInvites = data.invitations.filter(x => x.status === 'pending');
  const showInviteLink = token => { const link = `${window.location.origin}/register?invite=${encodeURIComponent(token)}`; setLastLink(link); navigator.clipboard?.writeText(link); toast({ title: t('agencyTeams.invite.copied') }); };
  const submitInvite = (payload, done) => invite.mutate(payload, { onSuccess: result => { invalidate(); showInviteLink(result.invite_token); done(); } });
  const submitTeam = (payload, done) => createTeam.mutate(payload, { onSuccess: () => { invalidate(); toast({ title: t('agencyTeams.teamModal.created') }); done(); } });
  const toggleMember = member => updateMember.mutate({ id: member.id, payload: { is_active: !member.is_active } });
  const saveMember = (id, payload) => updateMember.mutate({ id, payload }, { onSuccess: () => { setEditingMember(null); toast({ title: t('agencyTeams.memberModal.saved') }); } });

  if (query.isError) return <Alert variant="destructive"><XCircle className="h-4 w-4" /><AlertTitle>{t('agencyTeams.errorTitle')}</AlertTitle><AlertDescription><Button className="mt-3" variant="outline" onClick={() => query.refetch()}>{t('common.retry')}</Button></AlertDescription></Alert>;
  return <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6 max-w-7xl mx-auto">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-black text-gray-900">{t('agencyTeams.title')}</h1><p className="text-gray-500 font-semibold mt-1">{t('agencyTeams.subtitle')}</p></div>{canAdmin && <Button onClick={() => setInviteOpen(true)}><Plus className="w-4 h-4 me-2" />{t('agencyTeams.inviteMember')}</Button>}</div>
    {lastLink && <Alert className="border-emerald-200 bg-emerald-50"><Check className="h-4 w-4 text-emerald-600" /><AlertTitle>{t('agencyTeams.invite.linkReady')}</AlertTitle><AlertDescription className="flex flex-wrap gap-2 items-center"><code dir="ltr" className="max-w-full truncate">{lastLink}</code><Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(lastLink)}><Copy className="w-3.5 h-3.5 me-1" />{t('common.copy')}</Button></AlertDescription></Alert>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><Stat icon={Users} label={t('agencyTeams.stats.total')} value={data.members.length} color="#7C3AED" /><Stat icon={ShieldCheck} label={t('agencyTeams.stats.active')} value={data.members.filter(x => x.is_active).length} color="#059669" /><Stat icon={Building2} label={t('agencyTeams.stats.teams')} value={data.teams.filter(x => x.is_active).length} color="#2563EB" /><Stat icon={Clock3} label={t('agencyTeams.stats.pending')} value={pendingInvites.length} color="#D97706" /></div>
    <Tabs defaultValue="members"><TabsList className="h-auto flex-wrap"><TabsTrigger value="members">{t('agencyTeams.tabs.members')}</TabsTrigger><TabsTrigger value="teams">{t('agencyTeams.tabs.teams')}</TabsTrigger><TabsTrigger value="invitations">{t('agencyTeams.tabs.invitations')} {pendingInvites.length > 0 && <Badge className="ms-2">{pendingInvites.length}</Badge>}</TabsTrigger></TabsList>
      <TabsContent value="members" className="space-y-4"><div className="flex flex-wrap gap-3"><div className="relative flex-1 min-w-56"><Search className="absolute start-3 top-3 w-4 h-4 text-gray-400" /><Input className="ps-9" placeholder={t('agencyTeams.search')} value={search} onChange={e => setSearch(e.target.value)} /></div><Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t('agencyTeams.allRoles')}</SelectItem>{ROLES.map(role => <SelectItem key={role} value={role}>{t(`agencyTeams.roles.${role}`)}</SelectItem>)}</SelectContent></Select></div>
        <div className="rounded-2xl border bg-white overflow-hidden">{query.isLoading ? <div className="p-12 text-center text-gray-500">{t('common.loading')}</div> : members.length === 0 ? <div className="p-12 text-center text-gray-500">{t('agencyTeams.emptyMembers')}</div> : <div className="divide-y">{members.map(member => <div key={member.id} className="p-4 flex flex-wrap items-center gap-4"><div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center">{(member.full_name || member.email).slice(0, 2).toUpperCase()}</div><div className="min-w-48 flex-1"><div className="font-bold">{member.full_name}</div><div className="text-sm text-gray-500" dir="ltr">{member.email}</div></div><Badge variant="outline" className={ROLE_COLORS[member.role]}>{t(`agencyTeams.roles.${member.role}`)}</Badge><div className="text-sm text-gray-500 min-w-28">{teamById[member.team_id]?.name || t('agencyTeams.noTeam')}</div><Badge variant={member.is_active ? 'default' : 'secondary'}>{t(member.is_active ? 'agencyTeams.active' : 'agencyTeams.inactive')}</Badge>{canAdmin && <Button size="sm" variant="ghost" onClick={() => setEditingMember(member)}><UserCog className="w-4 h-4 me-1" />{t('common.edit')}</Button>}{canAdmin && member.id !== user.id && <Button size="sm" variant="outline" onClick={() => toggleMember(member)} disabled={updateMember.isPending}>{member.is_active ? <UserX className="w-4 h-4 me-1" /> : <UserCog className="w-4 h-4 me-1" />}{t(member.is_active ? 'agencyTeams.deactivate' : 'agencyTeams.activate')}</Button>}</div>)}</div>}</div>
      </TabsContent>
      <TabsContent value="teams" className="space-y-4"><div className="flex justify-end"><Button variant="outline" onClick={() => setTeamOpen(true)}><Plus className="w-4 h-4 me-2" />{t('agencyTeams.createTeam')}</Button></div><div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{data.teams.length === 0 ? <div className="col-span-full rounded-2xl border bg-white p-12 text-center text-gray-500">{t('agencyTeams.emptyTeams')}</div> : data.teams.map(team => { const manager = data.members.find(m => m.id === team.manager_id); const count = data.members.filter(m => m.team_id === team.id).length; return <div key={team.id} className="rounded-2xl border bg-white p-5"><div className="flex justify-between"><div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"><Users className="w-5 h-5" /></div><Badge variant={team.is_active ? 'default' : 'secondary'}>{t(team.is_active ? 'agencyTeams.active' : 'agencyTeams.inactive')}</Badge></div><h3 className="text-lg font-black mt-4">{team.name}</h3><p className="text-sm text-gray-500 min-h-10">{team.description || '—'}</p><div className="mt-4 pt-4 border-t text-sm"><div>{t('agencyTeams.teamManager')}: <strong>{manager?.full_name || t('agencyTeams.unassigned')}</strong></div><div className="text-gray-500 mt-1">{t('agencyTeams.memberCount', { count })}</div></div></div>; })}</div></TabsContent>
      <TabsContent value="invitations"><div className="rounded-2xl border bg-white divide-y">{data.invitations.length === 0 ? <div className="p-12 text-center text-gray-500">{t('agencyTeams.emptyInvites')}</div> : data.invitations.map(inv => <div key={inv.id} className="p-4 flex flex-wrap gap-4 items-center"><Mail className="w-5 h-5 text-gray-400" /><div className="flex-1 min-w-52"><div className="font-bold">{inv.full_name}</div><div className="text-sm text-gray-500" dir="ltr">{inv.email}</div></div><Badge variant="outline" className={ROLE_COLORS[inv.role]}>{t(`agencyTeams.roles.${inv.role}`)}</Badge><Badge variant={inv.status === 'pending' ? 'secondary' : 'outline'}>{t(`agencyTeams.inviteStatus.${inv.status}`)}</Badge>{canAdmin && inv.status === 'pending' && <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => resend.mutate(inv.id)}><RefreshCw className="w-3.5 h-3.5 me-1" />{t('agencyTeams.resend')}</Button><Button size="sm" variant="ghost" onClick={() => cancel.mutate(inv.id)}><XCircle className="w-3.5 h-3.5 me-1" />{t('agencyTeams.cancelInvite')}</Button></div>}</div>)}</div></TabsContent>
    </Tabs>
    <InviteDialog open={inviteOpen} setOpen={setInviteOpen} teams={data.teams} onSubmit={submitInvite} pending={invite.isPending} t={t} isRtl={isRtl} />
    <TeamDialog open={teamOpen} setOpen={setTeamOpen} managers={data.members.filter(x => x.role === 'team_manager' && x.is_active)} onSubmit={submitTeam} pending={createTeam.isPending} t={t} isRtl={isRtl} />
    <MemberDialog member={editingMember} setMember={setEditingMember} teams={data.teams} onSubmit={saveMember} pending={updateMember.isPending} t={t} isRtl={isRtl} />
  </div>;
}
