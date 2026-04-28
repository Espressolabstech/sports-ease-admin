import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Building2, ChevronLeft, ChevronRight, Download, Eye, Search, ShieldCheck, ShieldOff,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { cn } from '../../utils/twMerge';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { listVenues, updateVenueStatus } from '../../api/adapters/venues';

const PAGE_SIZE = 25;
const STATUS_TABS = ['ALL', 'ACTIVE', 'PENDING', 'INACTIVE', 'BANNED'];
const SUSPEND_REASONS = ['Policy Violation', 'Venue Request', 'Payment Issue', 'Fraudulent Activity', 'Other'];

const Venues = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [suspendVenue, setSuspendVenue] = useState<any>(null);
    const [suspendReason, setSuspendReason] = useState('');
    const [suspendNotes, setSuspendNotes] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['admin-all-venues', statusFilter, searchQuery, page],
        queryFn: () =>
            listVenues({
                status: statusFilter === 'ALL' ? undefined : statusFilter,
                search: searchQuery || undefined,
                page,
                limit: PAGE_SIZE,
            }),
    });

    const venues = data?.venues || [];
    const total = data?.pagination.total || 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    const suspendMutation = useMutation({
        mutationFn: () => updateVenueStatus(suspendVenue.id, 'BANNED', `${suspendReason}. ${suspendNotes}`.trim()),
        onSuccess: () => {
            toast.success(`${suspendVenue.name} has been suspended.`);
            setSuspendVenue(null);
            setSuspendReason('');
            setSuspendNotes('');
            queryClient.invalidateQueries({ queryKey: ['admin-all-venues'] });
        },
        onError: (err: any) => toast.error(err.message),
    });

    const reinstateMutation = useMutation({
        mutationFn: (venue: any) => updateVenueStatus(venue.id, 'ACTIVE'),
        onSuccess: (_, venue) => {
            toast.success(`${venue.name} has been reinstated.`);
            queryClient.invalidateQueries({ queryKey: ['admin-all-venues'] });
        },
        onError: (err: any) => toast.error(err.message),
    });

    const exportCSV = () => {
        if (!venues.length) return;
        const headers = ['Venue Name', 'City', 'Status', 'Commission', 'Date Joined'];
        const csvRows = venues.map((v: any) => [
            v.name, v.city, v.status, v.commissionRate, new Date(v.createdAt).toLocaleDateString(),
        ]);
        const csv = [headers, ...csvRows].map((row) => row.map((c: any) => `"${c}"`).join(',')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = 'venues.csv';
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Status filter chips */}
            <div className="flex flex-wrap gap-2">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { setStatusFilter(tab); setPage(1); }}
                        className={cn(
                            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors capitalize',
                            statusFilter === tab
                                ? 'bg-[hsl(var(--admin-navy))] text-[hsl(var(--admin-navy-foreground))]'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80',
                        )}
                    >
                        {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-xs flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search venues..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        className="pl-9"
                    />
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
                ) : venues.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Building2 className="h-12 w-12 text-muted-foreground/30" />
                        <p className="mt-4 text-sm font-medium text-muted-foreground">No venues match your current filters.</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left">
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Venue</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">City</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Commission</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Date Joined</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {venues.map((venue: any) => (
                                        <tr key={venue.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                                                        {venue.name?.charAt(0)}
                                                    </div>
                                                    <span className="font-medium">{venue.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{venue.city}</td>
                                            <td className="px-4 py-3">{venue.commissionRate}%</td>
                                            <td className="px-4 py-3"><StatusBadge status={venue.status} /></td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {new Date(venue.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/venues/${venue.id}`)} title="View">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {venue.status === 'ACTIVE' && (
                                                        <Button size="sm" variant="ghost" onClick={() => setSuspendVenue(venue)} title="Suspend">
                                                            <ShieldOff className="h-4 w-4 text-[hsl(var(--admin-status-red))]" />
                                                        </Button>
                                                    )}
                                                    {venue.status === 'BANNED' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => reinstateMutation.mutate(venue)}
                                                            disabled={reinstateMutation.isPending}
                                                            title="Reinstate"
                                                        >
                                                            <ShieldCheck className="h-4 w-4 text-[hsl(var(--admin-status-lime))]" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="space-y-3 p-4 md:hidden">
                            {venues.map((venue: any) => (
                                <div key={venue.id} className="rounded-lg border border-border p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">{venue.name}</span>
                                        <StatusBadge status={venue.status} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">{venue.city}</p>
                                    <Button size="sm" className="w-full" variant="outline" onClick={() => navigate(`/admin/venues/${venue.id}`)}>
                                        View
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

            <Dialog open={!!suspendVenue} onOpenChange={() => setSuspendVenue(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Suspend {suspendVenue?.name}</DialogTitle>
                        <DialogDescription>This will immediately remove the venue from public listings.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Reason</label>
                            <Select value={suspendReason} onValueChange={setSuspendReason}>
                                <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
                                <SelectContent>
                                    {SUSPEND_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Notes (optional)</label>
                            <Textarea value={suspendNotes} onChange={(e) => setSuspendNotes(e.target.value)} placeholder="Additional details..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSuspendVenue(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => suspendMutation.mutate()} disabled={!suspendReason || suspendMutation.isPending}>
                            {suspendMutation.isPending ? 'Suspending...' : 'Confirm Suspend'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Venues;
