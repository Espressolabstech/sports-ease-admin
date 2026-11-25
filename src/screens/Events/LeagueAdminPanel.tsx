import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Download, Lock, LockOpen, RotateCcw, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { cn } from '../../utils/twMerge';
import {
    getLeagueLedger,
    getLeagueLocks,
    resetLeague,
    setLeagueLock,
    type LeagueLedgerEntry,
    type LeagueLockSide,
    type LeagueLockState,
    type LeagueLocksView,
} from '../../api/adapters/events';
import { TeamLogo } from './auction/TeamLogo';
import { PillTabs, TableSkeleton } from './shared';
import { fmtDateTime } from './format';

const lime = 'bg-[hsl(var(--admin-lime))] text-[hsl(var(--admin-lime-foreground))] hover:bg-[hsl(var(--admin-lime))]/90';
const errorText = (e: unknown) => (e as { message?: string })?.message || 'Something went wrong. Try again.';
const ist = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) + ' IST';

/** Court Collective league failsafes for one event: per-team round locks, and the change ledger. */
export default function LeagueAdminPanel({ eventId, canManage }: { eventId: string; canManage: boolean }) {
    const [view, setView] = useState<'locks' | 'ledger' | 'reset'>('locks');
    return (
        <div className="space-y-4">
            <PillTabs
                tabs={[
                    { key: 'locks', label: 'Round locks' },
                    { key: 'ledger', label: 'Change ledger' },
                    ...(canManage ? [{ key: 'reset' as const, label: 'Reset' }] : []),
                ]}
                value={view}
                onChange={setView}
            />
            {view === 'locks' && <RoundLocks eventId={eventId} canManage={canManage} />}
            {view === 'ledger' && <ChangeLedger eventId={eventId} />}
            {view === 'reset' && canManage && <ResetLeague eventId={eventId} />}
        </div>
    );
}

// ───────────── Reset ─────────────

const RESETS = {
    scoring: {
        title: 'Reset scoring',
        body: 'Clears every score, line-up, lock (and admin override), round deadline, Round 4–Final pairing and draw. Teams, groups and team logins stay, so the league starts again from Round 1.',
        action: 'Reset scoring',
    },
    everything: {
        title: 'Reset everything',
        body: 'Removes the whole league for this event, including teams, groups and team logins. The organiser sets it up again from Scoring.',
        action: 'Reset everything',
    },
} as const;

