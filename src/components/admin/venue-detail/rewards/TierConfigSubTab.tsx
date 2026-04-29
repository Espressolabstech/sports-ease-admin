import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Badge } from '../../../ui/badge';
import { Skeleton } from '../../../ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../../../ui/alert-dialog';
import { toast } from 'sonner';

interface Props {
    venueId: string;
}

export default function TierConfigSubTab({ venueId }: Props) {
    const queryClient = useQueryClient();

    const { data: configs, isLoading } = useQuery<any[]>({
        queryKey: ['tier-config', venueId],
        queryFn: async () => [],
    });

    // Fetch current player counts for preview
    const { data: playerTiers } = useQuery<any[]>({
        queryKey: ['tier-config-preview-players', venueId],
        queryFn: async () => [],
    });

    const proConfig = configs?.find((c) => c.tier_name === 'pro');
    const eliteConfig = configs?.find((c) => c.tier_name === 'elite');

    const [proSpend, setProSpend] = useState<number>(0);

    const [eliteSpend, setEliteSpend] = useState<number>(0);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Initialize from DB
    if (configs && !initialized && !isLoading) {
        if (proConfig) {
            setProSpend(proConfig.min_spend);
        }
        if (eliteConfig) {
            setEliteSpend(eliteConfig.min_spend);
        }
        setInitialized(true);
    }

    // Preview: compute how players would redistribute
    const preview = useMemo(() => {
        if (!playerTiers) return null;
        let promotes = 0,
            demotes = 0;
        const newCounts: Record<string, number> = { club: 0, pro: 0, elite: 0 };

        playerTiers.forEach((p) => {
            const spend = p.window_cash_paid || 0;

            const meetsPro = spend >= proSpend;
            const meetsElite = spend >= eliteSpend;

            let newTier = 'club';
            if (meetsPro) newTier = 'pro';
            if (meetsElite && meetsPro) newTier = 'elite';

            newCounts[newTier]++;

            const tierRank: Record<string, number> = {
                club: 0,
                pro: 1,
                elite: 2,
            };
            if (tierRank[newTier] > tierRank[p.current_tier]) promotes++;
            if (tierRank[newTier] < tierRank[p.current_tier]) demotes++;
        });

        return { newCounts, promotes, demotes };
    }, [playerTiers, proSpend, eliteSpend]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            // Upsert pro
            if (proConfig) {
                
            } else {
            
            }

            // Upsert elite
            if (eliteConfig) {
                
            } else {
                
            }
        },
        onSuccess: () => {
            toast.success('Tier configuration saved.');
            setConfirmOpen(false);
            queryClient.invalidateQueries({
                queryKey: ['tier-config', venueId],
            });
        },
        onError: (err: any) => toast.error(err.message),
    });

    if (isLoading) return <Skeleton className="h-64 w-full" />;

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                {/* Pro */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Badge className="bg-primary/10 text-primary">
                                Pro
                            </Badge>
                            Threshold
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Min Spend (₹)</Label>
                            <Input
                                type="number"
                                value={proSpend}
                                onChange={(e) => setProSpend(+e.target.value)}
                                min={0}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Elite */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Badge className="bg-lime-500/10 text-lime-600">
                                Elite
                            </Badge>
                            Threshold
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Min Spend (₹)</Label>
                            <Input
                                type="number"
                                value={eliteSpend}
                                onChange={(e) => setEliteSpend(+e.target.value)}
                                min={0}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Live Preview */}
            {preview && playerTiers && playerTiers.length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm">
                            With these settings:{' '}
                            <strong>{preview.newCounts.club}</strong> Club,{' '}
                            <strong>{preview.newCounts.pro}</strong> Pro,{' '}
                            <strong>{preview.newCounts.elite}</strong> Elite.
                            {(preview.promotes > 0 || preview.demotes > 0) && (
                                <>
                                    {' '}
                                    Saving would{' '}
                                    <strong className="text-success">
                                        promote {preview.promotes}
                                    </strong>{' '}
                                    and{' '}
                                    <strong className="text-destructive">
                                        demote {preview.demotes}
                                    </strong>{' '}
                                    players.
                                </>
                            )}
                        </p>
                    </CardContent>
                </Card>
            )}

            <Button onClick={() => setConfirmOpen(true)}>
                Save Configuration
            </Button>

            {/* Confirmation dialog */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Confirm Tier Configuration
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {preview &&
                            (preview.promotes > 0 || preview.demotes > 0) ? (
                                <>
                                    This will promote {preview.promotes} and
                                    demote {preview.demotes} players. Are you
                                    sure?
                                </>
                            ) : (
                                <>Save the updated tier thresholds?</>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => saveMutation.mutate()}
                            disabled={saveMutation.isPending}
                        >
                            {saveMutation.isPending
                                ? 'Saving...'
                                : 'Confirm Save'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
