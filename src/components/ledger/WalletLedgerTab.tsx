import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { listWalletLedger } from '../../api/adapters/ledger';
import { listVenues } from '../../api/adapters/venues';
import { cn } from '../../utils/twMerge';

const PAGE_SIZE = 25;

interface Props {
    isManager: boolean;
}

function txnStatus(type: string, source: string): { label: string; cls: string } {
    if (type === 'DEBIT') return { label: 'Debit', cls: 'bg-red-100 text-red-700' };
    switch (source) {
        case 'PACKAGE_PURCHASE': return { label: 'Package', cls: 'bg-blue-100 text-blue-700' };
        case 'REFUND': return { label: 'Refund', cls: 'bg-orange-100 text-orange-700' };
        case 'PROMO': return { label: 'Promo', cls: 'bg-purple-100 text-purple-700' };
        case 'ADMIN_ADJUSTMENT': return { label: 'Admin Adj.', cls: 'bg-indigo-100 text-indigo-700' };
        default: return { label: 'Credit', cls: 'bg-green-100 text-green-700' };
    }
}

export default function WalletLedgerTab({ isManager: _isManager }: Props) {
    const [page, setPage] = useState(1);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [venueFilter, setVenueFilter] = useState('all');

    const resetPage = () => setPage(1);

    const { data: venuesData } = useQuery({
        queryKey: ['admin-venues-dropdown'],
        queryFn: () => listVenues({ limit: 200 }),
        select: (res) => res.venues,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['admin-wallet-ledger', page, from, to, venueFilter],
        queryFn: () =>
            listWalletLedger({
                page,
                limit: PAGE_SIZE,
                from: from || undefined,
                to: to || undefined,
                venueId: venueFilter === 'all' ? undefined : venueFilter,
            }),
    });

    const entries = data?.entries || [];
    const total = data?.pagination.total || 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    const setThisMonth = () => {
        const now = new Date();
        setFrom(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
        setTo(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
        resetPage();
    };

    const exportCSV = () => {
        if (!entries.length) return;
        const headers = ['Date', 'Type', 'Source', 'Player', 'Venue', 'Amount (INR)', 'Balance After'];
        const rows = entries.map((e: any) => [
            e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '',
            e.type,
            e.source,
            e.wallet?.user?.name || '',
            e.wallet?.venue?.name || '',
            Number(e.amount),
            Number(e.balanceAfter),
        ]);
        const csv = [headers, ...rows].map((r) => r.map((v: any) => `"${v}"`).join(',')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = 'wallet-ledger.csv';
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <Input
                    type="date"
                    value={from}
                    onChange={(e) => { setFrom(e.target.value); resetPage(); }}
                    className="h-8 w-36 text-xs"
                />
                <Input
                    type="date"
                    value={to}
                    onChange={(e) => { setTo(e.target.value); resetPage(); }}
                    className="h-8 w-36 text-xs"
                />
                <Button variant="ghost" size="sm" className="h-8 text-xs text-primary" onClick={setThisMonth}>
                    This Month
                </Button>
                <Select value={venueFilter} onValueChange={(v) => { setVenueFilter(v); resetPage(); }}>
                    <SelectTrigger className="h-8 w-[180px] text-xs">
                        <SelectValue placeholder="All Venues" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Venues</SelectItem>
                        {(venuesData || []).map((v: any) => (
                            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="ml-auto">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportCSV}>
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Export
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl bg-card shadow-sm">
                {isLoading ? (
                    <div className="space-y-3 p-6">
                        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <p className="text-sm font-medium text-muted-foreground">No wallet ledger entries found.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left">
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Timestamp</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Source</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Player</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Venue</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground text-right">Amount</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground text-right">Balance After</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((entry: any) => {
                                        const amount = Number(entry.amount);
                                        const isDebit = entry.type === 'DEBIT';
                                        const status = txnStatus(entry.type, entry.source);
                                        return (
                                            <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                                    {entry.createdAt ? new Date(entry.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                                    {entry.source?.replace(/_/g, ' ') || '—'}
                                                </td>
                                                <td className="px-4 py-3">{entry.wallet?.user?.name || '—'}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{entry.wallet?.venue?.name || '—'}</td>
                                                <td className={cn('px-4 py-3 font-semibold text-right', isDebit ? 'text-red-500' : 'text-[hsl(var(--admin-status-lime))]')}>
                                                    {isDebit ? '−' : '+'}₹{Math.abs(amount).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-right text-muted-foreground">
                                                    ₹{Number(entry.balanceAfter).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', status.cls)}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-border px-4 py-3">
                                <p className="text-xs text-muted-foreground">Page {page} of {totalPages} · {total} entries</p>
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
        </div>
    );
}
