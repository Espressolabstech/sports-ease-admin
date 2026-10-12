import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    AlertTriangle,
    Banknote,
    CalendarCheck,
    Hourglass,
    Percent,
    Receipt,
    Search,
    Trophy,
    UserCog,
    Users,
    Wallet,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { getEventsSummary, listEventHosts, listEvents } from '../../api/adapters/events';
import { FinancialBreakdown, Pager, PayoutBadge, PillTabs, StatCard, TableSkeleton } from './shared';
import EventLedger from './EventLedger';
import { Button } from '../../components/ui/button';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { fmtDate, fillLabel, inr } from './format';

type Tab = 'overview' | 'tournaments' | 'hosts' | 'ledger';
const PAGE_SIZE = 20;

export default function AdminEventsPage() {
    const [params, setParams] = useSearchParams();
    const tab = (params.get('tab') as Tab) || 'overview';
    const setTab = (t: Tab) => setParams({ tab: t });

    return (
        <div className="space-y-6">
            <PillTabs
                tabs={[
                    { key: 'overview', label: 'Overview' },
                    { key: 'tournaments', label: 'Tournaments' },
                    { key: 'hosts', label: 'Hosts' },
                    { key: 'ledger', label: 'Ledger' },
                ]}
                value={tab}
                onChange={setTab}
            />
            {tab === 'overview' && <OverviewTab />}
            {tab === 'tournaments' && <TournamentsTab />}
            {tab === 'hosts' && <HostsTab />}
            {tab === 'ledger' && <EventLedger />}
        </div>
    );
}

// ── Overview ────────────────────────────────────────────────────────────

