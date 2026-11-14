import { useState } from 'react';
import { ArrowDown, ArrowUp, MoreHorizontal, Search } from 'lucide-react';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/pp-ui';
import { rupees, suggestCategory, byNumber } from '../../../lib/auction';
import { assignAuctionLots, assignSuggestedAuctionLots, moveAuctionCategory, updateAuctionCategory } from '../../../api/adapters/auction';

type Run = (f: () => Promise<unknown>) => void;
const NONE = 'none';
const playerNo = (l: { number: number | null }) => String(l.number ?? 0).padStart(3, '0');

function GroupRow({
    eventId,
    g,
    first,
    last,
    run,
    busy,
    count,
}: {
    eventId: string;
    g: ApiAuctionCategory;
    first: boolean;
    last: boolean;
    run: Run;
    busy: boolean;
    count: number;
}) {
    const [name, setName] = useState(g.name);
    const [base, setBase] = useState(String(g.basePriceInr));
    const changed = name.trim() !== g.name || Number(base) !== g.basePriceInr;
    return (
        <tr>
            <td>
                <div className="flex">
                    <Button size="icon" variant="ghost" aria-label={`Move ${g.name} earlier`} disabled={first || busy} onClick={() => run(() => moveAuctionCategory(eventId, g.id, -1))}>
                        <ArrowUp />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label={`Move ${g.name} later`} disabled={last || busy} onClick={() => run(() => moveAuctionCategory(eventId, g.id, 1))}>
                        <ArrowDown />
                    </Button>
                </div>
            </td>
            <td>
                <Input aria-label="Lot name" value={name} onChange={(e) => setName(e.target.value)} />
            </td>
            <td>
                <Input
                    aria-label={`Base price for ${g.name} in rupees`}
                    inputMode="numeric"
                    className="w-28"
                    value={base}
                    onChange={(e) => setBase(e.target.value.replace(/[^\d]/g, ''))}
                />
            </td>
            <td>{count}</td>
            <td>
                <Button
                    size="sm"
                    variant="outline"
                    disabled={busy || !changed || !name.trim() || !base}
                    onClick={() => run(() => updateAuctionCategory(eventId, g.id, { name, basePriceInr: Number(base) }))}
                >
                    Save
                </Button>
            </td>
        </tr>
    );
}

