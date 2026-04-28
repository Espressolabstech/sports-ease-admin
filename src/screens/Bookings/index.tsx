import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { CalendarCheck, Search, Download, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/twMerge';
import { listBookings } from '../../api/adapters/bookings';
import { listVenues } from '../../api/adapters/venues';

const PAGE_SIZE = 25;

export default function AdminBookingsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [venueFilter, setVenueFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const { data: venuesData } = useQuery({
        queryKey: ['admin-venues-dropdown'],
        queryFn: () => listVenues({ limit: 200 }),
        select: (res) => res.venues,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['admin-all-bookings', searchQuery, statusFilter, venueFilter, page],
        queryFn: () =>
            listBookings({
                search: searchQuery || undefined,
                status: statusFilter === 'all' ? undefined : statusFilter.toUpperCase(),
                venueId: venueFilter === 'all' ? undefined : venueFilter,
                page,
                limit: PAGE_SIZE,
            }),
    });

    const bookings = data?.bookings || [];
    const total = data?.pagination.total || 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    const exportCSV = () => {
        if (!bookings.length) return;
        const headers = ['Booking Ref', 'Player', 'Venue', 'Date', 'Amount (INR)', 'Status'];
        const csvRows = bookings.map((b: any) => [
            b.bookingRef, b.user?.name || b.bookedBy?.name || '', b.venue?.name || '',
            b.bookingDate, b.finalAmount || b.totalAmount || 0, b.status,
        ]);
        const csv = [headers, ...csvRows].map((row) => row.map((v: any) => `"${v}"`).join(',')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = 'bookings.csv';
        a.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-3">
                    <div className="relative max-w-xs flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by player or ref..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex gap-1 rounded-lg bg-muted p-0.5">
                        {['all', 'confirmed', 'completed', 'cancelled', 'no_show'].map((s) => (
                            <button
                                key={s}
                                onClick={() => { setStatusFilter(s); setPage(1); }}
                                className={cn(
                                    'rounded-md px-3 py-1 text-xs font-medium transition-colors capitalize',
                                    statusFilter === s ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
                                )}
                            >
                                {s === 'all' ? 'All' : s.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                    <Select value={venueFilter} onValueChange={(v) => { setVenueFilter(v); setPage(1); }}>
                        <SelectTrigger className="h-8 w-[180px] text-xs">
                            <SelectValue placeholder="All Venues" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Venues</SelectItem>
                            {(venuesData || []).map((v: any) => (
                                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                ) : bookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <CalendarCheck className="h-12 w-12 text-muted-foreground/30" />
                        <p className="mt-4 text-sm font-medium text-muted-foreground">No bookings match your current filters.</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left">
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Booking Ref</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Player</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Venue</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Court</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Time</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Amount</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                                        <th className="w-8" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((booking: any) => (
                                        <>
                                            <tr
                                                key={booking.id}
                                                onClick={() => setExpandedRow(expandedRow === booking.id ? null : booking.id)}
                                                className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer"
                                            >
                                                <td className="px-4 py-3 font-mono text-xs">{booking.bookingRef || booking.id?.slice(0, 8)}</td>
                                                <td className="px-4 py-3">{booking.user?.name || booking.bookedBy?.name || '—'}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{booking.venue?.name || '—'}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{booking.court?.name || '—'}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{booking.bookingDate || '—'}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{booking.startTime ? booking.startTime.slice(0, 5) : '—'}</td>
                                                <td className="px-4 py-3">INR {booking.finalAmount || booking.totalAmount || 0}</td>
                                                <td className="px-4 py-3"><StatusBadge status={booking.status} /></td>
                                                <td className="px-4 py-3">
                                                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expandedRow === booking.id && 'rotate-180')} />
                                                </td>
                                            </tr>
                                            {expandedRow === booking.id && (
                                                <tr key={`${booking.id}-detail`}>
                                                    <td colSpan={9} className="bg-muted/20 px-6 py-4">
                                                        <div className="grid gap-3 sm:grid-cols-3 text-sm">
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Player Phone</p>
                                                                <p>{booking.user?.phone || '—'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Duration</p>
                                                                <p>{booking.durationMinutes ? `${booking.durationMinutes} min` : '—'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Full Booking ID</p>
                                                                <p className="font-mono text-xs">{booking.id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="space-y-3 p-4 md:hidden">
                            {bookings.map((booking: any) => (
                                <div key={booking.id} className="rounded-lg border border-border p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-xs">{booking.bookingRef || booking.id?.slice(0, 8)}</span>
                                        <StatusBadge status={booking.status} />
                                    </div>
                                    <p className="text-sm font-medium">{booking.user?.name || '—'}</p>
                                    <p className="text-xs text-muted-foreground">{booking.bookingDate} · INR {booking.finalAmount || booking.totalAmount || 0}</p>
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
