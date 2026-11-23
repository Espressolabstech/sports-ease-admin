import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { KeyRound, UserRound } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { changeAdminPassword, updateAdminMe } from '../../api/adapters/auth';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

/** The signed-in admin's own name and password — open to every admin, whatever their role. */
export default function AccountSettings() {
    const { adminUser, updateAdminUser } = useAdminAuth();
    const [name, setName] = useState(adminUser?.name ?? '');
    const [pw, setPw] = useState({ current: '', next: '', confirm: '' });

    const nameMutation = useMutation({
        mutationFn: () => updateAdminMe(name.trim()),
        onSuccess: (res) => {
            updateAdminUser({ name: res.admin.name });
            toast.success('Name updated');
        },
        onError: (err: { message?: string }) => toast.error(err.message || 'Could not update the name'),
    });

    const passwordMutation = useMutation({
        mutationFn: () => changeAdminPassword(pw.current, pw.next),
        onSuccess: () => {
            setPw({ current: '', next: '', confirm: '' });
            toast.success('Password changed. Use the new password next time you sign in.');
        },
        onError: (err: { message?: string }) => toast.error(err.message || 'Could not change the password'),
    });

    const trimmed = name.trim();
    const nameChanged = trimmed.length >= 2 && trimmed !== adminUser?.name;
    const mismatch = pw.confirm.length > 0 && pw.next !== pw.confirm;
    const tooShort = pw.next.length > 0 && pw.next.length < 8;
    const canChangePassword = pw.next.length >= 8 && pw.next === pw.confirm;

    const saveName = (e: FormEvent) => {
        e.preventDefault();
        if (nameChanged) nameMutation.mutate();
    };
    const savePassword = (e: FormEvent) => {
        e.preventDefault();
        if (canChangePassword) passwordMutation.mutate();
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={saveName} className="space-y-4 rounded-xl bg-card p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                    <UserRound className="h-5 w-5 text-[hsl(var(--admin-lime))]" /> My profile
                </h2>
                <div className="space-y-1.5">
                    <Label htmlFor="admin-name">Name</Label>
                    <Input id="admin-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                    <p className="text-xs text-muted-foreground">Shown in the sidebar and on records you create (payouts, refunds).</p>
                </div>
                <div className="space-y-1.5">
                    <Label>Email</Label>
                    <p className="text-sm text-muted-foreground">{adminUser?.email || '—'}</p>
                </div>
                <Button type="submit" disabled={!nameChanged || nameMutation.isPending}>
                    {nameMutation.isPending ? 'Saving…' : 'Save name'}
                </Button>
            </form>

            <form onSubmit={savePassword} className="space-y-4 rounded-xl bg-card p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                    <KeyRound className="h-5 w-5 text-[hsl(var(--admin-lime))]" /> Change password
                </h2>
                <div className="space-y-1.5">
                    <Label htmlFor="pw-current">Current password</Label>
                    <Input
                        id="pw-current"
                        type="password"
                        autoComplete="current-password"
                        value={pw.current}
                        onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="pw-new">New password</Label>
                    <Input
                        id="pw-new"
                        type="password"
                        autoComplete="new-password"
                        value={pw.next}
                        aria-invalid={tooShort}
                        onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                    />
                    <p className={`text-xs ${tooShort ? 'text-destructive' : 'text-muted-foreground'}`}>At least 8 characters.</p>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="pw-confirm">Confirm new password</Label>
                    <Input
                        id="pw-confirm"
                        type="password"
                        autoComplete="new-password"
                        value={pw.confirm}
                        aria-invalid={mismatch}
                        onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                    />
                    {mismatch && <p className="text-xs text-destructive">The passwords don’t match.</p>}
                </div>
                <Button type="submit" disabled={!canChangePassword || passwordMutation.isPending}>
                    {passwordMutation.isPending ? 'Changing…' : 'Change password'}
                </Button>
            </form>
        </div>
    );
}