export default function AuctionLotsAdmin({
    eventId,
    groups,
    lots,
    run,
    busy,
    categoriesOpen = false,
}: {
    eventId: string;
    groups: ApiAuctionCategory[];
    lots: ApiAuctionLot[];
    run: Run;
    busy: boolean;
    /** Pre-auction: categories can still be assigned. */
    categoriesOpen?: boolean;
}) {
    const [q, setQ] = useState('');
    const [show, setShow] = useState('all');
    const groupName = (id?: string | null) => groups.find((g) => g.id === id)?.name ?? 'Unassigned';
    const rows = [...lots]
        .sort(byNumber)
        .filter(
            (l) =>
                (show === 'all' || (show === NONE ? !l.categoryId : l.categoryId === show)) &&
                `${playerNo(l)} ${l.name}`.toLowerCase().includes(q.toLowerCase()),
        );
    const moveTo = (ids: string[], g: string) => run(() => assignAuctionLots(eventId, ids, g === NONE ? null : g));
    return (
        <>
            <section className="auction-panel mb-8">
                <h2>Lots</h2>
                <p className="text-muted-foreground text-xs mt-1">Lots run in this order.</p>
                <div className="host-table-scroll mt-4">
                    <table className="host-table auction-table">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Name</th>
                                <th>Base price (₹)</th>
                                <th>Players</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map((g, i) => (
                                <GroupRow
                                    key={`${g.id}-${g.name}-${g.basePriceInr}-${g.sort}`}
                                    eventId={eventId}
                                    g={g}
                                    first={i === 0}
                                    last={i === groups.length - 1}
                                    run={run}
                                    busy={busy}
                                    count={lots.filter((l) => l.categoryId === g.id).length}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
            <section className="auction-panel mb-8">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h2>
                        Players <span className="text-muted-foreground text-xs font-normal">{lots.filter((l) => !l.categoryId).length} unassigned</span>
                    </h2>
                    <div className="flex items-center gap-2 flex-wrap">
                        {categoriesOpen && lots.some((l) => !l.categoryId && l.status === 'WAITING' && !l.retained) && (
                            <Button variant="outline" disabled={busy} onClick={() => run(() => assignSuggestedAuctionLots(eventId))}>
                                Assign categories from levels
                            </Button>
                        )}
                        <div className="host-search min-w-52">
                            <Search size={16} />
                            <Input aria-label="Search players" placeholder="Search player or number" value={q} onChange={(e) => setQ(e.target.value)} />
                        </div>
                    </div>
                </div>
                <div className="auction-lot-tabs" role="group" aria-label="Filter players by lot">
                    <Button variant="ghost" type="button" aria-selected={show === 'all'} aria-pressed={show === 'all'} onClick={() => setShow('all')}>
                        All players <span>{lots.length}</span>
                    </Button>
                    {groups.map((g) => (
                        <Button variant="ghost" key={g.id} type="button" aria-selected={show === g.id} aria-pressed={show === g.id} onClick={() => setShow(g.id)}>
                            {g.name} <span>{lots.filter((l) => l.categoryId === g.id).length}</span>
                        </Button>
                    ))}
                    <Button variant="ghost" type="button" aria-selected={show === NONE} aria-pressed={show === NONE} onClick={() => setShow(NONE)}>
                        Unassigned <span>{lots.filter((l) => !l.categoryId).length}</span>
                    </Button>
                </div>
                <div className="host-table-scroll mt-4 max-h-[600px] overflow-y-auto">
                    <table className="host-table auction-table">
                        <thead>
                            <tr>
                                <th>Player</th>
                                <th>Category</th>
                                <th>Base</th>
                                <th>Status</th>
                                <th>
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((l) => {
                                const sg = suggestCategory(l);
                                const cur = groupName(l.categoryId);
                                return (
                                    <tr key={l.id}>
                                        <td>
                                            <strong>{l.name}</strong>
                                            <span className="block text-[11px] text-muted-foreground">{playerNo(l)}</span>
                                        </td>
                                        <td>
                                            <div className="w-36">
                                                <Select value={l.categoryId ?? NONE} disabled={busy || !categoriesOpen || l.status !== 'WAITING'} onValueChange={(v) => moveTo([l.id], v)}>
                                                    <SelectTrigger aria-label={`Category for ${l.name}`}>
                                                        <SelectValue>{cur}</SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent className="pp-console pp-menu">
                                                        {groups.map((g) => (
                                                            <SelectItem key={g.id} value={g.id}>
                                                                {g.name}
                                                            </SelectItem>
                                                        ))}
                                                        <SelectItem value={NONE}>Unassigned</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {categoriesOpen && (
                                                    <span className={`block text-[11px] mt-1 ${sg.flagged || cur !== sg.category ? 'text-warning' : 'text-muted-foreground'}`}>
                                                        {sg.points} pts · suggests {sg.category.replace('Category ', '')}
                                                        {sg.flagged ? ' · confirm' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>{rupees(l.effectiveBasePriceInr)}</td>
                                        <td className="capitalize text-muted-foreground">
                                            <span
                                                className={`pp-status pp-status-${l.retained ? 'info' : l.status === 'SOLD' ? 'success' : l.status === 'UNSOLD' ? 'danger' : l.status === 'LIVE' ? 'warning' : 'neutral'}`}
                                            >
                                                {l.retained ? 'Retained' : l.status === 'LIVE' ? 'On the block' : l.status.toLowerCase()}
                                            </span>
                                            {l.retained && <span className="block text-xs mt-1">{rupees(l.priceInr ?? 0)}</span>}
                                        </td>
                                        <td>
                                            <Button size="icon" variant="ghost" aria-label={`More actions for ${l.name}`} disabled>
                                                <MoreHorizontal />
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}
