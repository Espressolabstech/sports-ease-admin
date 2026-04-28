import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from 'sonner';
import { Users, Search, Eye, Ban, ShieldCheck, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { cn } from '../../utils/twMerge';
import { listPlayers, getPlayer, updatePlayerStatus } from '../../api/adapters/players';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const PAGE_SIZE = 25;
const BAN_REASONS = ['Fraudulent Activity', 'Payment Fraud', 'Repeated No-Shows', 'Abusive Behaviour', 'Other'];

export default function AdminPlayersPage() {
    const { isSuperAdmin } = useAdminAuth();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [viewPlayerId, setViewPlayerId] = useState<string | null>(null);
    const [banPlayer, setBanPlayer] = useState<any>(null);
    const [banReason, setBanReason] = useState('');
    const [banNotes, setBanNotes] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['admin-all-players', searchQuery, statusFilter, page],
        queryFn: () =>
            listPlayers({
                search: searchQuery || undefined,
                status: statusFilter === 'all' ? undefined : statusFilter.toUpperCase(),
                page,
                limit: PAGE_SIZE,
            }),
    });

    const players = data?.players || [];
    const total = data?.pagination.total || 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    const { data: playerDetailData } = useQuery({
        queryKey: ['admin-player-detail', viewPlayerId],
        enabled: !!viewPlayerId,
        queryFn: () => getPlayer(viewPlayerId!),
        select: (res) => res.player,
    });

    const banMutation = useMutation({
        mutationFn: () => updatePlayerStatus(banPlayer.id, 'BANNED'),
        onSuccess: () => {
            toast.success(`${banPlayer.name} has been banned.`);
            setBanPlayer(null);
            setBanReason('');
            setBanNotes('');
            queryClient.invalidateQueries({ queryKey: ['admin-all-players'] });
        },
        onError: (err: any) => toast.error(err.message),
    });

    const unbanMutation = useMutation({
        mutationFn: (player: any) => updatePlayerStatus(player.id, 'ACTIVE'),
        onSuccess: (_, player) => {
            toast.success(`${player.name} has been unbanned.`);
            queryClient.invalidateQueries({ queryKey: ['admin-all-players'] });
        },
        onError: (err: any) => toast.error(err.message),
    });

    const exportCSV = () => {
        if (!players.length) return;
        const csv = [['Name', 'Phone', 'Status', 'Registered']]
            .concat(players.map((p: any) => [p.name, p.phone || '', p.status, new Date(p.createdAt).toLocaleDateString()]))
            .map((r) => r.map((v: any) => `"${v}"`).join(','))
            .join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = 'players.csv';
        a.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-3">
                    <div className="relative max-w-xs flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search players..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex gap-1 rounded-lg bg-muted p-0.5">
                        {['all', 'active', 'banned'].map((s) => (
                            <button
                                key={s}
                                onClick={() => { setStatusFilter(s); setPage(1); }}
                                className={cn(
                                    'rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors',
                                    statusFilter === s ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
                                )}
                            >
                                {s === 'all' ? 'All' : s}
                            </button>
                        ))}
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </div>

            <div className="rounded-xl bg-card shadow-sm">
                {isLoading ? (
                    <div className="space-y-3 p-6">
                        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : players.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Users className="h-12 w-12 text-muted-foreground/30" />
                        <p className="mt-4 text-sm font-medium text-muted-foreground">No players match your current filters.</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left">
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Player Name</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Phone</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Tier</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Registered</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {players.map((player: any) => {
                                        const isBanned = player.status === 'BANNED';
                                        return (
                                            <tr key={player.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                                <td className="px-4 py-3 font-medium">{player.name}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{player.phone || '—'}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{player.tier || '—'}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{new Date(player.createdAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-3"><StatusBadge status={player.status} /></td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1">
                                                        <Button size="sm" variant="ghost" onClick={() => setViewPlayerId(player.id)} title="View">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {isSuperAdmin && !isBanned && (
                                                            <Button size="sm" variant="ghost" onClick={() => setBanPlayer(player)} title="Ban">
                                                                <Ban className="h-4 w-4 text-[hsl(var(--admin-status-red))]" />
                                                            </Button>
                                                        )}
                                                        {isSuperAdmin && isBanned && (
                                                            <Button size="sm" variant="ghost" onClick={() => unbanMutation.mutate(player)} disabled={unbanMutation.isPending} title="Unban">
                                                                <ShieldCheck className="h-4 w-4 text-[hsl(var(--admin-status-lime))]" />
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
                        <div className="space-y-3 p-4 md:hidden">
                            {players.map((player: any) => (
                                <div key={player.id} className="rounded-lg border border-border p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">{player.name}</span>
                                        <StatusBadge status={player.status} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">{player.phone || '—'}</p>
                                    <Button size="sm" className="w-full" variant="outline" onClick={() => setViewPlayerId(player.id)}>
                                        View Profile
                                    </Button>
                                </div>
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-border px-4 py-3">
                                <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
                                <div className="flex gap-1">
                                    <Button size="icon" variant="ghost" onClick={() => setPage(page - 1)} disabled={page === 1}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Sheet open={!!viewPlayerId} onOpenChange={() => setViewPlayerId(null)}>
                <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader><SheetTitle>Player Profile</SheetTitle></SheetHeader>
                    {playerDetailData && (
                        <div className="mt-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-lg font-bold text-muted-foreground">
                                    {playerDetailData.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                                <div>
                                    <p className="font-semibold">{playerDetailData.name}</p>
                                    <p className="text-sm text-muted-foreground">{playerDetailData.phone || '—'}</p>
                                </div>
                            </div>
                            <div className="grid gap-3 grid-cols-2 text-sm">
                                <div><p className="text-xs text-muted-foreground">Phone</p><p>{playerDetailData.phone || '—'}</p></div>
                                <div><p className="text-xs text-muted-foreground">Registered</p><p>{new Date(playerDetailData.createdAt).toLocaleDateString()}</p></div>
                                <div><p className="text-xs text-muted-foreground">Bookings</p><p>{playerDetailData.bookings?.length ?? 0}</p></div>
                                <div><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={playerDetailData.status} /></div>
                            </div>
                            {playerDetailData.bookings?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold mb-3">Recent Bookings</h3>
                                    <div className="space-y-2">
                                        {playerDetailData.bookings.slice(0, 5).map((b: any) => (
                                            <div key={b.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                                                <div>
                                                    <p className="font-medium">{b.bookingDate || '—'}</p>
                                                    <p className="text-xs text-muted-foreground">{b.venue?.name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p>INR {b.finalAmount || b.totalAmount || 0}</p>
                                                    <StatusBadge status={b.status} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            <Dialog open={!!banPlayer} onOpenChange={() => setBanPlayer(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ban {banPlayer?.name}</DialogTitle>
                        <DialogDescription>Banning this player will prevent them from making new bookings.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Reason</label>
                            <Select value={banReason} onValueChange={setBanReason}>
                                <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
                                <SelectContent>
                                    {BAN_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Notes (optional)</label>
                            <Textarea value={banNotes} onChange={(e) => setBanNotes(e.target.value)} placeholder="Additional details..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBanPlayer(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => banMutation.mutate()} disabled={!banReason || banMutation.isPending}>
                            {banMutation.isPending ? 'Banning...' : 'Confirm Ban'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
