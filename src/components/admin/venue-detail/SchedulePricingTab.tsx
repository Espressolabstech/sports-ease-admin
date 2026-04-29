import { useQuery } from '@tanstack/react-query';
import { StatusBadge } from '../../admin/StatusBadge';
import { Skeleton } from '../../ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion';
import { listCourts } from '../../../api/adapters/courts';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface Props {
    venueId: string;
    venue: any;
}

export default function VenueSchedulePricingTab({ venueId, venue }: Props) {
    const { data: courts, isLoading } = useQuery({
        queryKey: ['admin-venue-courts-schedule', venueId],
        queryFn: () => listCourts({ venueId, limit: 100 }),
        select: (res) => res.courts,
    });

    const venueHours: any[] = venue.venueHours || [];
    const operatingHoursMap = venueHours.reduce((acc: any, h: any) => {
        acc[h.day?.toLowerCase()] = h;
        return acc;
    }, {});

    if (isLoading) {
        return <Skeleton className="h-64 w-full rounded-xl" />;
    }

    return (
        <div className="space-y-6">
            {/* Operating Hours */}
            <div className="rounded-xl bg-card p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold">Venue Default Hours</h3>
                <div className="space-y-2">
                    {DAYS.map((day, i) => {
                        const hours = operatingHoursMap[day];
                        const isOpen = hours && hours.isOpen;
                        return (
                            <div key={day} className="flex items-center gap-4 text-sm">
                                <span className="w-24 font-medium">{DAY_LABELS[i]}</span>
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
            </div>

            {/* Court Pricing */}
            <div className="rounded-xl bg-card p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold">Court Pricing</h3>
                {courts?.length ? (
                    <Accordion type="multiple" defaultValue={courts.map((c: any) => c.id)}>
                        {courts.map((court: any) => {
                            const pricing = court.courtPricings?.[0];

                            return (
                                <AccordionItem key={court.id} value={court.id}>
                                    <AccordionTrigger className="text-sm">
                                        <div className="flex items-center gap-2">
                                            {court.name}
                                            <StatusBadge
                                                status={court.sport}
                                                variant={court.sport?.toLowerCase() === 'padel' ? 'blue' : 'lime'}
                                            />
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-3 text-sm">
                                        {pricing ? (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Price Per Slot</span>
                                                    <span className="font-medium">INR {pricing.pricePerSlot}</span>
                                                </div>
                                                {pricing.slotDuration && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Slot Duration</span>
                                                        <span className="font-medium">{pricing.slotDuration} min</span>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-muted-foreground">No pricing configured.</p>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                ) : (
                    <p className="text-sm text-muted-foreground">No courts found.</p>
                )}
            </div>
        </div>
    );
}
