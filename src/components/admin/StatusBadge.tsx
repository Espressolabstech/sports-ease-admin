import { cn } from '../../utils/twMerge';

type StatusVariant = 'lime' | 'amber' | 'blue' | 'red' | 'slate';

const statusMap: Record<string, StatusVariant> = {
    // Lime
    live: 'lime',
    active: 'lime',
    approved: 'lime',
    processed: 'lime',
    // Amber
    pending: 'amber',
    in_progress: 'amber',
    processing: 'amber',
    // Blue
    published: 'blue',
    submitted: 'blue',
    under_review: 'blue',
    link_opened: 'blue',
    // Red
    suspended: 'red',
    failed: 'red',
    banned: 'red',
    revoked: 'red',
    expired: 'red',
    // Slate
    draft: 'slate',
    completed: 'slate',
};

const variantStyles: Record<StatusVariant, string> = {
    lime: 'bg-[hsl(var(--admin-status-lime))]/15 text-[hsl(var(--admin-status-lime))]',
    amber: 'bg-[hsl(var(--admin-status-amber))]/15 text-[hsl(var(--admin-status-amber))]',
    blue: 'bg-[hsl(var(--admin-status-blue))]/15 text-[hsl(var(--admin-status-blue))]',
    red: 'bg-[hsl(var(--admin-status-red))]/15 text-[hsl(var(--admin-status-red))]',
    slate: 'bg-[hsl(var(--admin-status-slate))]/15 text-[hsl(var(--admin-status-slate))]',
};

interface StatusBadgeProps {
    status: string;
    variant?: StatusVariant;
    className?: string;
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
    const resolved =
        variant ||
        statusMap[status.toLowerCase().replace(/ /g, '_')] ||
        'slate';
    const label = status
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                variantStyles[resolved],
                className,
            )}
        >
            {label}
        </span>
    );
}
