import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { toast } from 'sonner';
import { Lock, Check } from 'lucide-react';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { updateVenueCommission } from '../../../api/adapters/venues';

interface Props {
    venueId: string;
    venue: any;
}

export default function VenueSettingsTab({ venueId, venue }: Props) {
    const { isSuperAdmin } = useAdminAuth();

    if (!isSuperAdmin) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl bg-card py-20 shadow-sm">
                <Lock className="h-12 w-12 text-muted-foreground/30" />
                <h3 className="mt-4 text-lg font-semibold">Restricted Access</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Contact a Super Admin to modify venue settings.
                </p>
            </div>
        );
    }

    return <SettingsForm venueId={venueId} venue={venue} />;
}

function SettingsForm({ venueId, venue }: { venueId: string; venue: any }) {
    const queryClient = useQueryClient();
    const [savedCommission, setSavedCommission] = useState(false);

    const commissionMutation = useMutation({
        mutationFn: (rate: number) => updateVenueCommission(venueId, rate),
        onSuccess: () => {
            setSavedCommission(true);
            setTimeout(() => setSavedCommission(false), 2000);
            queryClient.invalidateQueries({ queryKey: ['admin-venue-detail', venueId] });
            toast.success('Commission rate updated');
        },
        onError: (err: any) => toast.error(err.message),
    });

    const debouncedCommission = useCallback(
        (() => {
            let timer: NodeJS.Timeout;
            return (value: string) => {
                clearTimeout(timer);
                if (!value) return;
                timer = setTimeout(() => {
                    commissionMutation.mutate(Number(value));
                }, 800);
            };
        })(),
        [venueId],
    );

    return (
        <div className="space-y-6">
            <div className="rounded-xl bg-card p-6 shadow-sm space-y-6">
                {/* Commission Rate */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Commission Rate (%)</label>
                        {savedCommission && (
                            <span className="flex items-center gap-1 text-xs text-[hsl(var(--admin-lime))]">
                                <Check className="h-3 w-3" /> Saved
                            </span>
                        )}
                    </div>
                    <Input
                        type="number"
                        defaultValue={venue.commissionRate ?? ''}
                        placeholder="Leave blank for platform default (10%)"
                        onChange={(e) => debouncedCommission(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Platform default is 10%. Leave blank to use the default.
                    </p>
                </div>

                {/* Onboarding Status */}
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium">Onboarded</label>
                        <p className="text-xs text-muted-foreground">
                            Indicates the venue has completed the onboarding process.
                        </p>
                    </div>
                    <span className="text-sm font-medium">
                        {venue.isOnBoarded ? 'Yes' : 'No'}
                    </span>
                </div>
            </div>
        </div>
    );
}
