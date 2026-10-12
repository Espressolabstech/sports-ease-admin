import type { EntrantStats, EventRow } from '../../api/adapters/events';

export const inr = (n: number, opts?: { decimals?: boolean }) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: opts?.decimals ? 2 : 0,
        maximumFractionDigits: opts?.decimals ? 2 : 0,
    }).format(n);

export const pct = (rate: number) => `${+(rate * 100).toFixed(2)}%`;

export const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export function fillLabel(row: Pick<EventRow, 'capacity'> & { stats: EntrantStats }) {
    return `${row.stats.registered}/${row.capacity}`;
}

export const EVENT_LEDGER_LABEL: Record<string, { label: string; cls: string }> = {
    EVENT_ENTRY_COLLECTED: { label: 'Entry fee collected', cls: 'bg-green-100 text-green-700' },
    EVENT_GATEWAY_FEE: { label: 'Gateway fee', cls: 'bg-orange-100 text-orange-700' },
    EVENT_COMMISSION_EARNED: { label: 'Platform fee', cls: 'bg-purple-100 text-purple-700' },
    EVENT_GST: { label: 'GST', cls: 'bg-slate-100 text-slate-700' },
    EVENT_HOST_PAYOUT: { label: 'Host payout', cls: 'bg-blue-100 text-blue-700' },
    EVENT_PAYOUT_REVERSED: { label: 'Payout reversed', cls: 'bg-red-100 text-red-700' },
};

export const PAYOUT_LABEL: Record<string, string> = {
    NOTHING_DUE: 'Nothing due',
    AWAITING_EVENT: 'After event',
    UNPAID: 'Unpaid',
    PARTIAL: 'Partly paid',
    PAID: 'Paid',
};