function OverviewTab() {
    const navigate = useNavigate();
    const { data, isLoading } = useQuery({ queryKey: ['admin-events-summary'], queryFn: getEventsSummary });

    const monthly = (data?.monthly ?? []).map((m) => ({
        month: new Date(`${m.month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        'Online collections': m.gross,
        'Platform fee': m.platformFee,
    }));

    return (
        <div className="space-y-6">
            {!!data?.needsAttention.paidButWaitlisted && (
                <div className="flex items-start gap-3 rounded-xl border border-[hsl(var(--admin-status-amber))]/30 bg-[hsl(var(--admin-status-amber))]/10 p-4">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--admin-status-amber))]" />
                    <p className="text-sm text-foreground">
                        <span className="font-semibold">{data.needsAttention.paidButWaitlisted} player(s)</span> paid online but
                        ended up on a waitlist. They need to be promoted by the host or refunded.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                <StatCard label="Tournaments" value={data?.counts.events} icon={Trophy} tone="text-[hsl(var(--admin-lime))]" loading={isLoading}
                    hint={data && `${data.counts.byPhase.PUBLISHED} open · ${data.counts.byPhase.DRAFT} draft · ${data.counts.byPhase.COMPLETED} finished`} />
                <StatCard label="Live now" value={data?.counts.byPhase.LIVE} icon={CalendarCheck} tone="text-[hsl(var(--admin-status-blue))]" loading={isLoading} />
                <StatCard label="Hosts" value={data?.counts.hosts} icon={UserCog} tone="text-[hsl(var(--admin-status-amber))]" loading={isLoading} />
                <StatCard label="Confirmed players" value={data?.players.registered} icon={Users} tone="text-[hsl(var(--admin-lime))]" loading={isLoading}
                    hint={data && `${data.players.checkedIn} checked in`} />
                <StatCard label="Waitlisted" value={data?.players.waitlisted} icon={Hourglass} tone="text-[hsl(var(--admin-status-amber))]" loading={isLoading} />
                <StatCard label="Online collections" value={data && inr(data.financials.onlineGross)} icon={Banknote} tone="text-[hsl(var(--admin-lime))]" loading={isLoading}
                    hint={data && `${data.players.paidOnline} online payments`} />
                <StatCard label="Platform earnings" value={data && inr(data.financials.platformFee, { decimals: true })} icon={Percent} tone="text-[hsl(var(--admin-lime))]" loading={isLoading}
                    hint={data && `${data.rates.platformFeeRate * 100}% platform fee`} />
                <StatCard label="Payable to hosts" value={data && inr(data.financials.hostNetPayable, { decimals: true })} icon={Wallet} tone="text-[hsl(var(--admin-status-blue))]" loading={isLoading}
                    hint="Net of fees and GST" />
                <StatCard label="Paid to hosts" value={data && inr(data.payouts.paidToHosts, { decimals: true })} icon={Banknote} tone="text-[hsl(var(--admin-lime))]" loading={isLoading}
                    hint="Payouts we've recorded" />
                <StatCard label="Still to pay hosts" value={data && inr(data.payouts.dueToHosts, { decimals: true })} icon={Hourglass} tone="text-[hsl(var(--admin-status-amber))]" loading={isLoading}
                    hint="Payable minus paid" />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-xl bg-card p-6 shadow-sm lg:col-span-2">
                    <h2 className="mb-4 text-sm font-semibold text-foreground">Online collections — last 6 months</h2>
                    <div className="h-[280px]">
                        {isLoading ? (
                            <Skeleton className="h-full w-full" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthly}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }}
                                        formatter={(v) => inr(Number(v ?? 0), { decimals: true })}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Bar dataKey="Online collections" fill="hsl(222, 47%, 11%)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Platform fee" fill="hsl(84, 81%, 44%)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="rounded-xl bg-card p-6 shadow-sm">
                    <h2 className="mb-3 text-sm font-semibold text-foreground">Top tournaments by online revenue</h2>
                    {isLoading ? (
                        <Skeleton className="h-40 w-full" />
                    ) : data?.topEvents.length ? (
                        <div className="space-y-3">
                            {data.topEvents.map((e) => (
                                <button key={e.id} onClick={() => navigate(`/admin/events/${e.id}`)} className="flex w-full items-center justify-between gap-3 text-left">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-foreground">{e.title}</p>
                                        <StatusBadge status={e.phase} className="mt-0.5" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold">{inr(e.onlineGross)}</p>
                                        <p className="text-xs text-muted-foreground">fee {inr(e.platformFee, { decimals: true })}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="py-10 text-center text-sm text-muted-foreground">No online payments yet.</p>
                    )}
                </div>
            </div>

            <div className="rounded-xl bg-card p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold text-foreground">Platform financials — all tournaments</h2>
                </div>
                {isLoading || !data ? <Skeleton className="h-56 w-full" /> : <FinancialBreakdown financials={data.financials} rates={data.rates} />}
            </div>
        </div>
    );
}

// ── Tournaments ─────────────────────────────────────────────────────────

function TournamentsTab() {
    const navigate = useNavigate();
    const { can } = useAdminAuth();
    const [search, setSearch] = useState('');
    const [phase, setPhase] = useState('all');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-events-list', search, phase, page],
        queryFn: () =>
            listEvents({ search: search || undefined, phase: phase === 'all' ? undefined : phase, page, limit: PAGE_SIZE }),
    });
    const events = data?.events ?? [];

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search tournament, venue or host…"
                        className="pl-9"
                    />
                </div>
                <Select value={phase} onValueChange={(v) => { setPhase(v); setPage(1); }}>
                    <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PUBLISHED">Published</SelectItem>
                        <SelectItem value="LIVE">Live</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-xl bg-card shadow-sm">
                {isLoading ? (
                    <TableSkeleton />
                ) : events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Trophy className="h-12 w-12 text-muted-foreground/30" />
                        <p className="mt-4 text-sm font-medium text-muted-foreground">No tournaments match these filters.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left">
                                        {['Tournament', 'Host', 'Date', 'Status', 'Players', 'Entry', 'Online collected', 'Platform fee', 'Payable to host', 'Host payout'].map((h) => (
                                            <th key={h} className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map((e) => (
                                        <tr key={e.id} onClick={() => navigate(`/admin/events/${e.id}`)} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <p className="font-medium">{e.title}</p>
                                                <p className="text-xs text-muted-foreground">{e.sport} · {e.format} · {e.venueName}</p>
                                            </td>
                                            <td className="px-4 py-3">{e.host.name}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{fmtDate(e.eventDate)}</td>
                                            <td className="px-4 py-3"><StatusBadge status={e.phase} /></td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                {fillLabel(e)}
                                                {e.stats.waitlisted > 0 && <span className="ml-1.5 text-xs text-[hsl(var(--admin-status-amber))]">+{e.stats.waitlisted} waitlist</span>}
                                            </td>
                                            <td className="px-4 py-3">{inr(e.priceInr)}</td>
                                            <td className="px-4 py-3">{inr(e.financials.onlineGross)}</td>
                                            <td className="px-4 py-3">{inr(e.financials.platformFee, { decimals: true })}</td>
                                            <td className="px-4 py-3 font-medium">{inr(e.financials.hostNetPayable, { decimals: true })}</td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <PayoutBadge status={e.payout.status} />
                                                {e.payout.status === 'PARTIAL' && <p className="mt-0.5 text-xs text-muted-foreground">{inr(e.payout.balanceDue, { decimals: true })} due</p>}
                                                {can('events.payouts') && e.payout.canPayout && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="mt-1 h-7 text-xs"
                                                        onClick={(ev) => { ev.stopPropagation(); navigate(`/admin/events/${e.id}?tab=payouts`); }}
                                                    >
                                                        Mark paid {inr(e.payout.balanceDue)}
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pager page={page} total={data?.pagination.total ?? 0} pageSize={PAGE_SIZE} onPage={setPage} />
                    </>
                )}
            </div>
        </div>
    );
}

// ── Hosts ───────────────────────────────────────────────────────────────

function HostsTab() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-event-hosts', search, page],
        queryFn: () => listEventHosts({ search: search || undefined, page, limit: PAGE_SIZE }),
    });
    const hosts = data?.hosts ?? [];

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search host name, phone or email…"
                    className="pl-9"
                />
            </div>

            <div className="rounded-xl bg-card shadow-sm">
                {isLoading ? (
                    <TableSkeleton />
                ) : hosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <UserCog className="h-12 w-12 text-muted-foreground/30" />
                        <p className="mt-4 text-sm font-medium text-muted-foreground">No hosts found.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left">
                                        {['Host', 'Contact', 'Tournaments', 'Players', 'Online collected', 'Platform earning', 'Payable to host', 'Paid to host', 'Still due'].map((h) => (
                                            <th key={h} className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {hosts.map((h) => (
                                        <tr key={h.id} onClick={() => navigate(`/admin/event-hosts/${h.id}`)} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium">{h.name}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                <p>{h.phone}</p>
                                                {h.email && <p className="text-xs">{h.email}</p>}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                {h.events.total}
                                                {h.events.live > 0 && <span className="ml-1.5 text-xs text-[hsl(var(--admin-status-lime))]">{h.events.live} live</span>}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                {h.players.registered}
                                                {h.players.waitlisted > 0 && <span className="ml-1.5 text-xs text-[hsl(var(--admin-status-amber))]">+{h.players.waitlisted} waitlist</span>}
                                            </td>
                                            <td className="px-4 py-3">{inr(h.financials.onlineGross)}</td>
                                            <td className="px-4 py-3">{inr(h.financials.platformFee, { decimals: true })}</td>
                                            <td className="px-4 py-3 font-medium">{inr(h.financials.hostNetPayable, { decimals: true })}</td>
                                            <td className="px-4 py-3">{inr(h.payouts.paid, { decimals: true })}</td>
                                            <td className="px-4 py-3">{h.payouts.due > 0 ? <span className="font-medium text-[hsl(var(--admin-status-amber))]">{inr(h.payouts.due, { decimals: true })}</span> : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pager page={page} total={data?.pagination.total ?? 0} pageSize={PAGE_SIZE} onPage={setPage} />
                    </>
                )}
            </div>
        </div>
    );
}
