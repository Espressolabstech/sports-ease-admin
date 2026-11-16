import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, Plus, RefreshCw, RotateCcw, Trash2, Upload } from 'lucide-react';
import { rupees, purseError, kindLabel, spentBy, TEAM_PURSE_INR } from '../../../lib/auction';
import { AnimatedLoader } from '../../../components/AnimatedLoader';
import {
    Button,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../components/pp-ui';
import {
    getAuctionBoard,
    getAuctionTransactions,
    getAuctionTeamLogoUploadUrl,
    createAuctionTeam,
    updateAuctionTeam,
    deleteAuctionTeam,
    createAuctionCategory,
    setupAuction,
    syncAuctionPlayers,
    resetAuction,
} from '../../../api/adapters/auction';
import { TeamLogo } from './TeamLogo';
import AuctionLotsAdmin from './AuctionLotsAdmin';
import AuctionConfirmDialog, { type AuctionConfirmation } from './AuctionConfirmDialog';
import './registration-identical.css';

const notify = { className: 'pp-console pp-toast' };

async function uploadTeamLogo(eventId: string, file: File): Promise<string> {
    const mimetype = file.type || 'image/jpeg';
    const { data } = await getAuctionTeamLogoUploadUrl(eventId, mimetype);
    const put = await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': mimetype }, body: file });
    if (!put.ok) throw new Error('Logo upload failed');
    return data.publicUrl;
}

function TeamRow({
    eventId,
    team,
    spent,
    run,
    busy,
    confirmRemoval,
}: {
    eventId: string;
    team: ApiAuctionTeam;
    spent: number;
    run: (f: () => Promise<unknown>) => void;
    busy: boolean;
    confirmRemoval: (c: AuctionConfirmation) => void;
}) {
    const [name, setName] = useState(team.name);
    const [purse, setPurse] = useState(String(team.purseInr));
    const pErr = purseError(Number(purse), spent);

    return (
        <tr>
            <td>
                <label className="auction-logo-upload" title="Upload logo">
                    <TeamLogo name={team.name} logoUrl={team.logoUrl} size={36} />
                    <Upload size={12} />
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        aria-label={`Upload logo for ${team.name}`}
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (f) run(async () => updateAuctionTeam(eventId, team.id, { logoUrl: await uploadTeamLogo(eventId, f) }));
                        }}
                    />
                </label>
            </td>
            <td>
                <div className="flex gap-2">
                    <Input aria-label="Team name" value={name} onChange={(e) => setName(e.target.value)} />
                    <Button size="sm" variant="outline" disabled={busy || !name.trim() || name === team.name} onClick={() => run(() => updateAuctionTeam(eventId, team.id, { name }))}>
                        Save
                    </Button>
                </div>
            </td>
            <td>
                <div className="flex gap-2">
                    <Input aria-label="Purse in rupees" inputMode="numeric" value={purse} onChange={(e) => setPurse(e.target.value.replace(/[^\d]/g, ''))} className="w-28" />
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={busy || !!pErr || Number(purse) === team.purseInr}
                        onClick={() => run(() => updateAuctionTeam(eventId, team.id, { purseInr: Number(purse) }))}
                    >
                        Save
                    </Button>
                </div>
                {pErr && purse && <p className="text-destructive text-[10px] mt-1">{pErr}</p>}
            </td>
            <td>{rupees(spent)}</td>
            <td className="text-foreground font-semibold">{rupees(team.purseInr - spent)}</td>
            <td>
                <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove ${team.name}`}
                    disabled={busy || spent > 0}
                    onClick={() =>
                        confirmRemoval({
                            title: `Remove ${team.name}?`,
                            description: 'This team will be removed from the auction.',
                            action: 'Remove team',
                            destructive: true,
                            run: () => deleteAuctionTeam(eventId, team.id),
                        })
                    }
                >
                    <Trash2 />
                </Button>
            </td>
        </tr>
    );
}

export default function AuctionAdminPanel({ eventId }: { eventId: string }) {
    const queryClient = useQueryClient();
    const [confirmation, setConfirmation] = useState<AuctionConfirmation | null>(null);
    const [newName, setNewName] = useState('');
    const [filter, setFilter] = useState('all');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryBase, setNewCategoryBase] = useState('3000');
    const [newCategoryMultiplier, setNewCategoryMultiplier] = useState('1.5');

    const { data, isLoading } = useQuery({
        queryKey: ['auction-board', eventId],
        queryFn: () => getAuctionBoard(eventId),
    });
    const { data: txnData } = useQuery({
        queryKey: ['auction-transactions', eventId],
        queryFn: () => getAuctionTransactions(eventId),
    });

    const m = useMutation({
        mutationFn: (f: () => Promise<unknown>) => f(),
        onSuccess: () => {
            toast.success('Saved', notify);
            queryClient.invalidateQueries({ queryKey: ['auction-board', eventId] });
            queryClient.invalidateQueries({ queryKey: ['auction-transactions', eventId] });
        },
        onError: (e: { message?: string }) => toast.error(e.message || 'Something went wrong', notify),
    });
    const run = (f: () => Promise<unknown>) => m.mutate(f);

    const board = data?.data;
    const transactions = txnData?.data.transactions ?? [];

    if (isLoading || !board) {
        return (
            <div className="ccreg pp-console auction-admin-panel">
                <div className="flex justify-center py-16">
                    <AnimatedLoader />
                </div>
            </div>
        );
    }

    if (!board.setUp) {
        return (
            <div className="ccreg pp-console auction-admin-panel">
                <section className="auction-panel">
                    <h2>Player auction</h2>
                    <p className="text-muted-foreground" style={{ fontSize: 13, marginTop: 6 }}>
                        Not set up for this event yet. Setting it up creates the four official categories (A ₹6,000 · B ₹5,000 · C ₹4,000 · D ₹3,000). Then add teams
                        and sync the registered players.
                    </p>
                    <Button className="mt-4" disabled={m.isPending} onClick={() => run(() => setupAuction(eventId))}>
                        <Plus /> Set up auction
                    </Button>
                </section>
            </div>
        );
    }

    const { teams, categories, lots } = board;
    const lotName = (id: string | null) => lots.find((l) => l.id === id)?.name ?? '';
    const teamName = (id: string | null) => teams.find((t) => t.id === id)?.name ?? (id ? 'Removed team' : '');
    const txns = transactions.filter((t) => filter === 'all' || t.teamId === filter);
    const fmt = (d: string) =>
        new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(d));
    const csv = () => {
        const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
        const lines = [
            ['Time', 'Action', 'Player', 'Team', 'Amount (INR)', 'Details'].join(','),
            ...txns.map((t) =>
                [fmt(t.createdAt), kindLabel(t.kind), lotName(t.lotId), teamName(t.teamId), t.amountInr != null ? String(t.amountInr) : '', t.details].map(esc).join(','),
            ),
        ];
        const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'auction-transactions.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="ccreg pp-console auction-admin-panel">
            <section className="auction-panel mb-8">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <h2>Player pool</h2>
                        <p className="text-muted-foreground text-xs mt-1">
                            {lots.length} players. Sync adds newly paid registrations and removes refunded ones that haven&rsquo;t been auctioned yet.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        disabled={m.isPending}
                        onClick={() =>
                            run(async () => {
                                const { data } = await syncAuctionPlayers(eventId);
                                toast.success(`${data.added} added${data.removed ? `, ${data.removed} removed` : ''}`, notify);
                            })
                        }
                    >
                        <RefreshCw /> Sync registered players
                    </Button>
                </div>
                <div className="flex items-center justify-between gap-3 flex-wrap mt-5 pt-5 border-t border-border">
                    <p className="text-muted-foreground text-xs max-w-xl">
                        Testing done? Reset puts the auction back to the start: every sale, retention and re-auction is cleared and the live screen returns to the
                        categories. Players stay in the categories they were assigned to, with their levels and the teams and purses unchanged.
                    </p>
                    <Button
                        variant="destructive"
                        disabled={m.isPending}
                        onClick={() =>
                            setConfirmation({
                                title: 'Reset the auction?',
                                description:
                                    'All sales, retentions and re-auctions are cleared and every player goes back to waiting in their assigned category. Teams, purses and categories are kept. This cannot be undone.',
                                action: 'Reset auction',
                                destructive: true,
                                run: () => resetAuction(eventId),
                            })
                        }
                    >
                        <RotateCcw /> Reset auction
                    </Button>
                </div>
            </section>

            <AuctionLotsAdmin eventId={eventId} categoriesOpen={board.retentionOpen} groups={categories} lots={lots} run={run} busy={m.isPending} />

            <section className="auction-panel mb-8">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h2>
                        Teams <span className="text-muted-foreground text-xs font-normal">{teams.length}</span>
                    </h2>
                    <div className="flex gap-2">
                        <Input aria-label="New team name" placeholder="New team name" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-52" />
                        <Button
                            disabled={!newName.trim() || m.isPending}
                            onClick={() =>
                                run(async () => {
                                    await createAuctionTeam(eventId, { name: newName, purseInr: TEAM_PURSE_INR });
                                    setNewName('');
                                })
                            }
                        >
                            <Plus /> Add team
                        </Button>
                    </div>
                </div>
                <div className="host-table-scroll mt-4">
                    <table className="host-table auction-table">
                        <thead>
                            <tr>
                                <th>Logo</th>
                                <th>Name</th>
                                <th>Purse (₹)</th>
                                <th>Spent</th>
                                <th>Remaining</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {teams.map((t) => (
                                <TeamRow
                                    key={`${t.id}-${t.name}-${t.purseInr}`}
                                    eventId={eventId}
                                    team={t}
                                    spent={spentBy(t.id, lots)}
                                    run={run}
                                    busy={m.isPending}
                                    confirmRemoval={setConfirmation}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-muted-foreground text-[11px] mt-3">
                    New teams start with a {rupees(TEAM_PURSE_INR)} purse. A team that has bought players can’t be removed.
                </p>
            </section>

            <section className="auction-panel mb-8">
                <h2>Add category</h2>
                <div className="grid gap-3 mt-3 sm:grid-cols-3">
                    <div>
                        <label className="auction-label">Category name</label>
                        <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                    </div>
                    <div>
                        <label className="auction-label">Base price (₹)</label>
                        <Input inputMode="numeric" value={newCategoryBase} onChange={(e) => setNewCategoryBase(e.target.value.replace(/[^\d]/g, ''))} />
                    </div>
                    <div>
                        <label className="auction-label">Retention multiplier</label>
                        <Input inputMode="decimal" value={newCategoryMultiplier} onChange={(e) => setNewCategoryMultiplier(e.target.value.replace(/[^\d.]/g, ''))} />
                    </div>
                </div>
                <Button
                    className="mt-3"
                    disabled={!newCategoryName.trim() || m.isPending}
                    onClick={() =>
                        run(async () => {
                            await createAuctionCategory(eventId, {
                                name: newCategoryName.trim(),
                                basePriceInr: Number(newCategoryBase),
                                retentionMultiplier: Number(newCategoryMultiplier),
                            });
                            setNewCategoryName('');
                        })
                    }
                >
                    <Plus /> Add category
                </Button>
            </section>

            <section className="auction-panel">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h2>
                        Transactions <span className="text-muted-foreground text-xs font-normal">{txns.length}</span>
                    </h2>
                    <div className="flex gap-2">
                        <div className="w-48">
                            <Select value={filter} onValueChange={setFilter}>
                                <SelectTrigger aria-label="Filter by team">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="pp-console pp-menu">
                                    <SelectItem value="all">All teams</SelectItem>
                                    {teams.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="outline" onClick={csv} disabled={!txns.length}>
                            <Download /> CSV
                        </Button>
                    </div>
                </div>
                <div className="host-table-scroll mt-4">
                    <table className="host-table auction-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Action</th>
                                <th>Player</th>
                                <th>Team</th>
                                <th className="text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {txns.map((t) => (
                                <tr key={t.id}>
                                    <td className="text-muted-foreground">{fmt(t.createdAt)}</td>
                                    <td>
                                        <span
                                            className={`pp-status pp-status-${t.kind === 'sold' ? 'success' : t.kind === 'unsold' || t.kind === 'reset' ? 'danger' : t.kind === 'retain' || t.kind === 'unretain' ? 'info' : t.kind === 'put_up' ? 'warning' : 'neutral'}`}
                                        >
                                            {kindLabel(t.kind)}
                                        </span>
                                    </td>
                                    <td>{lotName(t.lotId) || '—'}</td>
                                    <td>{teamName(t.teamId) || '—'}</td>
                                    <td className="text-right">{t.amountInr != null ? rupees(t.amountInr) : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!txns.length && <p className="p-8 text-center text-muted-foreground text-sm">No transactions yet</p>}
                </div>
            </section>

            <AuctionConfirmDialog
                confirmation={confirmation}
                busy={m.isPending}
                onClose={() => setConfirmation(null)}
                onConfirm={() => {
                    if (confirmation)
                        m.mutate(async () => {
                            await confirmation.run();
                            setConfirmation(null);
                        });
                }}
            />
        </div>
    );
}
