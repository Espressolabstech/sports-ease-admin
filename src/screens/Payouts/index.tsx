import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from 'sonner';
import { DollarSign, Lock, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import jsPDF from 'jspdf';
import { cn } from '../../utils/twMerge';
import { listPayouts, updatePayoutStatus } from '../../api/adapters/payouts';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const PAGE_SIZE = 25;
const PAYOUT_TABS = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] as const;

export default function AdminPayoutsPage() {
    const { can } = useAdminAuth();
    const canManage = can('payouts.manage');
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<string>('PENDING');
    const [page, setPage] = useState(1);
    const [processAllOpen, setProcessAllOpen] = useState(false);

    if (!can('payouts.view')) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl bg-card py-20 shadow-sm">
                <Lock className="h-12 w-12 text-muted-foreground/30" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">Restricted Access</h2>
                <p className="mt-1 text-sm text-muted-foreground">This section is restricted to Super Admins.</p>
            </div>
        );
    }

    const { data, isLoading } = useQuery({
        queryKey: ['admin-payouts-list', activeTab, page],
        queryFn: () => listPayouts({ status: activeTab, page, limit: PAGE_SIZE }),
    });

    const payouts = data?.payouts || [];
    const total = data?.pagination.total || 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    const processMutation = useMutation({
        mutationFn: (id: string) => updatePayoutStatus(id, 'PROCESSING'),
        onSuccess: () => {
            toast.success('Payout marked as processing.');
            queryClient.invalidateQueries({ queryKey: ['admin-payouts-list'] });
        },
        onError: (err: any) => toast.error(err.message),
    });

    const downloadReceipt = (payout: any) => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('PlayPass — Payout Receipt', 20, 25);
        doc.setFontSize(11);
        doc.text(`Venue: ${payout.venue?.name || '—'}`, 20, 45);
        doc.text(`Amount: INR ${payout.amount || 0}`, 20, 55);
        doc.text(`Status: ${payout.status}`, 20, 65);
        doc.text(`Date: ${payout.createdAt ? new Date(payout.createdAt).toLocaleDateString() : '—'}`, 20, 75);
        doc.save(`payout-receipt-${payout.id.slice(0, 8)}.pdf`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex gap-1 rounded-lg bg-muted p-0.5">
                    {PAYOUT_TABS.map((t) => (
                        <button
                            key={t}
                            onClick={() => { setActiveTab(t); setPage(1); }}
                            className={cn(
                                'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                                activeTab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
                            )}
                        >
                            {t.charAt(0) + t.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
                {canManage && activeTab === 'PENDING' && (
                    <Button
                        size="sm"
                        onClick={() => setProcessAllOpen(true)}
                        className="bg-[hsl(var(--admin-lime))] text-[hsl(var(--admin-lime-foreground))] hover:bg-[hsl(var(--admin-lime))]/90"
                    >
                        Process All Pending
                    </Button>
                )}
            </div>

            <div className="rounded-xl bg-card shadow-sm">
                {isLoading ? (
                    <div className="space-y-3 p-6">
                        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : payouts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <DollarSign className="h-12 w-12 text-muted-foreground/30" />
                        <p className="mt-4 text-sm font-medium text-muted-foreground">No payouts in this category.</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left">
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Venue</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Amount</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payouts.map((p: any) => (
                                        <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium">{p.venue?.name || '—'}</td>
                                            <td className="px-4 py-3">INR {p.amount || 0}</td>
                                            <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    {canManage && activeTab === 'PENDING' && (
                                                        <Button size="sm" variant="outline" onClick={() => processMutation.mutate(p.id)} disabled={processMutation.isPending}>
                                                            Process
                                                        </Button>
                                                    )}
                                                    {canManage && activeTab === 'FAILED' && (
                                                        <Button size="sm" variant="outline" onClick={() => processMutation.mutate(p.id)} disabled={processMutation.isPending}>
                                                            Retry
                                                        </Button>
                                                    )}
                                                    {activeTab === 'COMPLETED' && (
                                                        <Button size="sm" variant="ghost" onClick={() => downloadReceipt(p)} title="Download Receipt">
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="space-y-3 p-4 md:hidden">
                            {payouts.map((p: any) => (
                                <div key={p.id} className="rounded-lg border border-border p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">{p.venue?.name || '—'}</span>
                                        <StatusBadge status={p.status} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">INR {p.amount || 0}</p>
                                </div>
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-border px-4 py-3">
                                <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
                                <div className="flex gap-1">
                                    <Button size="icon" variant="ghost" onClick={() => setPage(page - 1)} disabled={page === 1}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Dialog open={processAllOpen} onOpenChange={setProcessAllOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Process All Pending Payouts</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground">This will mark all pending payouts as processing. Are you sure?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setProcessAllOpen(false)}>Cancel</Button>
                        <Button
                            onClick={() => {
                                payouts.forEach((p: any) => processMutation.mutate(p.id));
                                setProcessAllOpen(false);
                                toast.success('Processing all pending payouts.');
                            }}
                            className="bg-[hsl(var(--admin-lime))] text-[hsl(var(--admin-lime-foreground))] hover:bg-[hsl(var(--admin-lime))]/90"
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
