import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ChevronLeft, ChevronRight, Download, Vault, TrendingUp, ArrowUpRight, Trophy, Percent, Banknote } from 'lucide-react';
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
        entry.eventEntrant?.name ||
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
        case 'EVENT_ENTRY_COLLECTED': return { label: 'Tournament entry', cls: 'bg-green-100 text-green-700' };
        case 'EVENT_GATEWAY_FEE': return { label: 'Gateway fee', cls: 'bg-orange-100 text-orange-700' };
        case 'EVENT_COMMISSION_EARNED': return { label: 'Platform fee', cls: 'bg-purple-100 text-purple-700' };
        case 'EVENT_GST': return { label: 'GST', cls: 'bg-slate-100 text-slate-700' };
        case 'EVENT_HOST_PAYOUT': return { label: 'Host payout', cls: 'bg-blue-100 text-blue-700' };
        case 'EVENT_PAYOUT_REVERSED': return { label: 'Payout reversed', cls: 'bg-red-100 text-red-700' };
        default: return { label: type.replace(/_/g, ' '), cls: 'bg-muted text-muted-foreground' };
    }
}

// Rows that record a figure (fee, GST) without moving cash.
const MEMO_TYPES = new Set(['EVENT_COMMISSION_EARNED', 'EVENT_GST']);

const TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: 'BOOKING_PAYMENT_COLLECTED', label: 'Booking payments' },
    { value: 'CREDIT_PACKAGE_COLLECTED', label: 'Credit packages' },
    { value: 'COMMISSION_EARNED', label: 'Venue commission' },
    { value: 'VENUE_PAYOUT', label: 'Venue payouts' },
    { value: 'REFUND_TO_USER', label: 'Refunds' },
    { value: 'EVENT_ENTRY_COLLECTED', label: 'Tournament entries' },
    { value: 'EVENT_GATEWAY_FEE', label: 'Tournament gateway fees' },
    { value: 'EVENT_COMMISSION_EARNED', label: 'Tournament platform fees' },
    { value: 'EVENT_GST', label: 'Tournament GST' },
    { value: 'EVENT_HOST_PAYOUT', label: 'Host payouts' },
    { value: 'EVENT_PAYOUT_REVERSED', label: 'Host payout reversals' },
];

export default function CashLedgerTab({ isManager: _isManager }: Props) {
    const [page, setPage] = useState(1);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [venueFilter, setVenueFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

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
        queryKey: ['admin-ledger', page, from, to, venueFilter, typeFilter],
        queryFn: () =>
            listLedger({
                page,
                limit: PAGE_SIZE,
                from: from || undefined,
                to: to || undefined,
                venueId: venueFilter === 'all' ? undefined : venueFilter,
                type: typeFilter === 'all' ? undefined : typeFilter,
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
        const headers = ['Date', 'Type', 'Venue / Tournament', 'Player', 'Amount (INR)', 'Reference'];
        const rows = entries.map((e: any) => [
            e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '',
            e.type,
            e.venue?.name || e.event?.title || '',
            getPlayerName(e),
            Math.abs(Number(e.amount)),
            e.booking?.bookingRef || e.eventPayout?.reference || e.razorpayRef || '',
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

            {/* Tournament money */}
            <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Trophy className="h-3.5 w-3.5" /> Tournaments
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                    {[
                        { label: 'Entry fees collected', value: summary?.events?.collected, icon: Banknote, bg: 'bg-green-50', fg: 'text-green-500' },
                        { label: 'Platform fees earned', value: summary?.events?.platformFees, icon: Percent, bg: 'bg-purple-50', fg: 'text-purple-500' },
                        { label: 'Paid to hosts', value: summary?.events?.paidToHosts, icon: ArrowUpRight, bg: 'bg-blue-50', fg: 'text-blue-500' },
                    ].map((c) => (
                        <div key={c.label} className="rounded-xl bg-card p-5 shadow-sm flex items-start gap-4">
                            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', c.bg)}>
                                <c.icon className={cn('h-5 w-5', c.fg)} />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">{c.label}</p>
                                {summary ? (
                                    <p className="text-2xl font-bold mt-0.5">₹{Number(c.value ?? 0).toLocaleString()}</p>
                                ) : <Skeleton className="h-7 w-28 mt-1" />}
                            </div>
                        </div>
                    ))}
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
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); resetPage(); }}>
                    <SelectTrigger className="h-8 w-[200px] text-xs">
                        <SelectValue placeholder="All entry types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All entry types</SelectItem>
                        {TYPE_OPTIONS.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
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
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Venue / Tournament</th>
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
                                                    {entry.booking?.bookingRef || entry.eventPayout?.reference || entry.razorpayRef || '—'}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {entry.venue?.name || (entry.event ? (
                                                        <Link to={`/admin/events/${entry.event.id}?tab=ledger`} className="hover:underline">{entry.event.title}</Link>
                                                    ) : '—')}
                                                </td>
                                                <td className="px-4 py-3">{getPlayerName(entry)}</td>
                                                <td className={cn('px-4 py-3 font-semibold text-right', MEMO_TYPES.has(entry.type) ? 'text-muted-foreground' : isNeg ? 'text-red-500' : 'text-[hsl(var(--admin-status-lime))]')}>
                                                    {MEMO_TYPES.has(entry.type) ? '' : isNeg ? '−' : '+'}₹{Math.abs(amount).toLocaleString()}
                                                    {MEMO_TYPES.has(entry.type) && <span className="ml-1 text-[10px] font-normal uppercase">memo</span>}
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
