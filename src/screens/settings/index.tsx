import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';
import { Lock, Settings, Shield, Check } from 'lucide-react';
import { getTierBenefits, updateTierBenefit, getPlatformStats } from '../../api/adapters/settings';
import { useAdminAuth } from '../../contexts/AdminAuthContext';


export default function AdminSettingsPage() {
    const { can } = useAdminAuth();

    if (!can('settings.view')) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl bg-card py-20 shadow-sm">
                <Lock className="h-12 w-12 text-muted-foreground/30" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">Restricted Access</h2>
                <p className="mt-1 text-sm text-muted-foreground">Contact a Super Admin to modify platform settings.</p>
            </div>
        );
    }

    return <SettingsContent />;
}

function SettingsContent() {
    const queryClient = useQueryClient();

    const { data: tiersData, isLoading: tiersLoading } = useQuery({
        queryKey: ['admin-tier-benefits'],
        queryFn: () => getTierBenefits(),
        select: (res) => res.tiers,
    });

    const { data: platformStats } = useQuery({
        queryKey: ['admin-platform-stats'],
        queryFn: () => getPlatformStats(),
    });

    const [savedIndicator, setSavedIndicator] = useState<string | null>(null);
    const [editingTier, setEditingTier] = useState<any | null>(null);

    const updateTierMutation = useMutation({
        mutationFn: ({ tier, data }: { tier: string; data: any }) =>
            updateTierBenefit(tier, data),
        onSuccess: (_, { tier }) => {
            setSavedIndicator(tier);
            setTimeout(() => setSavedIndicator(null), 2000);
            queryClient.invalidateQueries({ queryKey: ['admin-tier-benefits'] });
            setEditingTier(null);
            toast.success('Tier updated');
        },
        onError: (err: any) => toast.error(err.message),
    });

    if (tiersLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Platform Stats */}
            {platformStats && (
                <div className="rounded-xl bg-card p-6 shadow-sm space-y-4">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                        <Shield className="h-5 w-5 text-[hsl(var(--admin-lime))]" /> Platform Overview
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { label: 'Total Users', value: platformStats.totalUsers },
                            { label: 'Total Venues', value: platformStats.totalVenues },
                            { label: 'Total Bookings', value: platformStats.totalBookings },
                            { label: 'Total Revenue', value: `INR ${platformStats.totalRevenue?.toLocaleString()}` },
                        ].map((s) => (
                            <div key={s.label} className="rounded-lg border border-border p-4">
                                <p className="text-xs text-muted-foreground">{s.label}</p>
                                <p className="text-xl font-bold mt-1">{s.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tier Benefits */}
            <div className="rounded-xl bg-card p-6 shadow-sm space-y-5">
                <h2 className="text-base font-semibold flex items-center gap-2">
                    <Settings className="h-5 w-5 text-[hsl(var(--admin-lime))]" /> Membership Tier Benefits
                </h2>
                <div className="space-y-4">
                    {(tiersData || []).map((tier: any) => (
                        <div key={tier.tier} className="rounded-lg border border-border p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold capitalize">{tier.tier}</h3>
                                <div className="flex items-center gap-2">
                                    {savedIndicator === tier.tier && (
                                        <span className="text-xs text-[hsl(var(--admin-status-lime))] flex items-center gap-1">
                                            <Check className="h-3 w-3" /> Saved
                                        </span>
                                    )}
                                    {editingTier?.tier === tier.tier ? (
                                        <>
                                            <Button size="sm" variant="outline" onClick={() => setEditingTier(null)}>Cancel</Button>
                                            <Button
                                                size="sm"
                                                onClick={() => updateTierMutation.mutate({ tier: tier.tier, data: editingTier })}
                                                disabled={updateTierMutation.isPending}
                                                className="bg-[hsl(var(--admin-lime))] text-[hsl(var(--admin-lime-foreground))] hover:bg-[hsl(var(--admin-lime))]/90"
                                            >
                                                Save
                                            </Button>
                                        </>
                                    ) : (
                                        <Button size="sm" variant="outline" onClick={() => setEditingTier({ ...tier })}>
                                            Edit
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                                {[
                                    { key: 'cancellationWindowHours', label: 'Cancellation Window (hrs)', type: 'number' },
                                    { key: 'refundPercentage', label: 'Refund %', type: 'number' },
                                    { key: 'bookingDiscountPct', label: 'Booking Discount %', type: 'number' },
                                    { key: 'holdDurationMinutes', label: 'Hold Duration (min)', type: 'number' },
                                    { key: 'earlyAccessHours', label: 'Early Access (hrs)', type: 'number' },
                                ].map((field) => (
                                    <div key={field.key}>
                                        <p className="text-xs text-muted-foreground mb-1">{field.label}</p>
                                        {editingTier?.tier === tier.tier ? (
                                            <Input
                                                type="number"
                                                value={editingTier[field.key] ?? ''}
                                                onChange={(e) => setEditingTier({ ...editingTier, [field.key]: Number(e.target.value) })}
                                                className="h-8 text-sm"
                                            />
                                        ) : (
                                            <p className="font-medium">{tier[field.key]}</p>
                                        )}
                                    </div>
                                ))}
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Can Hold Court</p>
                                    {editingTier?.tier === tier.tier ? (
                                        <Switch
                                            checked={editingTier.canHoldCourt}
                                            onCheckedChange={(v) => setEditingTier({ ...editingTier, canHoldCourt: v })}
                                        />
                                    ) : (
                                        <p className="font-medium">{tier.canHoldCourt ? 'Yes' : 'No'}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
