import { useState } from 'react';
import { toast } from 'sonner';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, Banknote, CalendarDays, Hourglass, MapPin, Percent, Users, Wallet } from 'lucide-react';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { createEventPayout, getEventDetail, voidEventPayout, type EventPayoutRecord } from '../../api/adapters/events';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import EventLedger from './EventLedger';
import HostViewersPanel from './HostViewersPanel';
import { FinancialBreakdown, PayoutBadge, PillTabs, Row, StatCard } from './shared';
import { fmtDate, fmtDateTime, inr } from './format';

type Tab = 'overview' | 'players' | 'financials' | 'payouts' | 'ledger';

const PAYOUT_METHODS = ['Bank transfer', 'UPI', 'Cash', 'Other'];
const lime = 'bg-[hsl(var(--admin-lime))] text-[hsl(var(--admin-lime-foreground))] hover:bg-[hsl(var(--admin-lime))]/90';
type PlayerFilter = 'all' | 'confirmed' | 'waitlist' | 'attention';

const time12 = (hhmm: string | null) => {
    if (!hhmm) return '—';
    const [h, m] = hhmm.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

export default function AdminEventDetailPage() {
    const { eventId } = useParams();
    const [params, setParams] = useSearchParams();
    const tab = (params.get('tab') as Tab) || 'overview';
    const [playerFilter, setPlayerFilter] = useState<PlayerFilter>('all');

    const queryClient = useQueryClient();
    const { can } = useAdminAuth();
    const [payoutOpen, setPayoutOpen] = useState(false);
    const [voiding, setVoiding] = useState<EventPayoutRecord | null>(null);
    const [voidReason, setVoidReason] = useState('');
    const [form, setForm] = useState({ method: 'Bank transfer', reference: '', notes: '', paidAt: new Date().toISOString().slice(0, 10) });

    const { data, isLoading } = useQuery({
        queryKey: ['admin-event-detail', eventId],
        queryFn: () => getEventDetail(eventId!),
        enabled: !!eventId,
    });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['admin-event-detail', eventId] });
        queryClient.invalidateQueries({ queryKey: ['admin-events-list'] });
        queryClient.invalidateQueries({ queryKey: ['admin-events-summary'] });
        queryClient.invalidateQueries({ queryKey: ['admin-event-ledger'] });
    };
    const payoutMutation = useMutation({
        mutationFn: () =>
            createEventPayout(eventId!, {
                method: form.method,
                reference: form.reference.trim() || undefined,
                notes: form.notes.trim() || undefined,
                paidAt: form.paidAt || undefined,
            }),
        onSuccess: () => {
            toast.success('Payout marked as done and added to the ledger.');
            setPayoutOpen(false);
            refresh();
        },
        onError: (err: any) => toast.error(err.message || 'Could not record payout'),
    });
    const voidMutation = useMutation({
        mutationFn: () => voidEventPayout(voiding!.id, voidReason.trim()),
        onSuccess: () => {
            toast.success('Payout voided — a reversal was added to the ledger.');
            setVoiding(null);
            setVoidReason('');
            refresh();
        },
        onError: (err: any) => toast.error(err.message || 'Could not void payout'),
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-72" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }
    if (!data) {
        return <div className="rounded-xl bg-card py-16 text-center text-sm text-muted-foreground shadow-sm">Tournament not found.</div>;
    }

    const { event, host, stats, financials, entrants, play, rates, payout, payouts } = data;
    const canPay = can('events.payouts') && payout.canPayout;
    const payoutBlockedReason = !can('events.payouts')
        ? "Your role can't record payouts."
        : payout.status === 'PAID'
          ? 'Already paid — nothing left to record.'
          : payout.status === 'NOTHING_DUE'
            ? 'Nothing to pay — no online payments were collected for this tournament.'
            : event.phase !== 'COMPLETED'
              ? 'Available once the tournament is finished. Online collections are held by the platform until then.'
              : null;
    const openPayoutDialog = () => {
        setForm({ method: 'Bank transfer', reference: '', notes: '', paidAt: new Date().toISOString().slice(0, 10) });
        setPayoutOpen(true);
    };
    const filtered = entrants.filter((e) =>
        playerFilter === 'confirmed' ? !e.waitlisted : playerFilter === 'waitlist' ? e.waitlisted : playerFilter === 'attention' ? e.needsAttention : true,
    );
    const attention = entrants.filter((e) => e.needsAttention).length;

    return (
        <div className="space-y-6">
            <div>
                <Link to="/admin/events?tab=tournaments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> All tournaments
                </Link>
                <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-bold text-foreground">{event.title}</h1>
                            <StatusBadge status={event.phase} />
                            <PayoutBadge status={payout.status} />
                            {canPay && (
                                <Button size="sm" className={`ml-2 ${lime}`} onClick={openPayoutDialog}>
                                    Mark payout done · {inr(payout.balanceDue)}
                                </Button>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Hosted by{' '}
                            <Link to={`/admin/event-hosts/${host.id}`} className="font-medium text-foreground underline-offset-2 hover:underline">
                                {host.name}
                            </Link>{' '}
                            · {host.phone}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{fmtDate(event.eventDate)} · {time12(event.time)} – {time12(event.endTime)}</span>
                            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.venueName}{event.venueArea ? `, ${event.venueArea}` : ''}</span>
                        </div>
                    </div>
                </div>
            </div>

            {attention > 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-[hsl(var(--admin-status-amber))]/30 bg-[hsl(var(--admin-status-amber))]/10 p-4">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--admin-status-amber))]" />
                    <p className="text-sm text-foreground">
                        <span className="font-semibold">{attention} player(s)</span> paid online but are on the waitlist — the host needs to promote them or they need a refund.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
                <StatCard label="Confirmed" value={`${stats.registered}/${event.capacity}`} icon={Users} tone="text-[hsl(var(--admin-lime))]" hint={`${stats.checkedIn} checked in`} />
                <StatCard label="Waitlisted" value={stats.waitlisted} icon={Hourglass} tone="text-[hsl(var(--admin-status-amber))]" />
                <StatCard label="Online collected" value={inr(financials.onlineGross)} icon={Banknote} tone="text-[hsl(var(--admin-lime))]" hint={`${stats.paidOnline} payments`} />
                <StatCard label="Platform fee" value={inr(financials.platformFee, { decimals: true })} icon={Percent} tone="text-[hsl(var(--admin-lime))]" />
                <StatCard label="Payable to host" value={inr(financials.hostNetPayable, { decimals: true })} icon={Wallet} tone="text-[hsl(var(--admin-status-blue))]" />
                <StatCard label="Outstanding" value={inr(financials.outstanding)} hint={`${stats.unpaid} unpaid`} />
            </div>

            <PillTabs
                tabs={[
                    { key: 'overview', label: 'Overview' },
                    { key: 'players', label: `Players (${entrants.length})` },
                    { key: 'financials', label: 'Financials' },
                    { key: 'payouts', label: 'Host payout' },
                    { key: 'ledger', label: 'Ledger' },
                ]}
                value={tab}
                onChange={(t) => setParams({ tab: t })}
            />

            {tab === 'overview' && (
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-xl bg-card p-6 shadow-sm">
                        <h2 className="mb-2 text-sm font-semibold">Tournament details</h2>
                        <div className="divide-y divide-border">
                            <Row label="Sport" value={event.sport} />
                            <Row label="Format" value={event.format} />
                            <Row label="Skill level" value={event.skillLevel} />
                            <Row label="Courts" value={event.courts} />
                            <Row label="Points per match" value={`${event.pointsPerRound}${event.goldenPoint ? ' · Game winner on' : ''}`} />
                            <Row label="Round length" value={`${event.roundMinutes} min`} />
                            <Row label="Entry fee" value={inr(event.priceInr)} />
                            <Row label="Host UPI" value={event.upiId || '—'} />
                            <Row label="Created" value={fmtDateTime(event.createdAt)} />
                            <Row label="Started" value={event.startedAt ? fmtDateTime(event.startedAt) : 'Not started'} />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="rounded-xl bg-card p-6 shadow-sm">
                            <h2 className="mb-2 text-sm font-semibold">Play progress</h2>
                            <div className="divide-y divide-border">
                                <Row label="Total matches" value={play.totalMatches} />
                                <Row label="Completed" value={play.matches.completed} />
                                <Row label="On court now" value={play.matches.active} />
                                <Row label="Upcoming" value={play.matches.queued} />
                                {play.rounds > 0 && <Row label="Rounds drawn / closed" value={`${play.rounds} / ${play.closedRounds}${event.plannedRounds ? ` (of ${event.plannedRounds})` : ''}`} />}
                            </div>
                        </div>
                        {event.description && (
                            <div className="rounded-xl bg-card p-6 shadow-sm">
                                <h2 className="mb-2 text-sm font-semibold">Description</h2>
                                <p className="text-sm leading-relaxed text-muted-foreground">{event.description}</p>
                            </div>
                        )}
                        {can('events.manage') && eventId && <HostViewersPanel eventId={eventId} />}
                    </div>
                </div>
            )}

            {tab === 'players' && (
                <div className="space-y-4">
                    <PillTabs
                        tabs={[
                            { key: 'all', label: 'All' },
                            { key: 'confirmed', label: `Confirmed (${stats.registered})` },
                            { key: 'waitlist', label: `Waitlist (${stats.waitlisted})` },
                            ...(attention > 0 ? [{ key: 'attention' as PlayerFilter, label: `Needs attention (${attention})` }] : []),
                        ]}
                        value={playerFilter}
                        onChange={setPlayerFilter}
                    />
                    <div className="rounded-xl bg-card shadow-sm">
                        {filtered.length === 0 ? (
                            <p className="py-14 text-center text-sm text-muted-foreground">No players in this view.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border text-left">
                                            {['Player', 'Phone', 'Status', 'Payment', 'Source', 'Registered', 'Razorpay order'].map((h) => (
                                                <th key={h} className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((p) => (
                                            <tr key={p.id} className="border-b border-border last:border-0">
                                                <td className="px-4 py-3 font-medium">{p.name}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{p.phone ?? '—'}</td>
                                                <td className="px-4 py-3">
                                                    {p.waitlisted ? (
                                                        <StatusBadge status={`Waitlist #${p.waitlistPosition}`} variant="amber" />
                                                    ) : p.checkedIn ? (
                                                        <StatusBadge status="Checked in" variant="lime" />
                                                    ) : (
                                                        <StatusBadge status="Registered" variant="blue" />
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {p.paymentMethod === 'ONLINE' ? (
                                                        <StatusBadge status="Paid online" variant="lime" />
                                                    ) : p.paymentMethod === 'OFFLINE' ? (
                                                        <StatusBadge status="Paid direct" variant="blue" />
                                                    ) : p.waitlisted ? (
                                                        <span className="text-xs text-muted-foreground">Nothing due</span>
                                                    ) : (
                                                        <StatusBadge status="Unpaid" variant="red" />
                                                    )}
                                                    {p.needsAttention && <span className="ml-2 text-xs font-medium text-[hsl(var(--admin-status-amber))]">Promote or refund</span>}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{p.source === 'WALK_IN' ? 'Walk-in' : 'Online signup'}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{fmtDateTime(p.registeredAt)}</td>
                                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.razorpayOrderId ?? '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {tab === 'financials' && (
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-xl bg-card p-6 shadow-sm">
                        <h2 className="mb-3 text-sm font-semibold">Financial breakdown</h2>
                        <FinancialBreakdown financials={financials} rates={rates} priceNote={`${inr(event.priceInr)} per player`} />
                    </div>
                    <div className="rounded-xl bg-card p-6 shadow-sm">
                        <h2 className="mb-2 text-sm font-semibold">Payment status of players</h2>
                        <div className="divide-y divide-border">
                            <Row label="Paid online (through the platform)" value={stats.paidOnline} />
                            <Row label="Paid directly to host" value={stats.paidOffline} />
                            <Row label="Confirmed but unpaid" value={stats.unpaid} />
                            <Row label="Waitlisted" value={stats.waitlisted} />
                            <Row label="Paid online but waitlisted" value={stats.paidWaitlisted} strong={stats.paidWaitlisted > 0} />
                        </div>
                        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                            Only online payments flow through the platform, so only those carry the platform fee, gateway fee and GST. Cash and
                            direct payments are recorded as collected by the host and are shown for reference.
                        </p>
                    </div>
                </div>
            )}
            {tab === 'payouts' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <StatCard label="Payable to host" value={inr(financials.hostNetPayable, { decimals: true })} hint="Online collections net of fees & GST" />
                        <StatCard label="Paid so far" value={inr(payout.paid, { decimals: true })} />
                        <StatCard label="Balance due" value={inr(payout.balanceDue, { decimals: true })} />
                        <div className="rounded-xl bg-card p-5 shadow-sm">
                            <span className="text-xs font-medium text-muted-foreground">Payout status</span>
                            <div className="mt-3"><PayoutBadge status={payout.status} /></div>
                            <Button size="sm" className={`mt-3 ${lime}`} onClick={openPayoutDialog} disabled={!canPay}>
                                Mark payout as done
                            </Button>
                            {payoutBlockedReason && <p className="mt-2 text-xs text-muted-foreground">{payoutBlockedReason}</p>}
                        </div>
                    </div>

                    <div className="rounded-xl bg-card p-6 shadow-sm">
                        <h2 className="mb-1 text-sm font-semibold">How host payouts work</h2>
                        <p className="text-sm text-muted-foreground">
                            Players pay through Razorpay, which settles into the platform's bank account — the platform holds that money.
                            Once the tournament is finished, transfer the host's share ({inr(financials.hostNetPayable, { decimals: true })}) from the
                            bank to the host yourself, then click <span className="font-medium text-foreground">Mark payout as done</span> so it's
                            recorded in the ledger. Nothing is sent through Razorpay from here.
                        </p>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Host: <span className="text-foreground">{host.name} · {host.phone}</span>
                            {event.upiId ? <> · UPI <span className="font-mono text-foreground">{event.upiId}</span></> : ''}
                        </p>
                    </div>

                    <div className="rounded-xl bg-card shadow-sm">
                        <h2 className="px-6 pt-6 text-sm font-semibold">Payout history</h2>
                        {payouts.length === 0 ? (
                            <p className="py-12 text-center text-sm text-muted-foreground">No payouts recorded for this tournament yet.</p>
                        ) : (
                            <div className="mt-3 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-y border-border text-left">
                                            {['Date', 'Amount', 'Method', 'Reference', 'Recorded by', 'Status', ''].map((h) => (
                                                <th key={h} className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payouts.map((p) => (
                                            <tr key={p.id} className="border-b border-border last:border-0">
                                                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{fmtDateTime(p.paidAt)}</td>
                                                <td className={`px-4 py-3 font-semibold ${p.status === 'VOIDED' ? 'text-muted-foreground line-through' : ''}`}>{inr(p.amount, { decimals: true })}</td>
                                                <td className="px-4 py-3">{p.method ?? '—'}</td>
                                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.reference ?? '—'}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{p.paidBy?.name ?? '—'}</td>
                                                <td className="px-4 py-3">
                                                    <StatusBadge status={p.status === 'VOIDED' ? 'Voided' : 'Paid'} variant={p.status === 'VOIDED' ? 'red' : 'lime'} />
                                                    {p.voidedReason && <p className="mt-0.5 text-xs text-muted-foreground">{p.voidedReason}</p>}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {p.status === 'COMPLETED' && can('events.payouts') && (
                                                        <Button size="sm" variant="ghost" onClick={() => setVoiding(p)}>Void</Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {tab === 'ledger' && <EventLedger eventId={event.id} />}

            <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark payout as done</DialogTitle>
                        <DialogDescription>
                            Confirm you've transferred <span className="font-semibold text-foreground">{inr(payout.balanceDue, { decimals: true })}</span> from
                            the platform bank account to {host.name}. This only records it — no money moves from here.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <Select value={form.method} onValueChange={(method) => setForm({ ...form, method })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{PAYOUT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                            </Select>
                            <Input type="date" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })} />
                        </div>
                        <Input placeholder="Bank reference / UTR (optional)" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
                        <Textarea placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPayoutOpen(false)}>Cancel</Button>
                        <Button className={lime} disabled={payoutMutation.isPending} onClick={() => payoutMutation.mutate()}>
                            Confirm — payout done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!voiding} onOpenChange={(o) => !o && setVoiding(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Void this payout?</DialogTitle>
                        <DialogDescription>
                            {voiding && `${inr(voiding.amount, { decimals: true })} will be added back to the balance due, and a reversal entry is written to the ledger. The original entry stays for the audit trail.`}
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea placeholder="Reason (required)" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setVoiding(null)}>Cancel</Button>
                        <Button variant="destructive" disabled={!voidReason.trim() || voidMutation.isPending} onClick={() => voidMutation.mutate()}>Void payout</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
