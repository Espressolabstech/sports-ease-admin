import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ChevronLeft, ChevronRight, Download, Vault, TrendingUp, ArrowUpRight } from 'lucide-react';
import { listLedger, getLedgerSummary } from '../../api/adapters/ledger';
import { listVenues } from '../../api/adapters/venues';
import { cn } from '../../utils/twMerge';

const PAGE_SIZE = 25;

interface Props {
    isManager: boolean;
}

function getPlayerName(entry: any): string {
    return (
        entry.booking?.user?.name ||
        entry.packagePurchase?.user?.name ||
        entry.walletTxn?.wallet?.user?.name ||
        '—'
    );
}

function entryStatus(type: string): { label: string; cls: string } {
    switch (type) {
        case 'BOOKING_PAYMENT_COLLECTED': return { label: 'Collected', cls: 'bg-green-100 text-green-700' };
        case 'CREDIT_PACKAGE_COLLECTED': return { label: 'Package', cls: 'bg-blue-100 text-blue-700' };
        case 'COMMISSION_EARNED': return { label: 'Commission', cls: 'bg-purple-100 text-purple-700' };
        case 'VENUE_PAYOUT': return { label: 'Payout', cls: 'bg-orange-100 text-orange-700' };
        case 'REFUND_TO_USER': return { label: 'Refund', cls: 'bg-red-100 text-red-700' };
        case 'WALLET_CREDIT_ISSUED': return { label: 'Wallet Credit', cls: 'bg-indigo-100 text-indigo-700' };
        case 'BOOKING_PAYMENT_FAILED': return { label: 'Failed', cls: 'bg-red-100 text-red-700' };
        default: return { label: type.replace(/_/g, ' '), cls: 'bg-muted text-muted-foreground' };
    }
}

export default function CashLedgerTab({ isManager: _isManager }: Props) {
    const [page, setPage] = useState(1);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [venueFilter, setVenueFilter] = useState('all');

    const resetPage = () => setPage(1);

    const { data: summary } = useQuery({
        queryKey: ['admin-ledger-summary'],
        queryFn: () => getLedgerSummary(),
    });

    const { data: venuesData } = useQuery({
        queryKey: ['admin-venues-dropdown'],
        queryFn: () => listVenues({ limit: 200 }),
        select: (res) => res.venues,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['admin-ledger', page, from, to, venueFilter],
        queryFn: () =>
            listLedger({
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
        const headers = ['Date', 'Type', 'Venue', 'Player', 'Amount (INR)', 'Reference'];
        const rows = entries.map((e: any) => [
            e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '',
            e.type,
            e.venue?.name || '',
            getPlayerName(e),
            Math.abs(Number(e.amount)),
            e.booking?.bookingRef || e.razorpayRef || '',
        ]);
        const csv = [headers, ...rows].map((r) => r.map((v: any) => `"${v}"`).join(',')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = 'cash-ledger.csv';
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-card p-5 shadow-sm flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                        <Vault className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Total in Escrow</p>
                        {summary ? (
                            <p className="text-2xl font-bold mt-0.5">₹{Number(summary.totalInEscrow).toLocaleString()}</p>
                        ) : <Skeleton className="h-7 w-28 mt-1" />}
                    </div>
                </div>
                <div className="rounded-xl bg-card p-5 shadow-sm flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Commission Earned</p>
                        {summary ? (
                            <p className="text-2xl font-bold mt-0.5">₹{Number(summary.commissionEarned).toLocaleString()}</p>
                        ) : <Skeleton className="h-7 w-28 mt-1" />}
                    </div>
                </div>
                <div className="rounded-xl bg-card p-5 shadow-sm flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                        <ArrowUpRight className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Total Paid Out</p>
                        {summary ? (
                            <p className="text-2xl font-bold mt-0.5">₹{Number(summary.totalPaidOut).toLocaleString()}</p>
                        ) : <Skeleton className="h-7 w-28 mt-1" />}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <Input
                    type="date"
                    value={from}
                    onChange={(e) => { setFrom(e.target.value); resetPage(); }}
                    className="h-8 w-36 text-xs"
                    placeholder="From"
                />
                <Input
                    type="date"
                    value={to}
                    onChange={(e) => { setTo(e.target.value); resetPage(); }}
                    className="h-8 w-36 text-xs"
                    placeholder="To"
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
                        <p className="text-sm font-medium text-muted-foreground">No ledger entries found.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left">
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Timestamp</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Reference</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Venue</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Player</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground text-right">Amount</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((entry: any) => {
                                        const amount = Number(entry.amount);
                                        const isNeg = amount < 0;
                                        const status = entryStatus(entry.type);
                                        return (
                                            <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                                    {entry.createdAt ? new Date(entry.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                                    {entry.type.replace(/_/g, ' ')}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                                    {entry.booking?.bookingRef || entry.razorpayRef || '—'}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{entry.venue?.name || '—'}</td>
                                                <td className="px-4 py-3">{getPlayerName(entry)}</td>
                                                <td className={cn('px-4 py-3 font-semibold text-right', isNeg ? 'text-red-500' : 'text-[hsl(var(--admin-status-lime))]')}>
                                                    {isNeg ? '−' : '+'}₹{Math.abs(amount).toLocaleString()}
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
