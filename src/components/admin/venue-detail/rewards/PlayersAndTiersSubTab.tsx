import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Skeleton } from '../../../ui/skeleton';
import { Input } from '../../../ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../ui/table';
import { Avatar, AvatarFallback } from '../../../ui/avatar';
import { Badge } from '../../../ui/badge';
import { Progress } from '../../../ui/progress';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '../../../ui/sheet';
import { Separator } from '../../../ui/separator';
import { Button } from '../../../ui/button';
import { Label } from '../../../ui/label';
import { Textarea } from '../../../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../../../ui/radio-group';

interface Props {
    venueId: string;
}

const TIER_BADGE: Record<string, string> = {
    club: 'bg-muted text-muted-foreground',
    pro: 'bg-primary/10 text-primary',
    elite: 'bg-lime-500/10 text-lime-600',
};

const TIER_LABELS: Record<string, string> = {
    club: 'Club',
    pro: 'Pro',
    elite: 'Elite',
};

export default function PlayersAndTiersSubTab({ venueId }: Props) {
    const queryClient = useQueryClient();
    // const { adminUser } = useAdminAuth();
    const [search, setSearch] = useState('');
    const [tierFilter, setTierFilter] = useState<string>('all');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(
        null,
    );

    // Override form state
    const [overrideTier, setOverrideTier] = useState('');
    const [overrideReason, setOverrideReason] = useState('');
    const [overrideExpiry, setOverrideExpiry] = useState('next_boundary');

    // Fetch players with tiers at this venue
    const { data: players, isLoading } = useQuery<any[]>({
        queryKey: ['rewards-players', venueId, tierFilter],
        queryFn: async () => {
            // let query = supabase
            //     .from('player_venue_tiers')
            //     .select('*, player_venue_wallets(credit_balance)')
            //     .eq('venue_id', venueId);
            // if (tierFilter !== 'all') {
            //     query = query.eq('current_tier', tierFilter);
            // }
            // const { data, error } = await query;
            // if (error) throw error;
            // return data || [];
            return [];
        },
    });

    // Fetch tier config for progress bars
    const { data: tierConfig } = useQuery<any[]>({
        queryKey: ['venue-tier-config', venueId],
        queryFn: async () => {
            // const { data } = await supabase
            //     .from('venue_tier_config')
            //     .select('*')
            //     .eq('venue_id', venueId);
            // return data || [];
            return [];
        },
    });

    // Fetch feature usage for selected player
    const { data: featureUsage } = useQuery<{ holdCount: number; otcCount: number } | null>({
        queryKey: ['player-feature-usage', selectedPlayerId, venueId],
        enabled: !!selectedPlayerId,
        queryFn: async () => {
            // const monthYear = format(new Date(), 'yyyy-MM');
            // const { data } = await supabase
            //     .from('feature_usage_log')
            //     .select('*')
            //     .eq('player_id', selectedPlayerId!)
            //     .eq('venue_id', venueId)
            //     .eq('month_year', monthYear);
            // const holdCount = (data || []).filter(
            //     (d) => d.feature_type === 'hold',
            // ).length;
            // const otcCount = (data || []).filter(
            //     (d) => d.feature_type === 'otc',
            // ).length;
            // return { holdCount, otcCount };
            return null;
        },
    });

    // Fetch tier override for selected player
    const { data: existingOverride } = useQuery<{ override_tier: string; reason: string; expiry_type: string } | null>({
        queryKey: ['tier-override', selectedPlayerId, venueId],
        enabled: !!selectedPlayerId,
        queryFn: async () => {
            // const { data } = await supabase
            //     .from('tier_override_log')
            //     .select('*')
            //     .eq('player_id', selectedPlayerId!)
            //     .eq('venue_id', venueId)
            //     .order('created_at', { ascending: false })
            //     .limit(1);
            // return data && data.length > 0 ? data[0] : null;
            return null;
        },
    });

    // Override mutation
    const overrideMutation = useMutation({
        mutationFn: async () => {
            // const selectedPlayer = players?.find(
            //     (p) => p.player_id === selectedPlayerId,
            // );
            // await supabase.from('tier_override_log').insert({
            //     venue_id: venueId,
            //     player_id: selectedPlayerId!,
            //     admin_id: adminUser?.id!,
            //     previous_tier: selectedPlayer?.current_tier || 'club',
            //     override_tier: overrideTier,
            //     reason: overrideReason,
            //     expiry_type: overrideExpiry,
            // });
            // await supabase
            //     .from('player_venue_tiers')
            //     .update({ current_tier: overrideTier })
            //     .eq('player_id', selectedPlayerId!)
            //     .eq('venue_id', venueId);
            // await supabase.from('venue_audit_log').insert({
            //     venue_id: venueId,
            //     admin_id: adminUser?.id,
            //     action: 'tier_override',
            //     notes: `Overrode ${selectedPlayerId?.slice(0, 8)} to ${overrideTier}. Reason: ${overrideReason}`,
            // });
        },
        onSuccess: () => {
            toast.success('Tier override applied.');
            setOverrideTier('');
            setOverrideReason('');
            queryClient.invalidateQueries({
                queryKey: ['rewards-players', venueId],
            });
            queryClient.invalidateQueries({
                queryKey: ['tier-override', selectedPlayerId, venueId],
            });
        },
        onError: (err: any) => toast.error(err.message),
    });

    // Remove override mutation
    const removeOverrideMutation = useMutation({
        mutationFn: async () => {
            if (!existingOverride) return;
            // await supabase.from('tier_override_log').insert({
            //     venue_id: venueId,
            //     player_id: selectedPlayerId!,
            //     admin_id: adminUser?.id!,
            //     previous_tier: existingOverride.override_tier,
            //     override_tier: null,
            //     reason: 'Override removed by admin',
            //     expiry_type: null,
            // });
            // await supabase.rpc('check_upgrade', {
            //     _player_id: selectedPlayerId!,
            //     _venue_id: venueId,
            // });
        },
        onSuccess: () => {
            toast.success('Override removed.');
            queryClient.invalidateQueries({
                queryKey: ['rewards-players', venueId],
            });
            queryClient.invalidateQueries({
                queryKey: ['tier-override', selectedPlayerId, venueId],
            });
        },
        onError: (err: any) => toast.error(err.message),
    });

    const filteredPlayers = (players || []).filter((p) => {
        if (!search) return true;
        return p.player_id.toLowerCase().includes(search.toLowerCase());
    });

    const getNextTierConfig = (currentTier: string) => {
        if (currentTier === 'elite') return null;
        const nextTier = currentTier === 'club' ? 'pro' : 'elite';
        return tierConfig?.find((c) => c.tier_name === nextTier) || null;
    };

    const selectedPlayer = players?.find(
        (p) => p.player_id === selectedPlayerId,
    );

    if (isLoading) return <Skeleton className="h-64 w-full" />;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by player ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="All Tiers" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Tiers</SelectItem>
                        <SelectItem value="club">Club</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="elite">Elite</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Players table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Player</TableHead>
                                <TableHead>Tier</TableHead>
                                <TableHead>Progress</TableHead>
                                <TableHead>Window End</TableHead>
                                <TableHead className="text-right">
                                    Spend
                                </TableHead>
                                <TableHead className="text-right">
                                    Wallet
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPlayers.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center text-muted-foreground py-8"
                                    >
                                        No players found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPlayers.map((p) => {
                                    const nextConfig = getNextTierConfig(
                                        p.current_tier,
                                    );
                                    const spendPct = nextConfig
                                        ? Math.min(
                                              100,
                                              ((p.window_cash_paid || 0) /
                                                  nextConfig.min_spend) *
                                                  100,
                                          )
                                        : 100;
                                    const walletBal =
                                        (p as any).player_venue_wallets?.[0]
                                            ?.credit_balance || 0;

                                    return (
                                        <TableRow
                                            key={p.player_id}
                                            className="cursor-pointer hover:bg-accent/50"
                                            onClick={() => {
                                                setSelectedPlayerId(
                                                    p.player_id,
                                                );
                                                setDrawerOpen(true);
                                            }}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-7 w-7">
                                                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                            {p.player_id
                                                                .slice(0, 2)
                                                                .toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium">
                                                        {p.player_id.slice(
                                                            0,
                                                            8,
                                                        )}
                                                        …
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        TIER_BADGE[
                                                            p.current_tier
                                                        ] || ''
                                                    }
                                                >
                                                    {TIER_LABELS[
                                                        p.current_tier
                                                    ] || p.current_tier}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {nextConfig ? (
                                                    <div className="w-24">
                                                        <Progress
                                                            value={spendPct}
                                                            className="h-1.5"
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        Max tier
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {format(
                                                    new Date(
                                                        p.next_recalculation_at,
                                                    ),
                                                    'MMM d, yyyy',
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                ₹
                                                {(
                                                    p.window_cash_paid || 0
                                                ).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                ₹{walletBal.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            {/* Player Detail Drawer */}
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Player Details</SheetTitle>
                    </SheetHeader>

                    {selectedPlayer && (
                        <div className="mt-4 space-y-6">
                            {/* Player summary */}
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                        {selectedPlayer.player_id
                                            .slice(0, 2)
                                            .toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">
                                        {selectedPlayer.player_id.slice(0, 8)}…
                                    </p>
                                    <Badge
                                        className={
                                            TIER_BADGE[
                                                selectedPlayer.current_tier
                                            ] || ''
                                        }
                                    >
                                        {TIER_LABELS[
                                            selectedPlayer.current_tier
                                        ] || selectedPlayer.current_tier}
                                        {existingOverride?.override_tier && (
                                            <sup className="ml-0.5 text-[8px]">
                                                M
                                            </sup>
                                        )}
                                    </Badge>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <Card>
                                    <CardContent className="p-3 text-center">
                                        <p className="text-2xl font-bold">
                                            ₹
                                            {(
                                                selectedPlayer.window_cash_paid ||
                                                0
                                            ).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Spend
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-3 text-center">
                                        <p className="text-2xl font-bold">
                                            ₹
                                            {(
                                                selectedPlayer.window_cash_paid ||
                                                0
                                            ).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Spend
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-3 text-center">
                                        <p className="text-2xl font-bold">
                                            {featureUsage?.holdCount || 0}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Holds (Month)
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-3 text-center">
                                        <p className="text-2xl font-bold">
                                            {featureUsage?.otcCount || 0}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            OTC (Month)
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Progress to next tier */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">
                                        Progress to Next Tier
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {selectedPlayer.current_tier === 'elite' ? (
                                        <p className="text-sm text-muted-foreground">
                                            Maximum tier reached 🏆
                                        </p>
                                    ) : (
                                        (() => {
                                            const nextConfig =
                                                getNextTierConfig(
                                                    selectedPlayer.current_tier,
                                                );
                                            if (!nextConfig)
                                                return (
                                                    <p className="text-sm text-muted-foreground">
                                                        No config
                                                    </p>
                                                );
                                            return (
                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span>Spend</span>
                                                            <span>
                                                                ₹
                                                                {(
                                                                    selectedPlayer.window_cash_paid ||
                                                                    0
                                                                ).toLocaleString()}{' '}
                                                                / ₹
                                                                {nextConfig.min_spend.toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <Progress
                                                            value={Math.min(
                                                                100,
                                                                ((selectedPlayer.window_cash_paid ||
                                                                    0) /
                                                                    nextConfig.min_spend) *
                                                                    100,
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    )}
                                </CardContent>
                            </Card>

                            <Separator />

                            {/* Manual Tier Override */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">
                                        Manual Tier Override
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {existingOverride?.override_tier ? (
                                        <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-2">
                                            <p className="text-sm font-medium">
                                                Active override:{' '}
                                                <Badge
                                                    className={
                                                        TIER_BADGE[
                                                            existingOverride
                                                                .override_tier
                                                        ] || ''
                                                    }
                                                >
                                                    {TIER_LABELS[
                                                        existingOverride
                                                            .override_tier
                                                    ] ||
                                                        existingOverride.override_tier}
                                                </Badge>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Reason:{' '}
                                                {existingOverride.reason}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Type:{' '}
                                                {existingOverride.expiry_type}
                                            </p>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    removeOverrideMutation.mutate()
                                                }
                                                disabled={
                                                    removeOverrideMutation.isPending
                                                }
                                            >
                                                {removeOverrideMutation.isPending
                                                    ? 'Removing...'
                                                    : 'Remove Override'}
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">
                                                    Override Tier
                                                </Label>
                                                <Select
                                                    value={overrideTier}
                                                    onValueChange={
                                                        setOverrideTier
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select tier" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="club">
                                                            Club
                                                        </SelectItem>
                                                        <SelectItem value="pro">
                                                            Pro
                                                        </SelectItem>
                                                        <SelectItem value="elite">
                                                            Elite
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">
                                                    Reason (required)
                                                </Label>
                                                <Textarea
                                                    value={overrideReason}
                                                    onChange={(e) =>
                                                        setOverrideReason(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Why is this override being applied?"
                                                    className="min-h-[60px]"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">
                                                    Expiry
                                                </Label>
                                                <RadioGroup
                                                    value={overrideExpiry}
                                                    onValueChange={
                                                        setOverrideExpiry
                                                    }
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem
                                                            value="permanent"
                                                            id="permanent"
                                                        />
                                                        <Label
                                                            htmlFor="permanent"
                                                            className="text-sm"
                                                        >
                                                            Permanent
                                                        </Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem
                                                            value="next_boundary"
                                                            id="next_boundary"
                                                        />
                                                        <Label
                                                            htmlFor="next_boundary"
                                                            className="text-sm"
                                                        >
                                                            Until next
                                                            recalculation
                                                        </Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    overrideMutation.mutate()
                                                }
                                                disabled={
                                                    !overrideTier ||
                                                    !overrideReason.trim() ||
                                                    overrideMutation.isPending
                                                }
                                            >
                                                {overrideMutation.isPending
                                                    ? 'Applying...'
                                                    : 'Apply Override'}
                                            </Button>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
