import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts';
import {
    CalendarCheck,
    DollarSign,
    Users,
    MapPin,
    Phone,
    Clock,
    ChevronRight,
} from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getVenueBookingsMonthly } from '../../../api/adapters/venues';
import { Skeleton } from '../../ui/skeleton';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Props {
    venueId: string;
    venue: any;
}

export default function VenueOverviewTab({ venueId, venue }: Props) {
    const navigate = useNavigate();

    const courts: any[] = venue.courts || [];
    const amenities: any[] = venue.venueAmenities || [];
    const venueHours: any[] = venue.venueHours || [];

    const operatingHoursMap = venueHours.reduce((acc: any, h: any) => {
        acc[h.day?.toLowerCase()] = h;
        return acc;
    }, {});

    const stats = [
        { label: 'Total Bookings', value: venue._count?.bookings ?? 0, icon: CalendarCheck },
        { label: 'Total Courts', value: courts.length, icon: DollarSign },
        { label: 'Players', value: venue._count?.venuePlayers ?? 0, icon: Users },
        { label: 'Commission', value: `${venue.commissionRate ?? 10}%`, icon: DollarSign },
    ];

    const { data: chartData, isLoading: chartLoading } = useQuery({
        queryKey: ['venue-bookings-monthly', venueId],
        queryFn: () => getVenueBookingsMonthly(venueId).then((res) => res.data),
    });

    return (
        <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((s) => (
                    <div key={s.label} className="rounded-xl bg-card p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--admin-lime))]/10">
                                <s.icon className="h-5 w-5 text-[hsl(var(--admin-lime))]" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">{s.label}</p>
                                <p className="text-lg font-semibold">{s.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Booking Activity Chart */}
            <div className="rounded-xl bg-card p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold">Booking Activity — Last 6 Months</h3>
                <div className="h-[220px]">
                    {chartLoading ? (
                        <Skeleton className="h-full w-full" />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: 8,
                                        fontSize: 13,
                                    }}
                                />
                                <Bar dataKey="bookings" name="Bookings" fill="hsl(84, 81%, 44%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Venue Info + Courts row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Venue Info Panel */}
                <div className="rounded-xl bg-card p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-semibold">Venue Info</h3>
                    <div className="space-y-3 text-sm">
                        {venue.owner?.phone && (
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{venue.owner.name} — {venue.owner.countryCode}{venue.owner.phone}</span>
                            </div>
                        )}
                        {venue.city && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{venue.city}</span>
                            </div>
                        )}
                    </div>

                    {/* Operating Hours */}
                    <div className="pt-2">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Operating Hours</span>
                        </div>
                        <div className="space-y-1">
                            {DAYS.map((day, i) => {
                                const hours = operatingHoursMap[day];
                                const isOpen = hours && hours.isOpen;
                                return (
                                    <div key={day} className="flex items-center justify-between text-xs">
                                        <span className="w-10 font-medium">{DAY_LABELS[i]}</span>
                                        {isOpen ? (
                                            <span className="text-muted-foreground">
                                                {hours.openTime}–{hours.closeTime}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground/50">Closed</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Amenities */}
                    {amenities.length > 0 && (
                        <div className="pt-2">
                            <p className="mb-2 text-xs font-medium text-muted-foreground">Amenities</p>
                            <div className="flex flex-wrap gap-1.5">
                                {amenities.map((a: any) => (
                                    <span
                                        key={a.id}
                                        className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                                    >
                                        {a.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Courts Mini-List */}
                <div className="rounded-xl bg-card p-6 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold">Courts ({courts.length})</h3>
                    {courts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No courts added yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {courts.map((court: any) => (
                                <div
                                    key={court.id}
                                    className="flex items-center justify-between rounded-lg border border-border p-3"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{court.name}</p>
                                        <p className="text-xs text-muted-foreground capitalize">
                                            {court.sport?.toLowerCase()} · {court.environment?.toLowerCase()}
                                        </p>
                                    </div>
                                    <StatusBadge status={court.status} />
                                </div>
                            ))}
                        </div>
                    )}
                    <button
                        onClick={() => navigate(`?tab=courts`)}
                        className="mt-3 flex items-center gap-1 text-xs font-medium text-[hsl(var(--admin-lime))] hover:underline"
                    >
                        View all courts
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
