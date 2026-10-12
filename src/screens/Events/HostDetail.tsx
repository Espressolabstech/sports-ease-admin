import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Banknote, ExternalLink, Hourglass, Percent, Trophy, Users, Wallet } from 'lucide-react';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { Skeleton } from '../../components/ui/skeleton';
import { getEventHostDetail } from '../../api/adapters/events';
import { FinancialBreakdown, PayoutBadge, StatCard } from './shared';
import EventLedger from './EventLedger';
import { fillLabel, fmtDate, fmtDateTime, inr } from './format';

export default function AdminEventHostDetailPage() {
    const { hostId } = useParams();
    const navigate = useNavigate();

    const { data, isLoading } = useQuery({
        queryKey: ['admin-event-host-detail', hostId],
        queryFn: () => getEventHostDetail(hostId!),
        enabled: !!hostId,
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
        return <div className="rounded-xl bg-card py-16 text-center text-sm text-muted-foreground shadow-sm">Host not found.</div>;
    }

    const { host, events, players, financials, payouts } = data;

    return (
        <div className="space-y-6">
            <div>
                <Link to="/admin/events?tab=hosts" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> All hosts
                </Link>
                <div className="mt-3 flex flex-wrap items-start gap-4">
                    {host.profile?.photoUrl ? (
                        <img src={host.profile.photoUrl} alt={host.name} className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--admin-lime))]/20 text-lg font-semibold text-[hsl(var(--admin-lime))]">
                            {host.name.slice(0, 1).toUpperCase()}
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-bold text-foreground">{host.name}</h1>
                            <StatusBadge status={host.status} />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {host.phone}
                            {host.email ? ` · ${host.email}` : ''}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Joined {fmtDate(host.joinedAt)}
                            {host.lastLoginAt ? ` · Last login ${fmtDateTime(host.lastLoginAt)}` : ''}
                        </p>
                        {host.profile?.description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{host.profile.description}</p>}
                        {host.profile?.socialUrl && (
                            <a href={host.profile.socialUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-foreground underline-offset-2 hover:underline">
                                <ExternalLink className="h-3.5 w-3.5" /> {host.profile.socialUrl}
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Tournaments" value={events.length} icon={Trophy} tone="text-[hsl(var(--admin-lime))]" />
                <StatCard label="Confirmed players" value={players.registered} icon={Users} tone="text-[hsl(var(--admin-lime))]" hint={`${players.waitlisted} waitlisted`} />
                <StatCard label="Online collected" value={inr(financials.onlineGross)} icon={Banknote} tone="text-[hsl(var(--admin-lime))]" hint={`${players.paidOnline} payments`} />
                <StatCard label="Platform earning" value={inr(financials.platformFee, { decimals: true })} icon={Percent} tone="text-[hsl(var(--admin-lime))]" />
                <StatCard label="Payable to host" value={inr(financials.hostNetPayable, { decimals: true })} icon={Wallet} tone="text-[hsl(var(--admin-status-blue))]" />
                <StatCard label="Paid to host" value={inr(payouts.paid, { decimals: true })} icon={Banknote} tone="text-[hsl(var(--admin-lime))]" hint="Payouts we've recorded" />
                <StatCard label="Still due to host" value={inr(payouts.due, { decimals: true })} icon={Hourglass} tone="text-[hsl(var(--admin-status-amber))]" hint="Payable minus paid" />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-xl bg-card p-6 shadow-sm lg:col-span-1">
                    <h2 className="mb-3 text-sm font-semibold">Lifetime financials</h2>
                    <FinancialBreakdown financials={financials} />
                </div>

                <div className="rounded-xl bg-card shadow-sm lg:col-span-2">
                    <h2 className="px-6 pt-6 text-sm font-semibold">Tournaments</h2>
                    <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-y border-border text-left">
                                    {['Tournament', 'Date', 'Status', 'Players', 'Online collected', 'Platform fee', 'Payable', 'Payout'].map((h) => (
                                        <th key={h} className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((e) => (
                                    <tr key={e.id} onClick={() => navigate(`/admin/events/${e.id}`)} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{e.title}</p>
                                            <p className="text-xs text-muted-foreground">{e.sport} · {e.format}</p>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{fmtDate(e.eventDate)}</td>
                                        <td className="px-4 py-3"><StatusBadge status={e.phase} /></td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            {fillLabel(e)}
                                            {e.stats.waitlisted > 0 && <span className="ml-1.5 text-xs text-[hsl(var(--admin-status-amber))]">+{e.stats.waitlisted}</span>}
                                        </td>
                                        <td className="px-4 py-3">{inr(e.financials.onlineGross)}</td>
                                        <td className="px-4 py-3">{inr(e.financials.platformFee, { decimals: true })}</td>
                                        <td className="px-4 py-3 font-medium">{inr(e.financials.hostNetPayable, { decimals: true })}</td>
                                        <td className="px-4 py-3"><PayoutBadge status={e.payout.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="mb-3 text-sm font-semibold text-foreground">Ledger — all of this host's tournaments</h2>
                <EventLedger hostId={host.id} />
            </div>
        </div>
    );
}
