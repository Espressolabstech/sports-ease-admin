import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Skeleton } from '../../../ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { differenceInDays, format } from 'date-fns';

interface Props {
    venueId: string;
}

const TIER_COLORS: Record<string, string> = {
    club: 'hsl(var(--muted-foreground))',
    pro: 'hsl(var(--primary))',
    elite: 'hsl(100, 60%, 45%)',
};

const TIER_BADGE_CLASSES: Record<string, string> = {
    club: 'bg-muted text-muted-foreground',
    pro: 'bg-primary/10 text-primary',
    elite: 'bg-lime-500/10 text-lime-600',
};

const TIER_LABELS: Record<string, string> = {
    club: 'Club',
    pro: 'Pro',
    elite: 'Elite',
};

export default function RewardsOverviewSubTab({ venueId }: Props) {
    // Tier distribution
    const { data: tierData, isLoading: tiersLoading } = useQuery({
        queryKey: ['rewards-tier-distribution', venueId],
        queryFn: async () => {
            
        },
    });

    // Hold usage this month
    const { data: holdStats } = useQuery({
        queryKey: ['rewards-hold-stats', venueId],
        queryFn: async () => {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const monthYear = format(startOfMonth, 'yyyy-MM');

            
        },
    });

    // OTC usage this month
    const { data: otcStats } = useQuery({
        queryKey: ['rewards-otc-stats', venueId],
        queryFn: async () => {
           
        },
    });

    // Wallet revenue
    const { data: walletStats } = useQuery({
        queryKey: ['rewards-wallet-stats', venueId],
        queryFn: async () => {
            
        },
    });

    // Upcoming recalculations (next 30 days)
    const { data: recalcData } = useQuery({
        queryKey: ['rewards-upcoming-recalc', venueId],
        queryFn: async () => {
            const today = new Date();
            const thirtyDaysLater = new Date(
                today.getTime() + 30 * 24 * 60 * 60 * 1000,
            );
           
        },
    });

    const donutData = tierData
        ? [
              {
                  name: 'Club',
                  value: tierData.counts.club,
                  color: TIER_COLORS.club,
              },
              {
                  name: 'Pro',
                  value: tierData.counts.pro,
                  color: TIER_COLORS.pro,
              },
              {
                  name: 'Elite',
                  value: tierData.counts.elite,
                  color: TIER_COLORS.elite,
              },
          ]
        : [];

    const confidenceBadge = (confidence: string | null) => {
        if (!confidence) return <Badge variant="outline">Unknown</Badge>;
        const map: Record<string, { label: string; cls: string }> = {
            likely_retain: {
                label: 'Likely to retain',
                cls: 'bg-success/10 text-success',
            },
            at_risk: { label: 'At risk', cls: 'bg-warning/10 text-warning' },
            upgrade: {
                label: 'Upgrade likely',
                cls: 'bg-lime-500/10 text-lime-600',
            },
        };
        const entry = map[confidence] || { label: confidence, cls: '' };
        return <Badge className={entry.cls}>{entry.label}</Badge>;
    };

    if (tiersLoading) return <Skeleton className="h-64 w-full" />;

    return (
        <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Tier Distribution */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Tier Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {tierData && tierData.total > 0 ? (
                            <div className="flex items-center gap-4">
                                <div className="h-20 w-20">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={donutData}
                                                dataKey="value"
                                                innerRadius={20}
                                                outerRadius={35}
                                                paddingAngle={2}
                                            >
                                                {donutData.map((entry, i) => (
                                                    <Cell
                                                        key={i}
                                                        fill={entry.color}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-1 text-xs">
                                    {donutData.map((d) => (
                                        <div
                                            key={d.name}
                                            className="flex items-center gap-2"
                                        >
                                            <div
                                                className="h-2 w-2 rounded-full"
                                                style={{
                                                    backgroundColor: d.color,
                                                }}
                                            />
                                            <span className="text-muted-foreground">
                                                {d.name}
                                            </span>
                                            <span className="font-medium">
                                                {d.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No tier data yet
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Hold Usage */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Hold Usage (Month)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Placed
                            </span>
                            <span className="font-medium">
                                {holdStats?.placed || 0}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Confirmed
                            </span>
                            <span className="font-medium">
                                {holdStats?.confirmed || 0}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Expired
                            </span>
                            <span className="font-medium">
                                {holdStats?.expired || 0}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Conversion
                            </span>
                            <span className="font-semibold text-primary">
                                {holdStats?.conversionRate || '—'}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* OTC Usage */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            OTC Usage (Month)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Activations
                            </span>
                            <span className="font-medium">
                                {otcStats?.activations || 0}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Filled
                            </span>
                            <span className="font-medium">
                                {otcStats?.filled || 0}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Auto-deactivated
                            </span>
                            <span className="font-medium">
                                {otcStats?.autoDeactivated || 0}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Fill Rate
                            </span>
                            <span className="font-semibold text-primary">
                                {otcStats?.fillRate || '—'}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Wallet Revenue */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Wallet Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Cash collected
                            </span>
                            <span className="font-medium">
                                ₹
                                {(
                                    walletStats?.monthlyRevenue || 0
                                ).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Outstanding
                            </span>
                            <span className="font-medium">
                                ₹
                                {(
                                    walletStats?.outstandingBalance || 0
                                ).toLocaleString()}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Recalculations */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        Upcoming Recalculations (Next 30 Days)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {recalcData && recalcData.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Player</TableHead>
                                    <TableHead>Current Tier</TableHead>
                                    <TableHead>Window End</TableHead>
                                    <TableHead>Projected Outcome</TableHead>
                                    <TableHead className="text-right">
                                        Days Left
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recalcData.map((row) => (
                                    <TableRow key={row.player_id}>
                                        <TableCell className="font-medium">
                                            {row.player_id.slice(0, 8)}…
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={
                                                    TIER_BADGE_CLASSES[
                                                        row.current_tier
                                                    ] || ''
                                                }
                                            >
                                                {TIER_LABELS[
                                                    row.current_tier
                                                ] || row.current_tier}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {format(
                                                new Date(
                                                    row.next_recalculation_at,
                                                ),
                                                'MMM d, yyyy',
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {confidenceBadge(
                                                row.projection?.confidence ||
                                                    null,
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {row.daysRemaining}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No recalculations due in the next 30 days.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
