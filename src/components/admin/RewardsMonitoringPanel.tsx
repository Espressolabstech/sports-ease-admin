import { useQuery } from '@tanstack/react-query';
import { Lock, AlertTriangle, CreditCard, Wallet } from 'lucide-react';
import { getDashboard } from '../../api/adapters/dashboard';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../utils/twMerge';

export function RewardsMonitoringPanel() {

    const { data, isLoading } = useQuery({
        queryKey: ['admin-rewards-monitoring'],
        refetchInterval: 30000,
        queryFn: () => getDashboard().then((res) => ({
            activeHolds: res.rewardsMonitoring.activeHolds,
            failedVoids24h: res.rewardsMonitoring.failedAuthVoids24h,
            failedRefunds: res.rewardsMonitoring.failedRefundsPending,
            totalWalletLiability: res.rewardsMonitoring.totalWalletLiability,
        })),
    });

    if (isLoading) {
        return <Skeleton className="h-[180px] w-full rounded-xl" />;
    }

    if (!data) return null;

    const items = [
        {
            icon: Lock,
            label: 'Active holds right now',
            value: data.activeHolds,
            color:
                data.activeHolds > 0
                    ? 'text-[hsl(var(--admin-status-amber))]'
                    : 'text-muted-foreground',
            bgColor:
                data.activeHolds > 0
                    ? 'bg-[hsl(var(--admin-status-amber))]/10'
                    : 'bg-muted/50',
        },
        {
            icon: AlertTriangle,
            label: 'Failed auth voids (24h)',
            value: data.failedVoids24h,
            color:
                data.failedVoids24h > 0
                    ? 'text-[hsl(var(--admin-status-red))]'
                    : 'text-muted-foreground',
            bgColor:
                data.failedVoids24h > 0
                    ? 'bg-[hsl(var(--admin-status-red))]/10'
                    : 'bg-muted/50',
            flagged: data.failedVoids24h > 0,
        },
        {
            icon: CreditCard,
            label: 'Failed refunds pending',
            value: data.failedRefunds,
            color:
                data.failedRefunds > 0
                    ? 'text-[hsl(var(--admin-status-red))]'
                    : 'text-muted-foreground',
            bgColor:
                data.failedRefunds > 0
                    ? 'bg-[hsl(var(--admin-status-red))]/10'
                    : 'bg-muted/50',
            flagged: data.failedRefunds > 0,
        },
        {
            icon: Wallet,
            label: 'Total wallet liability',
            value: `₹${data.totalWalletLiability.toLocaleString()}`,
            color: 'text-[hsl(var(--admin-status-blue))]',
            bgColor: 'bg-[hsl(var(--admin-status-blue))]/10',
        },
    ];

    return (
        <div className="rounded-xl bg-card p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground mb-4">
                Rewards Monitoring
            </h2>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className={cn(
                            'flex items-center gap-3 rounded-lg p-3',
                            item.bgColor,
                        )}
                    >
                        <item.icon
                            className={cn('h-5 w-5 shrink-0', item.color)}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">
                                {item.label}
                            </p>
                            <p className={cn('text-lg font-bold', item.color)}>
                                {item.value}
                            </p>
                        </div>
                        {item.flagged && (
                            <span className="text-[10px] font-semibold text-[hsl(var(--admin-status-red))] bg-[hsl(var(--admin-status-red))]/10 px-1.5 py-0.5 rounded">
                                REVIEW
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
