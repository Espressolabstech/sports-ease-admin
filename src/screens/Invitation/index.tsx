import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Copy, Download, Eye, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { listInvitations, createInvitation, revokeInvitation } from '../../api/adapters/invitations';
import { listVenues } from '../../api/adapters/venues';

const PAGE_SIZE = 20;
const STATUSES = ['PENDING', 'USED', 'EXPIRED', 'REVOKED'];

const Invitation = () => {
    const queryClient = useQueryClient();

    const [formOpen, setFormOpen] = useState(false);
    const [selectedVenueId, setSelectedVenueId] = useState('');
    const [phone, setPhone] = useState('');
    const [expiresInDays, setExpiresInDays] = useState('7');
    const [generatedToken, setGeneratedToken] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [revokeId, setRevokeId] = useState<string | null>(null);

    const { data: venuesData } = useQuery({
        queryKey: ['admin-venues-for-invitation'],
        queryFn: () => listVenues({ status: 'ACTIVE', limit: 100 }),
        select: (res) => res.venues,
    });

    const { data: invitationsData, isLoading } = useQuery({
        queryKey: ['admin-invitations', searchQuery, statusFilter, page],
        queryFn: () =>
            listInvitations({
                search: searchQuery || undefined,
                status: statusFilter === 'all' ? undefined : statusFilter,
                page,
                limit: PAGE_SIZE,
            }),
    });

    const invitations = invitationsData?.invitations || [];
    const total = invitationsData?.pagination.total || 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    const createMutation = useMutation({
        mutationFn: () =>
            createInvitation(selectedVenueId, phone || undefined, parseInt(expiresInDays) || 7),
        onSuccess: (res) => {
            setGeneratedToken(res.invitation.token);
            toast.success('Invitation created');
            queryClient.invalidateQueries({ queryKey: ['admin-invitations'] });
            setSelectedVenueId('');
            setPhone('');
        },
        onError: (err: any) => toast.error(err.message || 'Failed to create invitation'),
    });

    const revokeMutation = useMutation({
        mutationFn: (id: string) => revokeInvitation(id),
        onSuccess: () => {
            toast.success('Invitation revoked');
            setRevokeId(null);
            queryClient.invalidateQueries({ queryKey: ['admin-invitations'] });
        },
        onError: (err: any) => toast.error(err.message),
    });

    const inviteLink = generatedToken
        ? `${window.location.origin}/onboarding/${generatedToken}`
        : '';

    const copyLink = async () => {
        await navigator.clipboard.writeText(inviteLink);
        toast.success('Link copied to clipboard');
    };

    const exportCSV = () => {
        if (!invitations.length) return;
        const csv = [['Venue ID', 'Phone', 'Status', 'Expires', 'Created']]
            .concat(invitations.map((r: any) => [
                r.venueId, r.phone || '', r.status,
                r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : '',
                new Date(r.createdAt).toLocaleDateString(),
            ]))
            .map((row) => row.map((c: string) => `"${c}"`).join(','))
            .join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = 'invitations.csv';
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Create Invitation Card */}
            <div className="rounded-xl bg-card shadow-sm">
                <button
                    onClick={() => { setFormOpen(!formOpen); setGeneratedToken(''); }}
                    className="flex w-full items-center justify-between px-6 py-4"
                >
                    <span className="text-sm font-semibold text-foreground">Generate New Invitation</span>
                    {formOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {formOpen && (
                    <div className="border-t border-border px-6 pb-6 pt-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Venue</label>
                                <Select value={selectedVenueId} onValueChange={setSelectedVenueId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a venue" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(venuesData || []).map((v: any) => (
                                            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Phone (optional)</label>
                                <Input placeholder="+971 50 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Expires In (days)</label>
                                <Input type="number" value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)} min={1} max={30} />
                            </div>
                        </div>

                        <div className="mt-4">
                            <Button
                                onClick={() => createMutation.mutate()}
                                disabled={!selectedVenueId || createMutation.isPending}
                                className="bg-[hsl(var(--admin-lime))] text-[hsl(var(--admin-lime-foreground))] hover:bg-[hsl(var(--admin-lime))]/90"
                            >
                                {createMutation.isPending ? 'Generating...' : 'Generate Invitation Link'}
                            </Button>
                        </div>

                        {inviteLink && (
                            <div className="mt-4 space-y-3 rounded-lg bg-muted/50 p-4">
                                <div className="flex items-center gap-2">
                                    <Input value={inviteLink} readOnly className="flex-1 bg-card text-xs" />
                                    <Button size="icon" variant="outline" onClick={copyLink}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Table controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-3">
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Filter status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-xl bg-card shadow-sm">
                {isLoading ? (
                    <div className="space-y-3 p-6">
                        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : invitations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <p className="mt-4 text-sm font-medium text-muted-foreground">No invitations yet</p>
                        <p className="text-sm text-muted-foreground/60">Generate your first one above.</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left">
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Venue</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Phone</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Created</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Expires</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invitations.map((inv: any) => (
                                        <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium">{inv.venue?.name || inv.venueId}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{inv.phone || '—'}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setRevokeId(inv.id)}
                                                        disabled={inv.status === 'REVOKED' || inv.status === 'USED'}
                                                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-[hsl(var(--admin-status-red))] disabled:cursor-not-allowed disabled:opacity-40"
                                                        title="Revoke"
                                                    >
                                                        <Ban className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="space-y-3 p-4 md:hidden">
                            {invitations.map((inv: any) => (
                                <div key={inv.id} className="rounded-lg border border-border p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">{inv.venue?.name || inv.venueId}</span>
                                        <StatusBadge status={inv.status} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">{inv.phone || '—'}</p>
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-border px-4 py-3">
                                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                                <div className="flex gap-1">
                                    <Button size="icon" variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="outline" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <AlertDialog open={!!revokeId} onOpenChange={() => setRevokeId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revoke Invitation?</AlertDialogTitle>
                        <AlertDialogDescription>The venue manager will no longer be able to use this link.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => revokeId && revokeMutation.mutate(revokeId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {revokeMutation.isPending ? 'Revoking...' : 'Revoke'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Invitation;
