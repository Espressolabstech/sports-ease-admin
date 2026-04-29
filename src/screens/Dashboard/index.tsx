import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Skeleton } from '../../components/ui/skeleton';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    AlertTriangle, ArrowRight, DollarSign, Building2, TrendingUp, ClipboardList, CalendarCheck, Users, CheckCircle,
} from 'lucide-react';
import { RewardsMonitoringPanel } from '../../components/admin/RewardsMonitoringPanel';
import { getDashboard, getBookingsOverTime } from '../../api/adapters/dashboard';
import { cn } from '../../utils/twMerge';

type TimeRange = '7D' | '30D' | '90D';

const Dashboard = () => {
    const navigate = useNavigate();
    const [bookingsRange, setBookingsRange] = useState<TimeRange>('30D');

    const { data: dashboardData, isLoading } = useQuery({
        queryKey: ['admin-dashboard'],
        queryFn: () => getDashboard(),
    });

    const rangePeriod = bookingsRange === '7D' ? '7d' : bookingsRange === '30D' ? '30d' : '90d';
    const { data: bookingsChart } = useQuery({
        queryKey: ['admin-bookings-chart', bookingsRange],
        queryFn: () => getBookingsOverTime(rangePeriod as '7d' | '30d' | '90d'),
        select: (res) =>
            res.data.map((d) => ({
                date: format(new Date(d.date), bookingsRange === '7D' ? 'EEE' : 'MMM dd'),
                bookings: d.count,
            })),
    });

    const stats = dashboardData?.stats;

    const kpis = [
        { label: 'Active Venues', value: stats?.activeVenues, icon: Building2, color: 'text-[hsl(var(--admin-lime))]' },
        { label: 'Pending Review', value: stats?.pendingReview, icon: TrendingUp, color: 'text-[hsl(var(--admin-status-amber))]', link: '/admin/venues/pending' },
        { label: 'Live Courts', value: stats?.liveCourts, icon: ClipboardList, color: 'text-[hsl(var(--admin-status-blue))]' },
        { label: 'Bookings Today', value: stats?.bookingsToday, icon: CalendarCheck, color: 'text-[hsl(var(--admin-lime))]' },
        { label: 'Revenue Today', value: `INR ${stats?.revenueToday || 0}`, icon: DollarSign, color: 'text-[hsl(var(--admin-status-amber))]' },
        { label: 'New Players (7d)', value: stats?.newPlayers7d, icon: Users, color: 'text-[hsl(var(--admin-status-blue))]' },
    ];

    const revenueByVenue = dashboardData?.revenueByVenueThisMonth || [];
    const liveActivity = dashboardData?.liveActivity || [];
    const pendingReview = stats?.pendingReview || 0;

    const timeAgo = (ts: string) => {
        const diff = Date.now() - new Date(ts).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {kpis.map((kpi) => (
                    <div
                        key={kpi.label}
                        onClick={() => kpi.link && navigate(kpi.link)}
                        className={cn(
                            'rounded-xl bg-card p-5 shadow-sm',
                            kpi.link && 'cursor-pointer hover:shadow-md transition-shadow',
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                            <kpi.icon className={cn('h-4 w-4', kpi.color)} />
                        </div>
                        <div className="mt-2">
                            {isLoading ? (
                                <Skeleton className="h-7 w-14" />
                            ) : (
                                <span className="text-2xl font-bold text-foreground">{kpi.value}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bookings Over Time Chart */}
            <div className="rounded-xl bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-foreground">Bookings Over Time</h2>
                    <div className="flex gap-1 rounded-lg bg-muted p-0.5">
                        {(['7D', '30D', '90D'] as TimeRange[]).map((r) => (
                            <button
                                key={r}
                                onClick={() => setBookingsRange(r)}
                                className={cn(
                                    'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                                    bookingsRange === r
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="h-[250px]">
                    {bookingsChart ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={bookingsChart}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                                <Tooltip
                                    contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }}
                                    formatter={(value) => [`${value ?? 0} bookings`, '']}
                                />
                                <Area type="monotone" dataKey="bookings" stroke="hsl(222, 47%, 11%)" fill="hsl(222, 47%, 11%)" fillOpacity={0.15} strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <Skeleton className="h-full w-full" />
                    )}
                </div>
            </div>

            {/* Revenue + Activity row */}
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl bg-card p-6 shadow-sm">
                    <h2 className="text-sm font-semibold text-foreground mb-4">Revenue by Venue This Month</h2>
                    <div className="h-[300px]">
                        {revenueByVenue.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueByVenue} layout="vertical" margin={{ left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }}
                                        formatter={(value) => [`INR ${Number(value ?? 0).toLocaleString()}`, 'Revenue']}
                                    />
                                    <Bar dataKey="revenue" fill="hsl(84, 81%, 44%)" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <Skeleton className="h-full w-full" />
                        )}
                    </div>
                </div>

                <div className="rounded-xl bg-card p-6 shadow-sm">
                    <h2 className="text-sm font-semibold text-foreground mb-4">Live Activity</h2>
                    {liveActivity.length > 0 ? (
                        <div className="space-y-3">
                            {liveActivity.slice(0, 8).map((item: any) => (
                                <div key={item.id} className="flex items-start gap-3">
                                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--admin-lime))]" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-foreground">
                                            <span className="font-medium">{item.bookingRef || item.id?.slice(0, 8)}</span>
                                            {item.venue?.name && (
                                                <span className="text-muted-foreground"> — {item.venue.name}</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{item.status}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {timeAgo(item.createdAt)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : isLoading ? (
                        <Skeleton className="h-40 w-full" />
                    ) : (
                        <p className="text-sm text-muted-foreground">No recent activity.</p>
                    )}
                </div>
            </div>

            {/* Pending Actions */}
            <div className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">Pending Actions</h2>
                {pendingReview === 0 ? (
                    <div className="flex items-center gap-3 rounded-xl bg-[hsl(var(--admin-status-lime))]/10 p-4">
                        <CheckCircle className="h-5 w-5 text-[hsl(var(--admin-status-lime))]" />
                        <span className="text-sm font-medium text-foreground">All clear — no actions needed.</span>
                    </div>
                ) : (
                    <button
                        onClick={() => navigate('/admin/venues/pending')}
                        className="flex w-full items-center gap-3 rounded-xl bg-[hsl(var(--admin-status-amber))]/10 p-4 text-left hover:bg-[hsl(var(--admin-status-amber))]/15 transition-colors"
                    >
                        <AlertTriangle className="h-5 w-5 text-[hsl(var(--admin-status-amber))]" />
                        <span className="flex-1 text-sm font-medium">{pendingReview} venues are awaiting your review</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                )}
            </div>

            <RewardsMonitoringPanel />
        </div>
    );
};

export default Dashboard;
