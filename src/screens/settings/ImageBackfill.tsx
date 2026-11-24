import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Images, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import apiClient from '../../api/client/apiClient';

type Job = {
    status: 'idle' | 'running' | 'done' | 'failed';
    startedAt: string | null;
    finishedAt: string | null;
    scanned: number;
    originals: number;
    missing: number;
    sent: number;
    failed: number;
    error: string | null;
};
type Status = { job: Job; functionName: string; prefix: string };

const getStatus = () => apiClient<Status>({ url: '/admin/images/backfill', method: 'GET' });
const start = () => apiClient<{ job: Job }>({ url: '/admin/images/backfill', method: 'POST' });

/**
 * Settings → Image sizes: makes the small copies (thumb / medium) for images uploaded before the image-variants
 * Lambda was set up. The server lists what's missing in S3 and hands it to the Lambda; this card shows progress.
 */
export default function ImageBackfill() {
    const queryClient = useQueryClient();
    const { data } = useQuery({
        queryKey: ['admin-image-backfill'],
        queryFn: getStatus,
        // Progress refreshes while a run is going (an admin-only page, a few seconds apart).
        refetchInterval: (q) => (q.state.data?.job.status === 'running' ? 2000 : false),
    });
    const run = useMutation({
        mutationFn: start,
        onSuccess: () => {
            toast.success('Started. The small copies are being made in the background.');
            void queryClient.invalidateQueries({ queryKey: ['admin-image-backfill'] });
        },
        onError: (err: { message?: string }) => toast.error(err.message || 'Could not start'),
    });
    const job = data?.job;
    const running = job?.status === 'running' || run.isPending;

    return (
        <div className="space-y-4 rounded-xl bg-card p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold">
                <Images className="h-5 w-5 text-[hsl(var(--admin-lime))]" /> Image sizes
            </h2>
            <p className="text-sm text-muted-foreground">
                New uploads get small copies automatically (thumb 200px, medium 800px), so pages load fast. Run this once to make them
                for images uploaded before that. Originals are never changed, and it&apos;s safe to run again: it only does what&apos;s missing.
            </p>
            {job && job.status !== 'idle' && (
                <div className="grid gap-3 sm:grid-cols-4">
                    {[
                        ['Files scanned', job.scanned],
                        ['Images', job.originals],
                        ['Needed copies', job.missing],
                        ['Sent to resize', job.sent],
                    ].map(([label, value]) => (
                        <div key={label as string} className="rounded-lg border border-border p-3">
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="mt-1 text-lg font-bold">{value}</p>
                        </div>
                    ))}
                </div>
            )}
            {job?.status === 'done' && (
                <p className="text-sm text-muted-foreground">
                    {job.missing === 0
                        ? 'Every image already has its small copies.'
                        : `Done: ${job.sent} images sent. The copies appear in S3 within a minute or two.`}
                    {job.failed > 0 && ` ${job.failed} could not be sent.`}
                </p>
            )}
            {job?.status === 'failed' && <p className="text-sm text-destructive">Failed: {job.error ?? 'unknown error'}</p>}
            {job?.error && job.status === 'done' && <p className="text-xs text-destructive">Last error: {job.error}</p>}
            <Button disabled={running} onClick={() => run.mutate()}>
                {running && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {running ? 'Working…' : 'Create small copies for existing images'}
            </Button>
            {data && <p className="text-xs text-muted-foreground">Lambda: {data.functionName} · Folder: {data.prefix || '(whole bucket)'}</p>}
        </div>
    );
}
