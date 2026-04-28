import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Search, Download } from 'lucide-react';
import { Button } from '../../ui/button';
import { Skeleton } from '../../ui/skeleton';
import { Input } from '../../ui/input';
import { StatusBadge } from '../StatusBadge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { listBookings } from '../../../api/adapters/bookings';
import { toast } from 'sonner';

const PAGE_SIZE = 20;
const STATUSES = ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'PENDING'];

interface Props {
    venueId: string;
}

export default function VenueBookingsTab({ venueId }: Props) {
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-venue-bookings', venueId, statusFilter, searchQuery, page],
        queryFn: () =>
            listBookings({
                venueId,
                status: statusFilter === 'all' ? undefined : statusFilter,
                search: searchQuery || undefined,
                page,
                limit: PAGE_SIZE,
            }),
    });

    const bookings = data?.bookings || [];
    const total = data?.pagination.total || 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    const exportCSV = () => {
        if (!bookings.length) { toast.info('No bookings to export.'); return; }
        const csv = [['Ref', 'Player', 'Date', 'Amount', 'Status']]
            .concat(
                bookings.map((b: any) => [
                    b.bookingRef || '',
                    b.user?.name || '',
                    b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : '',
                    b.finalAmount ?? '',
                    b.status || '',
                ]),
            )
            .map((row) => row.map((c) => `"${c}"`).join(','))
            .join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = `bookings-${venueId}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <Select
                        value={statusFilter}
                        onValueChange={(v) => { setStatusFilter(v); setPage(1); }}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                    {s.charAt(0) + s.slice(1).toLowerCase()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search player / ref..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            className="w-52 pl-9"
                        />
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-xl bg-card shadow-sm">
                {isLoading ? (
                    <div className="space-y-3 p-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <p className="text-sm font-medium text-muted-foreground">No bookings found</p>
                        <p className="text-xs text-muted-foreground/60">
                            Bookings will appear here once players make reservations.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left">
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Ref</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Player</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Amount</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((b: any) => (
                                        <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                                {b.bookingRef || '—'}
                                            </td>
                                            <td className="px-4 py-3 font-medium">{b.user?.name || '—'}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {b.finalAmount != null ? `INR ${b.finalAmount}` : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={b.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-border px-4 py-3">
                                <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
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
