import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeftRight, Search, UserRoundPen } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input } from '../../../components/pp-ui';
import { rupees, spentBy } from '../../../lib/auction';
import { replaceAuctionPlayer } from '../../../api/adapters/auction';
import { TeamLogo } from './TeamLogo';

const LEVEL_SHORT: Record<string, string> = { Beginner: 'BEG', Intermediate: 'INT', Advanced: 'ADV' };
const lv = (l: string | null) => (l ? (LEVEL_SHORT[l] ?? l) : '—');
const no = (n: number | null) => `#${String(n ?? 0).padStart(3, '0')}`;
const STATUS: Record<string, string> = { WAITING: 'Not auctioned', UNSOLD: 'Unsold', LIVE: 'On the block' };

/**
 * Admin: replace any player in a team with any other player of the event — a substitution agreed after the auction
 * (e.g. "Dharmik Patel replaced Nishit Dhamecha in Yaba 24K at base price"). A player from another team swaps teams.
 */
export default function ReplacePlayers({ eventId, teams, lots }: { eventId: string; teams: ApiAuctionTeam[]; lots: ApiAuctionLot[] }) {
    const qc = useQueryClient();
    const [outLot, setOutLot] = useState<ApiAuctionLot | null>(null);
    const [inLot, setInLot] = useState<ApiAuctionLot | null>(null);
    const [q, setQ] = useState('');
    const [price, setPrice] = useState('');
    const [reason, setReason] = useState('');
    const [openTeam, setOpenTeam] = useState<string | null>(null);

    const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
    const squads = useMemo(
        () =>
            [...teams]
                .sort((a, b) => a.sort - b.sort)
                .map((t) => ({ team: t, players: lots.filter((l) => l.status === 'SOLD' && l.teamId === t.id).sort((a, b) => (a.number ?? 0) - (b.number ?? 0)) })),
        [teams, lots],
    );

    const start = (l: ApiAuctionLot) => {
        setOutLot(l);
        setInLot(null);
        setQ('');
        setPrice('');
        setReason('');
    };
    const pick = (l: ApiAuctionLot) => {
        setInLot(l);
        setPrice(String(l.effectiveBasePriceInr ?? ''));
    };

    const needle = q.trim().toLowerCase();
    const candidates = outLot
        ? lots
              .filter((l) => l.id !== outLot.id && l.status !== 'LIVE' && !(l.status === 'SOLD' && l.teamId === outLot.teamId))
              .filter((l) => !needle || l.name.toLowerCase().includes(needle) || String(l.number ?? '').includes(needle) || (l.teamId && teamById.get(l.teamId)?.name.toLowerCase().includes(needle)))
              .sort((a, b) => Number(a.status === 'SOLD') - Number(b.status === 'SOLD') || (a.number ?? 0) - (b.number ?? 0))
        : [];

    const swap = !!inLot && inLot.status === 'SOLD' && !!inLot.teamId;
    const team = outLot?.teamId ? teamById.get(outLot.teamId) : undefined;
    const newPrice = swap ? (inLot?.priceInr ?? 0) : Number(price) || 0;
    const remainingNow = team ? team.purseInr - spentBy(team.id, lots) : 0;
    const remainingAfter = remainingNow + (outLot?.priceInr ?? 0) - newPrice;
    const otherTeam = swap && inLot?.teamId ? teamById.get(inLot.teamId) : undefined;
    const otherAfter = otherTeam && inLot && outLot ? otherTeam.purseInr - spentBy(otherTeam.id, lots) + (inLot.priceInr ?? 0) - (outLot.priceInr ?? 0) : 0;

    const mutation = useMutation({
        mutationFn: () => replaceAuctionPlayer(eventId, { outLotId: outLot!.id, inLotId: inLot!.id, priceInr: swap ? null : newPrice, reason: reason.trim() || null }),
        onSuccess: (r) => {
            toast.success(`${r.summary}${r.lineupsChanged ? ` · ${r.lineupsChanged} upcoming line-up${r.lineupsChanged === 1 ? '' : 's'} updated` : ''}`);
            void qc.invalidateQueries({ queryKey: ['auction-board', eventId] });
            void qc.invalidateQueries({ queryKey: ['auction-transactions', eventId] });
            void qc.invalidateQueries({ queryKey: ['admin-league-locks', eventId] });
            void qc.invalidateQueries({ queryKey: ['admin-league-ledger', eventId] });
            setOutLot(null);
        },
        onError: (e: { message?: string }) => toast.error(e.message || 'Could not replace the player'),
    });

    if (!squads.some((s) => s.players.length)) return null;

    return (
        <section className="auction-panel mb-8">
            <div>
                <h2>Replace a player</h2>
                <p className="text-muted-foreground text-xs mt-1">
                    For a substitution agreed after the auction. Pick the player leaving a team, then anyone else in the event: a player not in a team joins at their base price
                    (editable) and the outgoing player becomes unsold; a player from another team swaps teams with them. Upcoming line-ups follow; played ties keep their history.
                </p>
            </div>
            <div className="mt-4 divide-y divide-border rounded-lg border border-border">
                {squads.map(({ team: t, players }) => (
                    <div key={t.id}>
                        <button type="button" className="flex w-full items-center gap-3 px-3 py-2.5 text-left" onClick={() => setOpenTeam(openTeam === t.id ? null : t.id)} aria-expanded={openTeam === t.id}>
                            <TeamLogo name={t.name} logoUrl={t.logoUrl} size={26} />
                            <span className="flex-1 text-sm font-semibold">{t.name}</span>
                            <span className="text-muted-foreground text-xs">{players.length} players</span>
                        </button>
                        {openTeam === t.id && (
                            <ul className="grid gap-2 px-3 pb-3 sm:grid-cols-2">
                                {players.map((p) => (
                                    <li key={p.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                <span className="text-muted-foreground mr-1.5">{no(p.number)}</span>
                                                {p.name}
                                                {p.gender === 'Female' && <span className="text-muted-foreground ml-1.5 text-xs">F</span>}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                PD {lv(p.padelLevel)} · PB {lv(p.pickleballLevel)} · {p.retained ? 'Retained' : 'Sold'} {rupees(p.priceInr ?? 0)}
                                            </p>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => start(p)}>
                                            <UserRoundPen /> Replace
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </div>

            <Dialog open={!!outLot} onOpenChange={(o) => !o && !mutation.isPending && setOutLot(null)}>
                <DialogContent className="pp-console pp-dialog max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Replace {outLot?.name} in {team?.name}
                        </DialogTitle>
                        <DialogDescription>
                            {no(outLot?.number ?? null)} · PD {lv(outLot?.padelLevel ?? null)} · PB {lv(outLot?.pickleballLevel ?? null)} · bought for {rupees(outLot?.priceInr ?? 0)}
                        </DialogDescription>
                    </DialogHeader>

                    {!inLot ? (
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                                <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the incoming player by name, number or team" className="pl-9" />
                            </div>
                            <ul className="max-h-80 space-y-1.5 overflow-y-auto">
                                {candidates.map((l) => {
                                    const other = l.status === 'SOLD' && l.teamId ? teamById.get(l.teamId) : undefined;
                                    return (
                                        <li key={l.id}>
                                            <button type="button" onClick={() => pick(l)} className="hover:bg-muted/40 flex w-full items-center gap-3 rounded-md border border-border px-3 py-2 text-left">
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">
                                                        <span className="text-muted-foreground mr-1.5">{no(l.number)}</span>
                                                        {l.name}
                                                        {l.gender === 'Female' && <span className="text-muted-foreground ml-1.5 text-xs">F</span>}
                                                    </p>
                                                    <p className="text-muted-foreground text-xs">
                                                        PD {lv(l.padelLevel)} · PB {lv(l.pickleballLevel)}
                                                    </p>
                                                </div>
                                                <span className="text-muted-foreground text-right text-xs">
                                                    {other ? (
                                                        <>
                                                            <ArrowLeftRight className="mr-1 inline h-3 w-3" />
                                                            {other.name} · {rupees(l.priceInr ?? 0)}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {STATUS[l.status] ?? l.status} · base {rupees(l.effectiveBasePriceInr ?? 0)}
                                                        </>
                                                    )}
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                                {!candidates.length && <li className="text-muted-foreground py-6 text-center text-sm">No player matches.</li>}
                            </ul>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-md border border-border px-3 py-3 text-sm">
                                <p>
                                    <b>{inLot.name}</b> {swap ? <>({otherTeam?.name}) swaps with</> : <>replaces</>} <b>{outLot?.name}</b> {swap ? <>({team?.name})</> : <>in {team?.name}</>}.
                                </p>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    {inLot.name}: PD {lv(inLot.padelLevel)} · PB {lv(inLot.pickleballLevel)}
                                    {inLot.gender !== outLot?.gender && <span className="text-[hsl(var(--admin-status-amber))]"> · different gender from {outLot?.name}</span>}
                                </p>
                                <button type="button" className="mt-2 text-xs underline" onClick={() => setInLot(null)}>
                                    Choose someone else
                                </button>
                            </div>
                            {!swap && (
                                <label className="block space-y-1.5 text-sm">
                                    <span>Price (₹)</span>
                                    <Input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} />
                                    <span className="text-muted-foreground block text-xs">Defaults to {inLot.name}’s base price. {outLot?.name} goes back to unsold.</span>
                                </label>
                            )}
                            <div className="text-muted-foreground text-xs">
                                {team?.name} remaining purse: {rupees(remainingNow)} → <b className={remainingAfter < 0 ? 'text-[hsl(var(--admin-status-red))]' : 'text-foreground'}>{rupees(remainingAfter)}</b>
                                {otherTeam && (
                                    <>
                                        {' '}
                                        · {otherTeam.name}: → <b className={otherAfter < 0 ? 'text-[hsl(var(--admin-status-red))]' : 'text-foreground'}>{rupees(otherAfter)}</b>
                                    </>
                                )}
                            </div>
                            <label className="block space-y-1.5 text-sm">
                                <span>Note (optional)</span>
                                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Confirmed with Yaba 24K and Dharmik" maxLength={300} />
                            </label>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" disabled={mutation.isPending} onClick={() => setOutLot(null)}>
                            Cancel
                        </Button>
                        <Button disabled={!inLot || mutation.isPending || (!swap && price === '')} onClick={() => mutation.mutate()}>
                            {mutation.isPending ? 'Saving…' : swap ? 'Swap players' : 'Replace player'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
}
