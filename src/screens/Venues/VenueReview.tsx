import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
    ArrowLeft,
    MapPin,
    Phone,
    Clock,
    Shield,
    CreditCard,
    Building2,
    Dumbbell,
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion';
import { getVenue, updateVenueStatus } from '../../api/adapters/venues';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const VenueReview = () => {
    const { venueId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [approveOpen, setApproveOpen] = useState(false);

    const { data: venue, isLoading } = useQuery({
        queryKey: ['admin-venue', venueId],
        queryFn: () => getVenue(venueId!).then((res) => res.venue),
        enabled: !!venueId,
    });

    const approveMutation = useMutation({
        mutationFn: () => updateVenueStatus(venueId!, 'ACTIVE'),
        onSuccess: () => {
            toast.success(`${venue?.name} has been approved and is now live.`);
            queryClient.invalidateQueries({ queryKey: ['admin-pending-venues'] });
            queryClient.invalidateQueries({ queryKey: ['admin-pending-venues-count'] });
            navigate('/admin/venues/pending');
        },
        onError: (err: any) => toast.error(err.message),
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
    }

    if (!venue) {
        return <p className="text-muted-foreground">Venue not found.</p>;
    }

    const logoUrl = venue.venueImages?.find((i: any) => i.type === 'LOGO')?.url;
    const coverUrl = venue.venueImages?.find((i: any) => i.type === 'COVER')?.url;
    const courts: any[] = venue.courts || [];
    const amenities: any[] = venue.venueAmenities || [];
    const bookingPolicy = venue.bookingPolicy;
    const bankDetails = venue.venueBankDetails?.[0];
    const venueHoursArr: any[] = venue.venueHours || [];
    const venueHoursMap = venueHoursArr.reduce((acc: any, h: any) => {
        acc[h.day?.toUpperCase()] = h;
        return acc;
    }, {});

    const maskAccount = (val: string | null) => {
        if (!val) return '—';
        return '•••• •••• ' + val.slice(-4);
    };

    return (
        <div className="space-y-6 pb-28">
            {/* Back */}
            <button
                onClick={() => navigate('/admin/venues/pending')}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Pending Review
            </button>

            {/* Venue Profile */}
            <section className="rounded-xl bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-[hsl(var(--admin-lime))]" />
                    <h2 className="text-base font-semibold">Venue Profile</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex gap-3">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-lg object-cover" />
                        ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                                Logo
                            </div>
                        )}
                        {coverUrl ? (
                            <img src={coverUrl} alt="Cover" className="h-16 flex-1 rounded-lg object-cover" />
                        ) : (
                            <div className="flex h-16 flex-1 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                                Cover Photo
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <div>
                            <p className="text-xs text-muted-foreground">Venue Name</p>
                            <p className="text-sm font-medium">{venue.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">City</p>
                            <p className="text-sm flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                {venue.city}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <StatusBadge status={venue.status} />
                        </div>
                    </div>
                </div>

                {venue.owner && (
                    <div className="flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            {venue.owner.name} — {venue.owner.countryCode}{venue.owner.phone}
                        </span>
                    </div>
                )}
            </section>

            {/* Operating Hours */}
            <section className="rounded-xl bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-[hsl(var(--admin-lime))]" />
                    <h2 className="text-base font-semibold">Operating Hours</h2>
                </div>
                <div className="space-y-1">
                    {DAYS.map((day) => {
                        const hours = venueHoursMap[day.toUpperCase()];
                        const isOpen = hours?.isOpen;
                        return (
                            <div key={day} className="flex items-center justify-between py-1.5 text-sm">
                                <span className="w-24 font-medium">{day}</span>
                                {isOpen ? (
                                    <>
                                        <StatusBadge status="Open" variant="lime" />
                                        <span className="text-muted-foreground">
                                            {hours.openTime} – {hours.closeTime}
                                        </span>
                                    </>
                                ) : (
                                    <StatusBadge status="Closed" variant="slate" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Courts */}
            <section className="rounded-xl bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                    <Dumbbell className="h-5 w-5 text-[hsl(var(--admin-lime))]" />
                    <h2 className="text-base font-semibold">Courts ({courts.length})</h2>
                </div>
                {courts.length ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {courts.map((court: any) => (
                            <div key={court.id} className="rounded-lg border border-border p-4 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground/40 text-xl">
                                        🏸
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{court.name}</p>
                                        <div className="flex gap-1.5 mt-0.5">
                                            <StatusBadge status={court.sport} variant="blue" />
                                            <StatusBadge
                                                status={court.environment === 'INDOOR' ? 'Indoor' : 'Outdoor'}
                                                variant="slate"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {court.surface && (
                                    <p className="text-xs text-muted-foreground">Surface: {court.surface}</p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No courts added.</p>
                )}
            </section>

            {/* Amenities */}
            <section className="rounded-xl bg-card p-6 shadow-sm space-y-4">
                <h2 className="text-base font-semibold">Facilities & Amenities</h2>
                {amenities.length ? (
                    <div className="flex flex-wrap gap-2">
                        {amenities.map((a: any) => (
                            <span
                                key={a.id}
                                className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                            >
                                {a.name}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No amenities listed.</p>
                )}
            </section>

            {/* Pricing */}
            <section className="rounded-xl bg-card p-6 shadow-sm space-y-4">
                <h2 className="text-base font-semibold">Pricing</h2>
                {courts.length ? (
                    <Accordion type="multiple">
                        {courts.map((court: any) => {
                            const pricing = court.courtPricings?.[0];
                            return (
                                <AccordionItem key={court.id} value={court.id}>
                                    <AccordionTrigger className="text-sm">{court.name}</AccordionTrigger>
                                    <AccordionContent className="space-y-2 text-sm">
                                        {pricing ? (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Price Per Slot</span>
                                                <span className="font-medium">INR {pricing.pricePerSlot}</span>
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">No pricing set.</p>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                ) : (
                    <p className="text-sm text-muted-foreground">No courts to show pricing for.</p>
                )}
            </section>

            {/* Booking Policy */}
            {bookingPolicy && (
                <section className="rounded-xl bg-card p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-[hsl(var(--admin-lime))]" />
                        <h2 className="text-base font-semibold">Booking Policy</h2>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                        {bookingPolicy.cancellationWindowHours != null && (
                            <div>
                                <p className="text-xs text-muted-foreground">Cancellation Window</p>
                                <p className="font-medium">{bookingPolicy.cancellationWindowHours} hours</p>
                            </div>
                        )}
                        {bookingPolicy.refundPercentage != null && (
                            <div>
                                <p className="text-xs text-muted-foreground">Refund %</p>
                                <p className="font-medium">{bookingPolicy.refundPercentage}%</p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Bank Details */}
            {bankDetails && (
                <section className="rounded-xl bg-card p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-[hsl(var(--admin-lime))]" />
                        <h2 className="text-base font-semibold">Bank Details</h2>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                        <div>
                            <p className="text-xs text-muted-foreground">Bank Name</p>
                            <p className="font-medium">{bankDetails.bankName || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Account Holder</p>
                            <p className="font-medium">{bankDetails.accountHolderName || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Account Number</p>
                            <p className="font-medium font-mono">{maskAccount(bankDetails.accountNumber)}</p>
                        </div>
                    </div>
                </section>
            )}

            {/* Sticky Footer Action Bar */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card p-4 md:left-60">
                <div className="mx-auto flex max-w-5xl items-center justify-end gap-3">
                    <Button
                        onClick={() => setApproveOpen(true)}
                        disabled={approveMutation.isPending}
                        className="bg-[hsl(var(--admin-lime))] text-[hsl(var(--admin-lime-foreground))] hover:bg-[hsl(var(--admin-lime))]/90"
                    >
                        Approve Venue
                    </Button>
                </div>
            </div>

            {/* Approve dialog */}
            <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Approve {venue.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Approving {venue.name} will allow them to open their courts for public booking. Confirm?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => approveMutation.mutate()}
                            className="bg-[hsl(var(--admin-lime))] text-[hsl(var(--admin-lime-foreground))] hover:bg-[hsl(var(--admin-lime))]/90"
                        >
                            {approveMutation.isPending ? 'Approving...' : 'Approve'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default VenueReview;
