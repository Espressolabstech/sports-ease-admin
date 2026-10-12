import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { KeyRound, Plus, ShieldCheck, UserX, UserCheck } from 'lucide-react';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { createAdmin, listTeam, updateAdmin, type TeamAdmin } from '../../api/adapters/team';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { PERMISSION_LABEL, ROLE_LABEL, type AdminRoleName } from '../../utils/permissions';
import { fmtDateTime } from '../Events/format';

const lime = 'bg-[hsl(var(--admin-lime))] text-[hsl(var(--admin-lime-foreground))] hover:bg-[hsl(var(--admin-lime))]/90';

export default function TeamPage() {
    const queryClient = useQueryClient();
    const { adminUser } = useAdminAuth();
    const [addOpen, setAddOpen] = useState(false);
    const [resetFor, setResetFor] = useState<TeamAdmin | null>(null);
    const [form, setForm] = useState({ name: '', email: '', role: 'OPERATIONS' as AdminRoleName, password: '' });
    const [newPassword, setNewPassword] = useState('');

    const { data, isLoading } = useQuery({ queryKey: ['admin-team'], queryFn: listTeam });
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-team'] });
    const onError = (err: any) => toast.error(err.message || 'Something went wrong');

    const createMutation = useMutation({
        mutationFn: () => createAdmin({ ...form, name: form.name.trim(), email: form.email.trim() }),
        onSuccess: (res) => {
            toast.success(`${res.admin.name} can now sign in as ${ROLE_LABEL[res.admin.role]}.`);
            setAddOpen(false);
            setForm({ name: '', email: '', role: 'OPERATIONS', password: '' });
            refresh();
        },
        onError,
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAdmin>[1] }) => updateAdmin(id, data),
        onSuccess: () => {
            toast.success('Team member updated.');
            setResetFor(null);
            setNewPassword('');
            refresh();
        },
        onError,
    });

    const admins = data?.admins ?? [];
    const roles = data?.roles ?? [];
    const canCreate = form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 8;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Team & Roles</h1>
                    <p className="text-sm text-muted-foreground">Who can sign in to the admin console, and what each person can do.</p>
                </div>
                <Button className={lime} onClick={() => setAddOpen(true)}>
                    <Plus className="mr-1.5 h-4 w-4" /> Add admin
                </Button>
            </div>

            <div className="rounded-xl bg-card shadow-sm">
                {isLoading ? (
                    <div className="space-y-3 p-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left">
                                    {['Admin', 'Role', 'Status', 'Last sign-in', ''].map((h) => (
                                        <th key={h} className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {admins.map((a) => {
                                    const isSelf = a.id === adminUser?.id;
                                    return (
                                        <tr key={a.id} className="border-b border-border last:border-0">
                                            <td className="px-4 py-3">
                                                <p className="font-medium">{a.name || '—'}{isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}</p>
                                                <p className="text-xs text-muted-foreground">{a.email}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Select
                                                    value={a.role}
                                                    disabled={isSelf || updateMutation.isPending}
                                                    onValueChange={(role) => updateMutation.mutate({ id: a.id, data: { role: role as AdminRoleName } })}
                                                >
                                                    <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {roles.map((r) => <SelectItem key={r.role} value={r.role}>{r.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="px-4 py-3"><StatusBadge status={a.status === 'ACTIVE' ? 'Active' : 'Deactivated'} variant={a.status === 'ACTIVE' ? 'lime' : 'red'} /></td>
                                            <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{a.lastLoginAt ? fmtDateTime(a.lastLoginAt) : 'Never'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-1">
                                                    <Button size="sm" variant="ghost" title="Reset password" onClick={() => setResetFor(a)}>
                                                        <KeyRound className="h-4 w-4" />
                                                    </Button>
                                                    {!isSelf && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            title={a.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
                                                            disabled={updateMutation.isPending}
                                                            onClick={() => updateMutation.mutate({ id: a.id, data: { status: a.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } })}
                                                        >
                                                            {a.status === 'ACTIVE' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><ShieldCheck className="h-4 w-4" /> What each role can do</h2>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {roles.map((r) => (
                        <div key={r.role} className="rounded-xl bg-card p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="font-semibold">{r.label}</p>
                                <span className="text-xs text-muted-foreground">{admins.filter((a) => a.role === r.role).length} member(s)</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
                            <ul className="mt-3 space-y-1">
                                {r.permissions.map((p) => (
                                    <li key={p} className="text-xs text-foreground">• {PERMISSION_LABEL[p] ?? p}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add admin</DialogTitle>
                        <DialogDescription>They'll sign in with this email and password. Share the password with them securely.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        <Select value={form.role} onValueChange={(role) => setForm({ ...form, role: role as AdminRoleName })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {roles.map((r) => <SelectItem key={r.role} value={r.role}>{r.label} — {r.description}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Input type="password" placeholder="Password (min. 8 characters)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                        <Button className={lime} disabled={!canCreate || createMutation.isPending} onClick={() => createMutation.mutate()}>Add admin</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!resetFor} onOpenChange={(o) => !o && setResetFor(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset password</DialogTitle>
                        <DialogDescription>Set a new password for {resetFor?.name || resetFor?.email}.</DialogDescription>
                    </DialogHeader>
                    <Input type="password" placeholder="New password (min. 8 characters)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResetFor(null)}>Cancel</Button>
                        <Button
                            className={lime}
                            disabled={newPassword.length < 8 || updateMutation.isPending}
                            onClick={() => resetFor && updateMutation.mutate({ id: resetFor.id, data: { password: newPassword } })}
                        >
                            Save password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
