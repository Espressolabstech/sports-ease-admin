import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { cn } from '../../utils/twMerge';
import type { Financials, PayoutStatus } from '../../api/adapters/events';
import { PAYOUT_LABEL, inr, pct } from './format';
import { StatusBadge } from '../../components/admin/StatusBadge';

export function StatCard({
    label,
    value,
    hint,
    icon: Icon,
    tone,
    loading,
}: {
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
    tone?: string;
    loading?: boolean;
}) {
    return (
        <div className="rounded-xl bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                {Icon && <Icon className={cn('h-4 w-4', tone ?? 'text-muted-foreground')} />}
            </div>
            <div className="mt-2">
                {loading ? (
                    <Skeleton className="h-7 w-20" />
                ) : (
                    <span className="text-2xl font-bold text-foreground">{value}</span>
                )}
            </div>
            {hint && !loading && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}

export function Pager({
    page,
    total,
    pageSize,
    onPage,
}: {
    page: number;
    total: number;
    pageSize: number;
    onPage: (p: number) => void;
}) {
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {total} total
            </p>
            <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => onPage(page - 1)} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onPage(page + 1)} disabled={page >= totalPages}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export function PillTabs<T extends string>({
    tabs,
    value,
    onChange,
}: {
    tabs: { key: T; label: string }[];
    value: T;
    onChange: (k: T) => void;
}) {
    return (
        <div className="inline-flex gap-1 rounded-lg bg-muted p-0.5">
            {tabs.map((t) => (
                <button
                    key={t.key}
                    onClick={() => onChange(t.key)}
                    className={cn(
                        'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                        value === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {t.label}
                </button>
            ))}
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3 p-6">
            {Array.from({ length: rows }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
    );
}

export function Row({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-4 py-2 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className={cn('text-right', strong ? 'font-semibold text-foreground' : 'text-foreground')}>{value}</span>
        </div>
    );
}

/** Fee-by-fee breakdown of what a set of tournaments earned and who's owed what. */
export function FinancialBreakdown({
    financials,
    rates,
    priceNote,
}: {
    financials: Financials;
    rates?: { platformFeeRate: number; gatewayFeeRate: number; gstRate: number };
    priceNote?: string;
}) {
    return (
        <div className="divide-y divide-border">
            <div className="pb-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Collected through the platform{priceNote ? ` · ${priceNote}` : ''}
                </p>
                <Row label="Online entry fees (gross)" value={inr(financials.onlineGross, { decimals: true })} strong />
                <Row
                    label={`Platform fee + GST${rates ? ` (${pct(rates.platformFeeRate)} + ${pct(rates.gstRate)})` : ''} — platform earning`}
                    value={`− ${inr(financials.platformFee + financials.platformFeeGst, { decimals: true })}`}
                />
                <Row
                    label={`Payment gateway fee + GST${rates ? ` (${pct(rates.gatewayFeeRate)} + ${pct(rates.gstRate)})` : ''} — Razorpay`}
                    value={`− ${inr(financials.gatewayFee + financials.gatewayFeeGst, { decimals: true })}`}
                />
                <Row
                    label={`Total GST${rates ? ` (${pct(rates.gstRate)} on both fees)` : ''}`}
                    value={`− ${inr(financials.platformFeeGst + financials.gatewayFeeGst, { decimals: true })}`}
                />
                <Row label="Total deductions" value={inr(financials.totalDeductions, { decimals: true })} />
                <Row label="Payable to host" value={inr(financials.hostNetPayable, { decimals: true })} strong />
            </div>
            <div className="pt-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Outside the platform
                </p>
                <Row label="Collected directly by host (cash / walk-in)" value={inr(financials.offlineCollected)} />
                <Row label="Outstanding from confirmed players" value={inr(financials.outstanding)} />
                <Row label="Expected gross if everyone paid" value={inr(financials.expectedGross)} />
            </div>
        </div>
    );
}


const payoutVariant: Record<PayoutStatus, 'lime' | 'amber' | 'blue' | 'slate'> = {
    PAID: 'lime',
    PARTIAL: 'blue',
    UNPAID: 'amber',
    NOTHING_DUE: 'slate',
    AWAITING_EVENT: 'slate',
};

/** Whether we've paid the host for a tournament. */
export function PayoutBadge({ status }: { status: PayoutStatus }) {
    return <StatusBadge status={PAYOUT_LABEL[status]} variant={payoutVariant[status]} />;
}
