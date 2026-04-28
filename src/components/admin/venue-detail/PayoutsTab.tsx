import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DollarSign, Clock, CreditCard, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import { Button } from '../../ui/button';
import { Skeleton } from '../../ui/skeleton';
import { StatusBadge } from '../StatusBadge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../../ui/alert-dialog';
import { listPayouts, updatePayoutStatus } from '../../../api/adapters/payouts';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';

interface Props {
    venueId: string;
    venueName: string;
}

export default function VenuePayoutsTab({ venueId, venueName }: Props) {
    const { isSuperAdmin } = useAdminAuth();
    const queryClient = useQueryClient();
    const [processPayoutId, setProcessPayoutId] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-venue-payouts', venueId],
        queryFn: () => listPayouts({ venueId, limit: 100 }),
        select: (res) => res.payouts,
    });

    const payouts = data || [];

    const totalPaid =
        payouts.filter((p: any) => p.status === 'COMPLETED').reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
    const outstanding =
        payouts.filter((p: any) => p.status === 'PENDING').reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
    const lastPayout = payouts.find((p: any) => p.status === 'COMPLETED');

    const processMutation = useMutation({
        mutationFn: (id: string) => updatePayoutStatus(id, 'PROCESSING'),
        onSuccess: () => {
            toast.success('Payout processing');
            setProcessPayoutId(null);
            queryClient.invalidateQueries({ queryKey: ['admin-venue-payouts', venueId] });
        },
        onError: (err: any) => toast.error(err.message),
    });

    const downloadReceipt = (payout: any) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Payout Receipt', 20, 25);
        doc.setFontSize(11);
        const bankDetails = payout.venueBankDetails;
        const lines = [
            `Platform: BookEase`,
            `Venue: ${venueName}`,
            `Amount: INR ${payout.amount || 0}`,
            `Status: ${payout.status}`,
            `Bank: ${bankDetails?.bankName || '—'}`,
            `Account Holder: ${bankDetails?.accountHolderName || '—'}`,
            `Date: ${payout.settledAt ? new Date(payout.settledAt).toLocaleDateString() : '—'}`,
        ];
        lines.forEach((line, i) => doc.text(line, 20, 40 + i * 8));
        doc.save(`payout-${payout.id.slice(0, 8)}.pdf`);
    };

    const processTarget = payouts.find((p: any) => p.id === processPayoutId);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--admin-lime))]/10">
                            <DollarSign className="h-5 w-5 text-[hsl(var(--admin-lime))]" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Total Paid Out</p>
                            <p className="text-lg font-semibold">INR {totalPaid.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--admin-status-amber))]/10">
                            <Clock className="h-5 w-5 text-[hsl(var(--admin-status-amber))]" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Outstanding</p>
                            <p className="text-lg font-semibold">INR {outstanding.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Last Payout</p>
                            <p className="text-lg font-semibold">
                                {lastPayout
                                    ? `INR ${Number(lastPayout.amount).toLocaleString()}`
                                    : 'No payouts yet'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payout Records Table */}
            <div className="rounded-xl bg-card shadow-sm">
                {isLoading ? (
                    <div className="space-y-3 p-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : !payouts.length ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <DollarSign className="h-12 w-12 text-muted-foreground/30" />
                        <p className="mt-4 text-sm font-medium text-muted-foreground">No payout records</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left">
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Amount</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Settled</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payouts.map((p: any) => (
                                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {new Date(p.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 font-medium">INR {Number(p.amount || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={p.status} />
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">
                                            {p.settledAt ? new Date(p.settledAt).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                {isSuperAdmin && (p.status === 'PENDING' || p.status === 'FAILED') && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs"
                                                        onClick={() => setProcessPayoutId(p.id)}
                                                    >
                                                        {p.status === 'FAILED' ? 'Retry' : 'Process'}
                                                    </Button>
                                                )}
                                                {p.status === 'COMPLETED' && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-xs"
                                                        onClick={() => downloadReceipt(p)}
                                                    >
                                                        <FileText className="mr-1 h-3.5 w-3.5" />
                                                        Receipt
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Process Payout Confirmation */}
            <AlertDialog open={!!processPayoutId} onOpenChange={() => setProcessPayoutId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Process Payout</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to process a payout of INR{' '}
                            {Number(processTarget?.amount || 0).toLocaleString()} for {venueName}. Confirm?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => processPayoutId && processMutation.mutate(processPayoutId)}
                            disabled={processMutation.isPending}
                            className="bg-[hsl(var(--admin-lime))] text-[hsl(var(--admin-lime-foreground))] hover:bg-[hsl(var(--admin-lime))]/90"
                        >
                            {processMutation.isPending ? 'Processing...' : 'Confirm'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
