import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { cn } from '../../utils/twMerge';
import { listEventLedger } from '../../api/adapters/events';
import { Pager, StatCard, TableSkeleton } from './shared';
import { EVENT_LEDGER_LABEL, fmtDateTime, inr } from './format';

const PAGE_SIZE = 25;

/**
 * Ledger of tournament money. Scope it to everything (no props), one
 * tournament (`eventId`), or one host (`hostId`) — same table and totals.
 */
export default function EventLedger({ eventId, hostId }: { eventId?: string; hostId?: string }) {
    const [type, setType] = useState('all');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [page, setPage] = useState(1);

    const params = { eventId, hostId, type: type === 'all' ? undefined : type, from: from || undefined, to: to || undefined };
    const { data, isLoading } = useQuery({
        queryKey: ['admin-event-ledger', params, page],
        queryFn: () => listEventLedger({ ...params, page, limit: PAGE_SIZE }),
    });

    const entries = data?.entries ?? [];
    const s = data?.summary;
    const showEvent = !eventId;
    const showHost = !eventId && !hostId;

    const exportCsv = () => {
        if (!entries.length) return;
        const rows = entries.map((e) => [
            new Date(e.createdAt).toISOString(),
            EVENT_LEDGER_LABEL[e.type]?.label ?? e.type,
            e.event?.title ?? '',
            e.event?.hostName ?? '',
            e.player?.name ?? '',
            e.payout?.reference ?? e.razorpayRef ?? '',
            e.amount,
            e.memo ? 'memo' : '',
        ]);
        const csv = [['Date', 'Type', 'Tournament', 'Host', 'Player', 'Reference', 'Amount (INR)', 'Note'], ...rows]
            .map((r) => r.map((v) => `"${v}"`).join(','))
            .join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = 'event-ledger.csv';
        a.click();
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
                <StatCard label="Entry fees collected" value={s && inr(s.collected, { decimals: true })} loading={isLoading} />
                <StatCard label="Payment gateway fee + GST" value={s && inr(s.gatewayFees + s.gatewayGst, { decimals: true })} loading={isLoading} />
                <StatCard label="Platform fee + GST" value={s && inr(s.platformFees + s.platformGst, { decimals: true })} loading={isLoading} />
                <StatCard label="Total GST" value={s && inr(s.gatewayGst + s.platformGst, { decimals: true })} loading={isLoading} />
                <StatCard label="Paid to hosts" value={s && inr(s.paidToHosts, { decimals: true })} loading={isLoading} />
                <StatCard label="Still in our account" value={s && inr(s.heldForHosts, { decimals: true })} hint="Host shares not yet paid + our fee & GST" loading={isLoading} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
                    <SelectTrigger className="h-8 w-[190px] text-xs"><SelectValue placeholder="All entries" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All entries</SelectItem>
                        {Object.entries(EVENT_LEDGER_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="h-8 w-36 text-xs" />
                <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="h-8 w-36 text-xs" />
                <div className="ml-auto">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportCsv}>
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Export
                    </Button>
                </div>
            </div>

            <div className="rounded-xl bg-card shadow-sm">
                {isLoading ? (
                    <TableSkeleton />
                ) : entries.length === 0 ? (
                    <p className="py-14 text-center text-sm text-muted-foreground">No ledger entries for this view yet.</p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left">
                                        {['Date', 'Type', ...(showEvent ? ['Tournament'] : []), ...(showHost ? ['Host'] : []), 'Player', 'Reference', 'Amount'].map((h) => (
                                            <th key={h} className={cn('whitespace-nowrap px-4 py-3 font-medium text-muted-foreground', h === 'Amount' && 'text-right')}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((e) => {
                                        const label = EVENT_LEDGER_LABEL[e.type] ?? { label: e.type, cls: 'bg-muted text-muted-foreground' };
                                        const neg = e.amount < 0;
                                        return (
                                            <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{fmtDateTime(e.createdAt)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={cn('whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', label.cls)}>{label.label}</span>
                                                </td>
                                                {showEvent && (
                                                    <td className="px-4 py-3">
                                                        {e.event ? <Link to={`/admin/events/${e.event.id}?tab=ledger`} className="font-medium hover:underline">{e.event.title}</Link> : '—'}
                                                    </td>
                                                )}
                                                {showHost && (
                                                    <td className="px-4 py-3">
                                                        {e.event ? <Link to={`/admin/event-hosts/${e.event.hostId}`} className="text-muted-foreground hover:underline">{e.event.hostName}</Link> : '—'}
                                                    </td>
                                                )}
                                                <td className="px-4 py-3">{e.player?.name ?? '—'}</td>
                                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.payout?.reference || e.razorpayRef || '—'}</td>
                                                <td className={cn('whitespace-nowrap px-4 py-3 text-right font-semibold', e.memo ? 'text-muted-foreground' : neg ? 'text-red-500' : 'text-[hsl(var(--admin-status-lime))]')}>
                                                    {e.memo ? '' : neg ? '−' : '+'}
                                                    {inr(Math.abs(e.amount), { decimals: true })}
                                                    {e.memo && <span className="ml-1 text-[10px] font-normal uppercase">memo</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <Pager page={page} total={data?.pagination.total ?? 0} pageSize={PAGE_SIZE} onPage={setPage} />
                    </>
                )}
            </div>
            <p className="px-1 text-xs text-muted-foreground">
                Memo rows (platform fee, GST) are taken out of the money already held for the host, so they don't move cash on their own.
            </p>
        </div>
    );
}
