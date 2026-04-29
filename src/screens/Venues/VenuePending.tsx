import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { CheckCircle } from 'lucide-react';
import { cn } from '../../utils/twMerge';
import { listPendingVenues } from '../../api/adapters/venues';

export default function VenuesPendingPage() {
    const navigate = useNavigate();

    const { data, isLoading } = useQuery({
        queryKey: ['admin-pending-venues'],
        queryFn: () => listPendingVenues(),
        select: (res) => res.venues,
    });

    const venues = data || [];

    const getDaysWaiting = (createdAt: string) =>
        Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));

    const getDaysColor = (days: number) => {
        if (days >= 4) return 'text-[hsl(var(--admin-status-red))] font-medium';
        if (days >= 2) return 'text-[hsl(var(--admin-status-amber))] font-medium';
        return 'text-muted-foreground';
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
        );
    }

    if (!venues.length) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl bg-card py-20 shadow-sm">
                <CheckCircle className="h-12 w-12 text-[hsl(var(--admin-status-lime))]/40" />
                <p className="mt-4 text-sm font-medium text-foreground">No venues awaiting review</p>
                <p className="text-sm text-muted-foreground">You're all caught up.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl bg-card shadow-sm">
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border text-left">
                            <th className="px-4 py-3 font-medium text-muted-foreground">Venue Name</th>
                            <th className="px-4 py-3 font-medium text-muted-foreground">City</th>
                            <th className="px-4 py-3 font-medium text-muted-foreground">Owner</th>
                            <th className="px-4 py-3 font-medium text-muted-foreground">Courts</th>
                            <th className="px-4 py-3 font-medium text-muted-foreground">Submitted</th>
                            <th className="px-4 py-3 font-medium text-muted-foreground">Days Waiting</th>
                            <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {venues.map((venue: any) => {
                            const days = getDaysWaiting(venue.createdAt);
                            return (
                                <tr key={venue.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                    <td className="px-4 py-3 font-medium">{venue.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{venue.city}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{venue.owner?.name || '—'}</td>
                                    <td className="px-4 py-3">{venue._count?.courts ?? venue.courts?.length ?? 0}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{new Date(venue.createdAt).toLocaleDateString()}</td>
                                    <td className={cn('px-4 py-3', getDaysColor(days))}>{days}d</td>
                                    <td className="px-4 py-3">
                                        <Button
                                            size="sm"
                                            onClick={() => navigate(`/admin/venues/${venue.id}/review`)}
                                            className="bg-[hsl(var(--admin-lime))] text-[hsl(var(--admin-lime-foreground))] hover:bg-[hsl(var(--admin-lime))]/90"
                                        >
                                            Review
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="space-y-3 p-4 md:hidden">
                {venues.map((venue: any) => {
                    const days = getDaysWaiting(venue.createdAt);
                    return (
                        <div key={venue.id} className="rounded-lg border border-border p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{venue.name}</span>
                                <span className={cn('text-xs', getDaysColor(days))}>{days}d waiting</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{venue.city}</p>
                            <Button
                                size="sm"
                                onClick={() => navigate(`/admin/venues/${venue.id}/review`)}
                                className="w-full bg-[hsl(var(--admin-lime))] text-[hsl(var(--admin-lime-foreground))] hover:bg-[hsl(var(--admin-lime))]/90"
                            >
                                Review
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
