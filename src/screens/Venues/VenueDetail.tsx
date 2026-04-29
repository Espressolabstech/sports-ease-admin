import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Skeleton } from '../../components/ui/skeleton';
import { ExternalLink, MapPin, ShieldCheck, ShieldOff } from 'lucide-react';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { Button } from '../../components/ui/button';
import { cn } from '../../utils/twMerge';
import VenueCourtsTab from '../../components/admin/venue-detail/CourtsTab';
import VenueBookingsTab from '../../components/admin/venue-detail/BookingsTab';
import VenueOverviewTab from '../../components/admin/venue-detail/OverviewTab';
import VenueMessagesTab from '../../components/admin/venue-detail/MessagesTab';
import VenuePayoutsTab from '../../components/admin/venue-detail/PayoutsTab';
import RewardsTab from '../../components/admin/venue-detail/RewardsTab';
import VenueSchedulePricingTab from '../../components/admin/venue-detail/SchedulePricingTab';
import VenueSettingsTab from '../../components/admin/venue-detail/SettingsTab';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { getVenue, updateVenueStatus } from '../../api/adapters/venues';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const SUSPEND_REASONS = [
    'Policy Violation',
    'Fraudulent Activity',
    'Repeated Complaints',
    'Safety Concern',
    'Non-Compliance',
    'Other',
];

const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'courts', label: 'Courts' },
    { key: 'schedule', label: 'Schedule & Pricing' },
    { key: 'bookings', label: 'Bookings' },
    { key: 'rewards', label: 'Rewards' },
    { key: 'payouts', label: 'Payouts' },
    { key: 'messages', label: 'Messages' },
    { key: 'settings', label: 'Settings' },
];

const VenueDetails = () => {
    const { venueId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const { isSuperAdmin } = useAdminAuth();

    const activeTab = searchParams.get('tab') || 'overview';
    const setActiveTab = (tab: string) => setSearchParams({ tab });

    const [suspendOpen, setSuspendOpen] = useState(false);
    const [suspendReason, setSuspendReason] = useState('');
    const [suspendNotes, setSuspendNotes] = useState('');

    const { data: venue, isLoading } = useQuery({
        queryKey: ['admin-venue-detail', venueId],
        queryFn: () => getVenue(venueId!).then((res) => res.venue),
        enabled: !!venueId,
    });

    const suspendMutation = useMutation({
        mutationFn: () =>
            updateVenueStatus(venueId!, 'BANNED', suspendReason + (suspendNotes ? ` — ${suspendNotes}` : '')),
        onSuccess: () => {
            toast.success(`${venue?.name} has been suspended.`);
            setSuspendOpen(false);
            setSuspendReason('');
            setSuspendNotes('');
            queryClient.invalidateQueries({ queryKey: ['admin-venue-detail', venueId] });
        },
        onError: (err: any) => toast.error(err.message),
    });

    const reinstateMutation = useMutation({
        mutationFn: () => updateVenueStatus(venueId!, 'ACTIVE'),
        onSuccess: () => {
            toast.success(`${venue?.name} has been reinstated.`);
            queryClient.invalidateQueries({ queryKey: ['admin-venue-detail', venueId] });
        },
        onError: (err: any) => toast.error(err.message),
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-[200px] w-full rounded-xl" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
    }

    if (!venue) {
        return <p className="text-muted-foreground">Venue not found.</p>;
    }

    const coverUrl = venue.venueImages?.find((i: any) => i.type === 'COVER')?.url;
    const logoUrl = venue.venueImages?.find((i: any) => i.type === 'LOGO')?.url;

    return (
        <div className="space-y-0">
            {/* Cover Photo Banner */}
            <div className="relative -mx-6 -mt-6 h-[200px] overflow-hidden rounded-b-xl bg-[hsl(var(--admin-navy))]">
                {coverUrl ? (
                    <img src={coverUrl} alt={venue.name} className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[hsl(var(--admin-navy))] to-[hsl(var(--admin-navy))]/80" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                    <div className="flex items-center gap-4">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt="Logo"
                                className="h-[60px] w-[60px] rounded-full border-2 border-white/20 object-cover"
                            />
                        ) : (
                            <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[hsl(var(--admin-lime))] text-lg font-bold text-[hsl(var(--admin-navy))]">
                                {venue.name.charAt(0)}
                            </div>
                        )}
                        <div>
                            <h1 className="text-xl font-bold text-white">{venue.name}</h1>
                            <div className="mt-1 flex items-center gap-2">
                                <span className="flex items-center gap-1 text-sm text-white/70">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {venue.city}
                                </span>
                                <StatusBadge status={venue.status} />
                            </div>
                        </div>
                    </div>

                    <div className="hidden items-center gap-2 sm:flex">
                        {venue.status === 'ACTIVE' && isSuperAdmin && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSuspendOpen(true)}
                                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                            >
                                <ShieldOff className="mr-1.5 h-4 w-4" />
                                Suspend
                            </Button>
                        )}
                        {venue.status === 'BANNED' && isSuperAdmin && (
                            <Button
                                size="sm"
                                onClick={() => reinstateMutation.mutate()}
                                disabled={reinstateMutation.isPending}
                                className="bg-[hsl(var(--admin-lime))] text-[hsl(var(--admin-lime-foreground))] hover:bg-[hsl(var(--admin-lime))]/90"
                            >
                                <ShieldCheck className="mr-1.5 h-4 w-4" />
                                {reinstateMutation.isPending ? 'Reinstating...' : 'Reinstate'}
                            </Button>
                        )}
                        {venue.slug && (
                            <Button
                                size="icon"
                                variant="outline"
                                asChild
                                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                            >
                                <a href={`/venue/${venue.slug}`} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="sticky top-0 z-10 -mx-6 border-b border-border bg-[hsl(var(--admin-bg))] px-6 pt-4">
                <div className="flex gap-1 overflow-x-auto">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                'relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors',
                                activeTab === tab.key
                                    ? 'text-[hsl(var(--admin-lime))]'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.key && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(var(--admin-lime))]" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="pt-6">
                {activeTab === 'overview' && <VenueOverviewTab venueId={venueId!} venue={venue} />}
                {activeTab === 'courts' && <VenueCourtsTab venueId={venueId!} />}
                {activeTab === 'schedule' && <VenueSchedulePricingTab venueId={venueId!} venue={venue} />}
                {activeTab === 'bookings' && <VenueBookingsTab venueId={venueId!} />}
                {activeTab === 'rewards' && <RewardsTab venueId={venueId!} />}
                {activeTab === 'payouts' && <VenuePayoutsTab venueId={venueId!} venueName={venue.name} />}
                {activeTab === 'messages' && <VenueMessagesTab venueId={venueId!} venueName={venue.name} />}
                {activeTab === 'settings' && <VenueSettingsTab venueId={venueId!} venue={venue} />}
            </div>

            {/* Suspend Modal */}
            <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Suspend {venue.name}</DialogTitle>
                        <DialogDescription>
                            This will immediately remove the venue from public listings.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Reason</label>
                            <Select value={suspendReason} onValueChange={setSuspendReason}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SUSPEND_REASONS.map((r) => (
                                        <SelectItem key={r} value={r}>{r}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Additional Notes (optional)</label>
                            <Textarea
                                value={suspendNotes}
                                onChange={(e) => setSuspendNotes(e.target.value)}
                                placeholder="Add any details..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSuspendOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => suspendMutation.mutate()}
                            disabled={!suspendReason || suspendMutation.isPending}
                        >
                            {suspendMutation.isPending ? 'Suspending...' : 'Confirm Suspend'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default VenueDetails;
