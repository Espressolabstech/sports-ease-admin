import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { ClipboardList, Search, ExternalLink, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { cn } from '../../utils/twMerge';
import { listCourts } from '../../api/adapters/courts';

const PAGE_SIZE = 25;

export default function AdminCourtsPage() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [sportFilter, setSportFilter] = useState('all');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-all-courts', searchQuery, sportFilter, page],
        queryFn: () =>
            listCourts({
                search: searchQuery || undefined,
                sport: sportFilter === 'all' ? undefined : sportFilter.toUpperCase(),
                page,
                limit: PAGE_SIZE,
            }),
    });

    const courts = data?.courts || [];
    const summary = data?.summary;
    const total = data?.pagination.total || 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    const chipItems = [
        { label: 'Total Courts', value: summary?.total ?? total },
        { label: 'Padel', value: summary?.padel ?? 0 },
        { label: 'Pickleball', value: summary?.pickelball ?? 0 },
    ];

    const exportCSV = () => {
        if (!courts.length) return;
        const csv = [['Court Name', 'Venue', 'Sport', 'Indoor/Outdoor']]
            .concat(courts.map((c: any) => [c.name, c.venue?.name || '', c.sport, c.isIndoor ? 'Indoor' : 'Outdoor']))
            .map((r) => r.map((v: any) => `"${v}"`).join(','))
            .join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = 'courts.csv';
        a.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
                {chipItems.map((c) => (
                    <div key={c.label} className="rounded-xl bg-card px-5 py-3 shadow-sm">
                        <p className="text-xs text-muted-foreground">{c.label}</p>
                        <p className="text-xl font-bold text-foreground">{c.value}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-3">
                    <div className="relative max-w-xs flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search courts..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex gap-1 rounded-lg bg-muted p-0.5">
                        {['all', 'Padel', 'Pickleball'].map((s) => (
                            <button
                                key={s}
                                onClick={() => { setSportFilter(s); setPage(1); }}
                                className={cn(
                                    'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                                    sportFilter === s ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
                                )}
                            >
                                {s === 'all' ? 'All' : s}
                            </button>
                        ))}
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </div>

            <div className="rounded-xl bg-card shadow-sm">
                {isLoading ? (
                    <div className="space-y-3 p-6">
                        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : courts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <ClipboardList className="h-12 w-12 text-muted-foreground/30" />
                        <p className="mt-4 text-sm font-medium text-muted-foreground">No courts match your current filters.</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left">
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Court Name</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Venue</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Sport</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Indoor/Outdoor</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courts.map((court: any) => (
                                        <tr key={court.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium">{court.name}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{court.venue?.name || '—'}</td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={court.sport} variant={court.sport?.toLowerCase() === 'padel' ? 'blue' : 'lime'} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={court.isIndoor ? 'Indoor' : 'Outdoor'} variant="slate" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/venues/${court.venueId}?tab=courts`)} title="Go to Venue">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="space-y-3 p-4 md:hidden">
                            {courts.map((court: any) => (
                                <div key={court.id} className="rounded-lg border border-border p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">{court.name}</span>
                                        <StatusBadge status={court.sport} variant={court.sport?.toLowerCase() === 'padel' ? 'blue' : 'lime'} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">{court.venue?.name}</p>
                                    <Button size="sm" className="w-full" variant="outline" onClick={() => navigate(`/admin/venues/${court.venueId}?tab=courts`)}>
                                        View in Venue
                                    </Button>
                                </div>
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-border px-4 py-3">
                                <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
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
