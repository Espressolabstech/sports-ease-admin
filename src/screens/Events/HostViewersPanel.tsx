import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2, UserPlus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { createHostViewer, deleteHostViewer, listHostViewers } from '../../api/adapters/events';

/**
 * Who can log into this event's public /host-preview page — a phone+OTP
 * login scoped to exactly this one event, separate from the event's own
 * organizer account. Created only here, from the admin dashboard.
 */
export default function HostViewersPanel({ eventId }: { eventId: string }) {
    const queryClient = useQueryClient();
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [adding, setAdding] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-event-host-viewers', eventId],
        queryFn: () => listHostViewers(eventId),
    });
    const viewers = data?.viewers ?? [];

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-event-host-viewers', eventId] });

    const handleAdd = async () => {
        if (!/^\d{10}$/.test(phone) || !name.trim()) {
            toast.error('Enter a valid 10-digit phone number and a name');
            return;
        }
        setAdding(true);
        try {
            await createHostViewer(eventId, { phone, name: name.trim() });
            setPhone('');
            setName('');
            refresh();
            toast.success('Host viewer added');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not add host viewer');
        } finally {
            setAdding(false);
        }
    };

    const handleRemove = async (viewerId: string) => {
        try {
            await deleteHostViewer(eventId, viewerId);
            refresh();
            toast.success('Access removed');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not remove access');
        }
    };

    return (
        <div className="rounded-xl bg-card p-6 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold">Host preview access</h2>
            <p className="mb-3 text-xs text-muted-foreground">
                Phone numbers that can log into this event's public /host-preview page — separate from the
                organizer account.
            </p>

            <div className="mb-4 flex gap-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="flex-1" />
                <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Phone number"
                    inputMode="numeric"
                    className="flex-1"
                />
                <Button type="button" size="icon" onClick={handleAdd} disabled={adding}>
                    <UserPlus className="h-4 w-4" />
                </Button>
            </div>

            {isLoading ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
            ) : viewers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No one has access yet.</p>
            ) : (
                <div className="divide-y divide-border">
                    {viewers.map((v) => (
                        <div key={v.id} className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-sm font-medium">{v.name}</p>
                                <p className="text-xs text-muted-foreground">{v.phone}</p>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemove(v.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
