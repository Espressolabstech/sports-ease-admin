import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, addDays, addWeeks } from 'date-fns';
import { Skeleton } from '../../ui/skeleton';
import { StatusBadge } from '../StatusBadge';
import { Button } from '../../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../ui/sheet';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../utils/twMerge';
import { listCourts } from '../../../api/adapters/courts';

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 19 }, (_, i) => i + 6);

interface Props {
    venueId: string;
}

export default function VenueCourtsTab({ venueId }: Props) {
    const [selectedCourt, setSelectedCourt] = useState<any>(null);
    const [weekOffset, setWeekOffset] = useState(0);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-venue-courts-tab', venueId],
        queryFn: () => listCourts({ venueId, limit: 100 }),
        select: (res) => res.courts,
    });

    const courts = data || [];

    const weekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const today = new Date();

    if (isLoading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
            </div>
        );
    }

    if (!courts.length) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl bg-card py-16 shadow-sm">
                <p className="text-sm text-muted-foreground">No courts found for this venue.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courts.map((court: any) => {
                    const pricePerSlot = court.courtPricings?.[0]?.pricePerSlot;
                    const pricingSummary = pricePerSlot ? `INR ${pricePerSlot}/slot` : 'No pricing set';

                    return (
                        <div key={court.id} className="rounded-xl bg-card shadow-sm overflow-hidden">
                            <div className="flex h-32 items-center justify-center bg-muted text-2xl text-muted-foreground/30">
                                🏸
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold">{court.name}</h4>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => setSelectedCourt(court)}
                                    >
                                        Details
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    <StatusBadge
                                        status={court.sport}
                                        variant={court.sport?.toLowerCase() === 'padel' ? 'blue' : 'lime'}
                                    />
                                    <StatusBadge
                                        status={court.environment === 'INDOOR' ? 'Indoor' : 'Outdoor'}
                                        variant="slate"
                                    />
                                </div>
                                {court.surface && (
                                    <p className="text-xs text-muted-foreground">Surface: {court.surface}</p>
                                )}
                                <p className="text-xs text-muted-foreground">{pricingSummary}</p>
                                <StatusBadge status={court.status} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Court Detail Drawer */}
            <Sheet open={!!selectedCourt} onOpenChange={(open) => !open && setSelectedCourt(null)}>
                <SheetContent className="w-full sm:w-[480px] overflow-y-auto">
                    {selectedCourt && (
                        <div className="space-y-6 pb-8">
                            <SheetHeader>
                                <SheetTitle>{selectedCourt.name}</SheetTitle>
                            </SheetHeader>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Sport</span>
                                    <StatusBadge status={selectedCourt.sport} variant="blue" />
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Environment</span>
                                    <span>{selectedCourt.environment === 'INDOOR' ? 'Indoor' : 'Outdoor'}</span>
                                </div>
                                {selectedCourt.surface && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Surface</span>
                                        <span>{selectedCourt.surface}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <StatusBadge status={selectedCourt.status} />
                                </div>
                            </div>

                            {/* Weekly Calendar */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-medium text-muted-foreground">
                                        Weekly Calendar
                                    </h4>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setWeekOffset((w) => w - 1)}
                                            className="rounded p-1 text-muted-foreground hover:text-foreground"
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5" />
                                        </button>
                                        <span className="text-xs text-muted-foreground">
                                            {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d')}
                                        </span>
                                        <button
                                            onClick={() => setWeekOffset((w) => w + 1)}
                                            className="rounded p-1 text-muted-foreground hover:text-foreground"
                                        >
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <div className="grid grid-cols-8 gap-px text-xs">
                                        <div className="p-1" />
                                        {weekDays.map((d, i) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    'p-1 text-center font-medium',
                                                    format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') &&
                                                        'text-[hsl(var(--admin-lime))]',
                                                )}
                                            >
                                                {DAYS_SHORT[i]}
                                                <br />
                                                <span className="text-muted-foreground">{format(d, 'd')}</span>
                                            </div>
                                        ))}
                                        {HOURS.map((hour) => (
                                            <>
                                                <div
                                                    key={`label-${hour}`}
                                                    className="p-1 text-right text-muted-foreground"
                                                >
                                                    {String(hour).padStart(2, '0')}:00
                                                </div>
                                                {weekDays.map((_, di) => (
                                                    <div
                                                        key={`${hour}-${di}`}
                                                        className="h-6 rounded-sm border border-border bg-card"
                                                    />
                                                ))}
                                            </>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