function ResetLeague({ eventId }: { eventId: string }) {
    const qc = useQueryClient();
    const [mode, setMode] = useState<keyof typeof RESETS | null>(null);
    const [typed, setTyped] = useState('');
    const [clearLedger, setClearLedger] = useState(false);
    const mutation = useMutation({
        mutationFn: () => resetLeague(eventId, { mode: mode!, clearLedger, confirm: typed.trim() }),
        onSuccess: () => {
            toast.success(mode === 'scoring' ? 'Scoring reset. Every screen updates now.' : 'League reset. The organiser can set it up again.');
            void qc.invalidateQueries({ queryKey: ['admin-league-locks', eventId] });
            void qc.invalidateQueries({ queryKey: ['admin-league-ledger', eventId] });
            setMode(null);
        },
        onError: (e) => toast.error(errorText(e)),
    });
    const open = (m: keyof typeof RESETS) => {
        setTyped('');
        setClearLedger(false);
        setMode(m);
    };
    return (
        <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-[hsl(var(--admin-status-red))]/40 bg-card p-4 text-sm shadow-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--admin-status-red))]" />
                <p className="text-muted-foreground">
                    For testing on the live site. This can't be undone. The auction (squads, prices, teams) is never touched, and the reset is recorded in the change ledger.
                </p>
            </div>
            {(Object.keys(RESETS) as (keyof typeof RESETS)[]).map((m) => (
                <div key={m} className="flex flex-wrap items-center gap-4 rounded-xl bg-card p-5 shadow-sm">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold">{RESETS[m].title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{RESETS[m].body}</p>
                    </div>
                    <Button variant="destructive" onClick={() => open(m)}>
                        {RESETS[m].action}
                    </Button>
                </div>
            ))}

            <Dialog open={!!mode} onOpenChange={(o) => !o && !mutation.isPending && setMode(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{mode && RESETS[mode].title}?</DialogTitle>
                        <DialogDescription>{mode && RESETS[mode].body} This can't be undone.</DialogDescription>
                    </DialogHeader>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={clearLedger} onChange={(e) => setClearLedger(e.target.checked)} />
                        Also clear the change ledger (earlier history)
                    </label>
                    <div className="space-y-1.5">
                        <p className="text-sm text-muted-foreground">
                            Type <b className="text-foreground">RESET</b> to confirm.
                        </p>
                        <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="RESET" autoComplete="off" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" disabled={mutation.isPending} onClick={() => setMode(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" disabled={mutation.isPending || typed.trim() !== 'RESET'} onClick={() => mutation.mutate()}>
                            {mutation.isPending ? 'Resetting…' : mode && RESETS[mode].action}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ───────────── Round locks ─────────────

type Pending = { tie: number; side: LeagueLockSide; state: LeagueLockState; round: string };

function RoundLocks({ eventId, canManage }: { eventId: string; canManage: boolean }) {
    const qc = useQueryClient();
    const { data, isLoading } = useQuery({ queryKey: ['admin-league-locks', eventId], queryFn: () => getLeagueLocks(eventId), refetchInterval: 30_000 });
    const [round, setRound] = useState<string | null>(null);
    const [pending, setPending] = useState<Pending | null>(null);

    const mutation = useMutation({
        mutationFn: (p: Pending) => setLeagueLock(eventId, { tie: p.tie, slot: p.side.slot, state: p.state }),
        onSuccess: (next, p) => {
            qc.setQueryData<LeagueLocksView>(['admin-league-locks', eventId], (old) => ({ ...old, ...next, setUp: true }));
            void qc.invalidateQueries({ queryKey: ['admin-league-ledger', eventId] });
            toast.success(
                p.state === 'auto'
                    ? `${p.side.name}: back to the round deadline`
                    : `${p.side.name} ${p.state === 'unlocked' ? 'unlocked' : 'locked'} for ${p.round}`,
            );
            setPending(null);
        },
        onError: (e) => toast.error(errorText(e)),
    });

    if (isLoading) return <div className="rounded-xl bg-card shadow-sm"><TableSkeleton /></div>;
    if (!data?.setUp || !data.rounds.length)
        return <p className="rounded-xl bg-card py-14 text-center text-sm text-muted-foreground shadow-sm">The league isn't set up for this event yet. The organiser sets it up from Scoring.</p>;

    const current = data.rounds.find((r) => r.key === round) ?? data.rounds.find((r) => r.ties.some((t) => t.sides.some((s) => s && !s.locked))) ?? data.rounds[0]!;
    const overrides = data.rounds.reduce((n, r) => n + r.ties.reduce((m, t) => m + t.sides.filter((s) => s?.override).length, 0), 0);

    return (
        <div className="space-y-4">
            <div className="rounded-xl bg-card p-4 text-sm text-muted-foreground shadow-sm">
                A failsafe for one team in one round. <b className="text-foreground">Unlock</b> lets that team edit its line-up after the deadline (the opponent's
                line-up it has already seen stays visible). <b className="text-foreground">Lock</b> closes it early. <b className="text-foreground">Reset</b> hands it back to the
                round deadline. Every change is recorded in the change ledger with your name.
                {overrides > 0 && <span className="mt-2 block text-[hsl(var(--admin-status-amber))]">{overrides} admin override{overrides === 1 ? '' : 's'} active.</span>}
            </div>

            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Rounds">
                {data.rounds.map((r) => {
                    const count = r.ties.reduce((m, t) => m + t.sides.filter((s) => s?.override).length, 0);
                    return (
                        <button
                            key={r.key}
                            type="button"
                            role="tab"
                            aria-selected={r.key === current.key}
                            onClick={() => setRound(r.key)}
                            className={cn(
                                'rounded-full border border-border px-3.5 py-1.5 text-xs font-medium transition-colors',
                                r.key === current.key ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {r.label}
                            {count > 0 && <span className="ml-1.5 rounded-full bg-[hsl(var(--admin-status-amber))]/20 px-1.5 text-[hsl(var(--admin-status-amber))]">{count}</span>}
                        </button>
                    );
                })}
            </div>

            <div className="rounded-xl bg-card shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                    <h2 className="text-sm font-semibold">{current.label}</h2>
                    <span className="text-xs text-muted-foreground">{current.lockAt ? `Deadline ${ist(current.lockAt)}` : 'Deadline not set yet'}</span>
                </div>
                <div className="divide-y divide-border">
                    {current.ties.map((t) => (
                        <div key={t.number} className="grid gap-3 px-4 py-4 md:grid-cols-[72px_1fr_1fr] md:items-center">
                            <div className="text-xs font-medium text-muted-foreground">
                                Tie {t.number}
                                {t.lockedAt && <span className="mt-0.5 block text-[11px]">Tie locked {fmtDateTime(t.lockedAt)}</span>}
                            </div>
                            {t.sides.map((side, i) =>
                                side ? (
                                    <TeamLockCard
                                        key={side.slot}
                                        side={side}
                                        canManage={canManage}
                                        busy={mutation.isPending && pending?.tie === t.number && pending.side.slot === side.slot}
                                        onChange={(state) => setPending({ tie: t.number, side, state, round: current.label })}
                                    />
                                ) : (
                                    <div key={i} className="rounded-lg border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
                                        Team not known yet
                                    </div>
                                ),
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <Dialog open={!!pending} onOpenChange={(o) => !o && !mutation.isPending && setPending(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {pending?.state === 'unlocked' ? 'Unlock' : pending?.state === 'locked' ? 'Lock' : 'Reset'} {pending?.side.name} for {pending?.round}?
                        </DialogTitle>
                        <DialogDescription>
                            {pending?.state === 'unlocked'
                                ? 'This team can edit and re-confirm its line-up again, even after the deadline. Changes after the lock update the match sheets and are marked "Changed after lock".'
                                : pending?.state === 'locked'
                                  ? 'This team can no longer change its line-up for this round. The opponent still won’t see it until the round locks.'
                                  : 'The admin override is removed and the round deadline decides again.'}{' '}
                            This is recorded in the change ledger.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" disabled={mutation.isPending} onClick={() => setPending(null)}>
                            Cancel
                        </Button>
                        <Button className={lime} disabled={mutation.isPending} onClick={() => pending && mutation.mutate(pending)}>
                            {mutation.isPending ? 'Saving…' : pending?.state === 'unlocked' ? 'Unlock team' : pending?.state === 'locked' ? 'Lock team' : 'Reset to deadline'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function TeamLockCard({ side, canManage, busy, onChange }: { side: LeagueLockSide; canManage: boolean; busy: boolean; onChange: (s: LeagueLockState) => void }) {
    return (
        <div className={cn('flex flex-wrap items-center gap-3 rounded-lg border px-3 py-3', side.override ? 'border-[hsl(var(--admin-status-amber))]/50' : 'border-border')}>
            <TeamLogo name={side.name} logoUrl={side.logoUrl} size={32} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                    <span className="mr-1 text-muted-foreground">{side.code}</span>
                    {side.name}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                    <StatusBadge status={side.locked ? 'Locked' : 'Open'} variant={side.locked ? 'slate' : 'lime'} />
                    {side.override && <StatusBadge status={side.override === 'unlocked' ? 'Admin unlocked' : 'Admin locked'} variant="amber" />}
                    <StatusBadge status={side.confirmed ? 'Line-up confirmed' : 'Not confirmed'} variant={side.confirmed ? 'blue' : 'red'} />
                    {side.changedAfterLock && <StatusBadge status="Changed after lock" variant="red" />}
                </div>
            </div>
            {canManage && (
                <div className="flex gap-1.5">
                    {side.locked ? (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => onChange('unlocked')}>
                            <LockOpen className="mr-1 h-3.5 w-3.5" /> Unlock
                        </Button>
                    ) : (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => onChange('locked')}>
                            <Lock className="mr-1 h-3.5 w-3.5" /> Lock
                        </Button>
                    )}
                    {side.override && (
                        <Button size="sm" variant="ghost" disabled={busy} onClick={() => onChange('auto')} title="Back to the round deadline">
                            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

// ───────────── Change ledger ─────────────

const KIND_LABEL: Record<string, { label: string; cls: string }> = {
    score: { label: 'Score', cls: 'bg-[hsl(var(--admin-lime))]/15 text-[hsl(var(--admin-lime))]' },
    'score correction': { label: 'Score correction', cls: 'bg-[hsl(var(--admin-status-amber))]/15 text-[hsl(var(--admin-status-amber))]' },
    lock: { label: 'Lock / unlock', cls: 'bg-[hsl(var(--admin-status-amber))]/15 text-[hsl(var(--admin-status-amber))]' },
    'auto-fill': { label: 'Lock & auto-fill', cls: 'bg-muted text-muted-foreground' },
    edit: { label: 'Line-up edit', cls: 'bg-[hsl(var(--admin-status-blue))]/15 text-[hsl(var(--admin-status-blue))]' },
    replacement: { label: 'Replacement', cls: 'bg-[hsl(var(--admin-status-red))]/15 text-[hsl(var(--admin-status-red))]' },
    'team confirm': { label: 'Team confirmed', cls: 'bg-muted text-muted-foreground' },
    'team edit after unlock': { label: 'Team edit (unlocked)', cls: 'bg-[hsl(var(--admin-status-red))]/15 text-[hsl(var(--admin-status-red))]' },
    pairing: { label: 'Pairing', cls: 'bg-[hsl(var(--admin-status-blue))]/15 text-[hsl(var(--admin-status-blue))]' },
    draw: { label: 'Draw', cls: 'bg-[hsl(var(--admin-status-blue))]/15 text-[hsl(var(--admin-status-blue))]' },
    deadline: { label: 'Deadline', cls: 'bg-muted text-muted-foreground' },
    group: { label: 'Groups', cls: 'bg-[hsl(var(--admin-status-red))]/15 text-[hsl(var(--admin-status-red))]' },
    login: { label: 'Team access', cls: 'bg-muted text-muted-foreground' },
    setup: { label: 'Setup', cls: 'bg-muted text-muted-foreground' },
    testing: { label: 'Testing', cls: 'bg-muted text-muted-foreground' },
    'squad change': { label: 'Squad change', cls: 'bg-[hsl(var(--admin-status-amber))]/15 text-[hsl(var(--admin-status-amber))]' },
    reset: { label: 'Reset', cls: 'bg-[hsl(var(--admin-status-red))]/15 text-[hsl(var(--admin-status-red))]' },
};
const kindOf = (k: string) => KIND_LABEL[k] ?? { label: k, cls: 'bg-muted text-muted-foreground' };
const WHO: Record<LeagueLedgerEntry['by']['kind'], string> = { organiser: 'Organisers', team: 'Teams', admin: 'PlayPass admins', system: 'Automatic' };

function ChangeLedger({ eventId }: { eventId: string }) {
    const [kind, setKind] = useState('all');
    const [who, setWho] = useState<'all' | LeagueLedgerEntry['by']['kind']>('all');
    const [q, setQ] = useState('');
    const query = useInfiniteQuery({
        queryKey: ['admin-league-ledger', eventId, kind],
        queryFn: ({ pageParam }) => getLeagueLedger(eventId, { kind: kind === 'all' ? undefined : kind, before: pageParam ?? undefined, limit: 200 }),
        initialPageParam: null as string | null,
        getNextPageParam: (last) => last.next,
        refetchInterval: 30_000,
    });
    const kinds = query.data?.pages[0]?.kinds ?? [];
    const all = useMemo(() => query.data?.pages.flatMap((p) => p.entries) ?? [], [query.data]);
    const needle = q.trim().toLowerCase();
    const entries = all.filter(
        (e) =>
            (who === 'all' || e.by.kind === who) &&
            (!needle || [e.by.name, e.by.phone, e.team?.name, e.round, ...e.changes].some((v) => v?.toLowerCase().includes(needle))),
    );

    const exportCsv = () => {
        if (!entries.length) return;
        const rows = entries.map((e) => [
            new Date(e.at).toISOString(),
            e.by.name,
            e.by.role ?? '',
            e.by.phone ?? '',
            kindOf(e.kind).label,
            e.round ?? '',
            e.tie ?? '',
            e.team?.name ?? '',
            e.changes.join(' | '),
            e.warnings.join(' | '),
        ]);
        const csv = [['When', 'Who', 'Role', 'Mobile', 'Action', 'Round', 'Tie', 'Team', 'Changes', 'Warnings'], ...rows]
            .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = 'league-change-ledger.csv';
        a.click();
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <Select value={kind} onValueChange={setKind}>
                    <SelectTrigger className="h-8 w-[190px] text-xs"><SelectValue placeholder="All actions" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All actions</SelectItem>
                        {kinds.map((k) => (
                            <SelectItem key={k.kind} value={k.kind}>
                                {kindOf(k.kind).label} ({k.count})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={who} onValueChange={(v) => setWho(v as typeof who)}>
                    <SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue placeholder="Everyone" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        {(Object.keys(WHO) as (keyof typeof WHO)[]).map((k) => (
                            <SelectItem key={k} value={k}>{WHO[k]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, team, change…" className="h-8 w-60 pl-8 text-xs" />
                </div>
                <div className="ml-auto">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportCsv}>
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Export
                    </Button>
                </div>
            </div>

            <div className="rounded-xl bg-card shadow-sm">
                {query.isLoading ? (
                    <TableSkeleton />
                ) : query.isError ? (
                    <p className="py-14 text-center text-sm text-muted-foreground">{errorText(query.error)}</p>
                ) : entries.length === 0 ? (
                    <p className="py-14 text-center text-sm text-muted-foreground">No changes recorded for this view yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left">
                                    {['When', 'Who', 'Action', 'Round · Tie', 'Team', 'What changed'].map((h) => (
                                        <th key={h} className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((e) => (
                                    <tr key={e.id} className="border-b border-border align-top last:border-0 hover:bg-muted/30">
                                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{fmtDateTime(e.at)}</td>
                                        <td className="px-4 py-3">
                                            <p className="whitespace-nowrap font-medium">{e.by.name}</p>
                                            <p className="whitespace-nowrap text-xs text-muted-foreground">
                                                {[e.by.role, e.by.phone].filter(Boolean).join(' · ') || WHO[e.by.kind]}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn('whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', kindOf(e.kind).cls)}>{kindOf(e.kind).label}</span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-xs">{e.round ? `${e.round}${e.tie ? ` · Tie ${e.tie}` : ''}` : '—'}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-xs">{e.team ? `${e.team.code} · ${e.team.name}` : '—'}</td>
                                        <td className="min-w-[280px] px-4 py-3 text-xs">
                                            <ul className="space-y-0.5">
                                                {e.changes.map((c, i) => <li key={i}>{c}</li>)}
                                            </ul>
                                            {e.warnings.length > 0 && (
                                                <ul className="mt-1 space-y-0.5 text-[hsl(var(--admin-status-amber))]">
                                                    {e.warnings.map((w, i) => <li key={i}>⚠ {w}</li>)}
                                                </ul>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {query.hasNextPage && (
                <div className="text-center">
                    <Button variant="outline" size="sm" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
                        {query.isFetchingNextPage ? 'Loading…' : 'Load older changes'}
                    </Button>
                </div>
            )}
        </div>
    );
}
