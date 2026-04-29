import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../../ui/dialog';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../ui/table';
import { toast } from 'sonner';
import { Skeleton } from '../../../ui/skeleton';
import { Button } from '../../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Label } from '../../../ui/label';
import { Input } from '../../../ui/input';
import { Textarea } from '../../../ui/textarea';
import { Switch } from '../../../ui/switch';

interface Props {
    venueId: string;
}

export default function CreditPackagesSubTab({ venueId }: Props) {
    const queryClient = useQueryClient();
    const [createOpen, setCreateOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [cashAmount, setCashAmount] = useState<number>(0);
    const [creditValue, setCreditValue] = useState<number>(0);
    const [description, setDescription] = useState('');
    const [active, setActive] = useState(true);
    const [tierGrant, setTierGrant] = useState<string>('');

    const { data: packages, isLoading } = useQuery<any[]>({
        queryKey: ['credit-packages', venueId],
        queryFn: async () => {
            // const { data } = await supabase
            //     .from('venue_credit_packages')
            //     .select('*')
            //     .eq('venue_id', venueId)
            //     .order('created_at', { ascending: false });
            // return data || [];
            return [];
        },
    });

    // Wallet liability
    const { data: walletLiability } = useQuery<{
        total: number;
        top5: { player_id: string; credit_balance: number }[];
    } | null>({
        queryKey: ['wallet-liability', venueId],
        queryFn: async () => {
            // const { data } = await supabase
            //     .from('player_venue_wallets')
            //     .select('player_id, credit_balance')
            //     .eq('venue_id', venueId)
            //     .order('credit_balance', { ascending: false });
            // const total = (data || []).reduce(
            //     (s, w) => s + (w.credit_balance || 0),
            //     0,
            // );
            // const top5 = (data || []).slice(0, 5);
            // return { total, top5, playerCount: (data || []).length };
            return null;
        },
    });

    const resetForm = () => {
        setName('');
        setCashAmount(0);
        setCreditValue(0);
        setDescription('');
        setActive(true);
        setTierGrant('');
        setEditId(null);
    };

    const openEdit = (pkg: any) => {
        setName(pkg.name);
        setCashAmount(pkg.cash_amount);
        setCreditValue(pkg.credit_value);
        setDescription(pkg.description || '');
        setActive(pkg.active);
        setTierGrant(pkg.tier_grant || '');
        setEditId(pkg.id);
        setCreateOpen(true);
    };

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (creditValue <= cashAmount)
                throw new Error(
                    'Credit value must be greater than cash amount',
                );
            if (editId) {
                // await supabase
                //     .from('venue_credit_packages')
                //     .update(payload as any)
                //     .eq('id', editId);
            } else {
                // await supabase.from('venue_credit_packages').insert({
                //     venue_id: venueId,
                //     ...payload,
                // } as any);
            }
        },
        onSuccess: () => {
            toast.success(editId ? 'Package updated.' : 'Package created.');
            setCreateOpen(false);
            resetForm();
            queryClient.invalidateQueries({
                queryKey: ['credit-packages', venueId],
            });
        },
        onError: (err: any) => toast.error(err.message),
    });

    const deactivateMutation = useMutation({
        mutationFn: async (_pkgId: string) => {
            // await supabase
            //     .from('venue_credit_packages')
            //     .update({ active: false })
            //     .eq('id', pkgId);
        },
        onSuccess: () => {
            toast.success('Package deactivated.');
            queryClient.invalidateQueries({
                queryKey: ['credit-packages', venueId],
            });
        },
    });

    const creditError =
        creditValue > 0 && cashAmount > 0 && creditValue <= cashAmount;

    if (isLoading) return <Skeleton className="h-64 w-full" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Credit Packages</h3>
                <Button
                    onClick={() => {
                        resetForm();
                        setCreateOpen(true);
                    }}
                >
                    Create Package
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Cash (₹)</TableHead>
                                <TableHead>Credits (₹)</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead>Tier Grant</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(packages || []).length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-center text-muted-foreground py-8"
                                    >
                                        No packages yet
                                    </TableCell>
                                </TableRow>
                            ) : (
                                (packages || []).map((pkg) => {
                                    const discount =
                                        pkg.cash_amount > 0
                                            ? (
                                                  ((pkg.credit_value -
                                                      pkg.cash_amount) /
                                                      pkg.credit_value) *
                                                  100
                                              ).toFixed(0)
                                            : '0';
                                    return (
                                        <TableRow key={pkg.id}>
                                            <TableCell className="font-medium">
                                                {pkg.name}
                                            </TableCell>
                                            <TableCell>
                                                ₹
                                                {pkg.cash_amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                ₹
                                                {pkg.credit_value.toLocaleString()}
                                            </TableCell>
                                            <TableCell>{discount}%</TableCell>
                                            <TableCell>
                                                {(pkg as any).tier_grant ? (
                                                    <Badge className="bg-primary/10 text-primary border-0 capitalize">
                                                        {
                                                            (pkg as any)
                                                                .tier_grant
                                                        }
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">
                                                        —
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        pkg.active
                                                            ? 'bg-success/10 text-success'
                                                            : 'bg-muted text-muted-foreground'
                                                    }
                                                >
                                                    {pkg.active
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            openEdit(pkg)
                                                        }
                                                    >
                                                        Edit
                                                    </Button>
                                                    {pkg.active && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-destructive"
                                                            onClick={() =>
                                                                deactivateMutation.mutate(
                                                                    pkg.id,
                                                                )
                                                            }
                                                        >
                                                            Deactivate
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Wallet Liability */}
            {walletLiability && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Wallet Liability
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                Total outstanding credits
                            </span>
                            <span className="font-semibold">
                                ₹{walletLiability.total.toLocaleString()}
                            </span>
                        </div>
                        {walletLiability.top5.length > 0 && (
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                    Top 5 by balance
                                </p>
                                {walletLiability.top5.map((w, i) => (
                                    <div
                                        key={i}
                                        className="flex justify-between text-sm py-1"
                                    >
                                        <span>{w.player_id.slice(0, 8)}…</span>
                                        <span className="font-medium">
                                            ₹
                                            {(
                                                w.credit_balance || 0
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Create/Edit Dialog */}
            <Dialog
                open={createOpen}
                onOpenChange={(o) => {
                    setCreateOpen(o);
                    if (!o) resetForm();
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editId ? 'Edit Package' : 'Create Package'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Name</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Starter Pack"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Cash Amount (₹)</Label>
                            <Input
                                type="number"
                                value={cashAmount}
                                onChange={(e) => setCashAmount(+e.target.value)}
                                min={0}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Credit Value (₹)</Label>
                            <Input
                                type="number"
                                value={creditValue}
                                onChange={(e) =>
                                    setCreditValue(+e.target.value)
                                }
                                min={0}
                            />
                            {creditError && (
                                <p className="text-xs text-destructive">
                                    Credit value must be greater than cash
                                    amount
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Tier Grant (optional)</Label>
                            <select
                                value={tierGrant}
                                onChange={(e) => setTierGrant(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="">None — no tier upgrade</option>
                                <option value="club">Club</option>
                                <option value="pro">Pro</option>
                                <option value="elite">Elite</option>
                            </select>
                            <p className="text-xs text-muted-foreground">
                                Player will be upgraded to this tier upon
                                purchase
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Description (optional)</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={active}
                                onCheckedChange={setActive}
                            />
                            <Label>Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setCreateOpen(false);
                                resetForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => saveMutation.mutate()}
                            disabled={
                                !name.trim() ||
                                cashAmount <= 0 ||
                                creditError ||
                                saveMutation.isPending
                            }
                        >
                            {saveMutation.isPending
                                ? 'Saving...'
                                : editId
                                  ? 'Update'
                                  : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
