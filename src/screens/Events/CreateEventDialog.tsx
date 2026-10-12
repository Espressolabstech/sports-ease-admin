import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, UserPlus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { createEvent, createOrganizer, listOrganizers } from '../../api/adapters/events';

const blankDraft = {
    organizerId: '',
    title: '',
    venueName: '',
    venueArea: '',
    sport: 'PADEL' as 'PADEL' | 'PICKLEBALL',
    format: 'Americano · Individual',
    dateISO: '',
    dateEndISO: '',
    time: '09:00',
    endTime: '',
    capacity: 16,
    courts: 2,
    roundMinutes: 16,
    pointsPerRound: 24,
    skillLevel: 'INTERMEDIATE' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    priceInr: 0,
    registrationProfile: false,
    publish: true,
};

export default function CreateEventDialog({ onCreated }: { onCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(blankDraft);
    const [submitting, setSubmitting] = useState(false);

    const [hostSearch, setHostSearch] = useState('');
    const [newHostMode, setNewHostMode] = useState(false);
    const [newHostPhone, setNewHostPhone] = useState('');
    const [newHostName, setNewHostName] = useState('');
    const [creatingHost, setCreatingHost] = useState(false);

    const queryClient = useQueryClient();

    const { data: hostsData } = useQuery({
        queryKey: ['admin-organizers', hostSearch],
        queryFn: () => listOrganizers(hostSearch || undefined),
        enabled: open,
    });
    const organizers = hostsData?.organizers ?? [];

    const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
        setDraft((prev) => ({ ...prev, [key]: value }));

    const reset = () => {
        setDraft(blankDraft);
        setHostSearch('');
        setNewHostMode(false);
        setNewHostPhone('');
        setNewHostName('');
    };

    const handleCreateHost = async () => {
        if (!newHostPhone.trim() || !newHostName.trim()) {
            toast.error('Enter the host\'s phone number and name');
            return;
        }
        setCreatingHost(true);
        try {
            const { organizer } = await createOrganizer({ phone: newHostPhone.trim(), name: newHostName.trim() });
            await queryClient.invalidateQueries({ queryKey: ['admin-organizers'] });
            set('organizerId', organizer.id);
            setNewHostMode(false);
            toast.success(`Host "${organizer.name}" created`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not create host');
        } finally {
            setCreatingHost(false);
        }
    };

    const canSubmit =
        draft.organizerId &&
        draft.title.trim() &&
        draft.venueName.trim() &&
        draft.dateISO &&
        draft.time &&
        draft.capacity > 0 &&
        draft.courts > 0 &&
        draft.priceInr >= 0;

    const handleSubmit = async () => {
        if (!canSubmit) {
            toast.error('Fill in the required fields first');
            return;
        }
        setSubmitting(true);
        try {
            await createEvent({
                organizerId: draft.organizerId,
                title: draft.title.trim(),
                sport: draft.sport,
                format: draft.format.trim() || undefined,
                venueName: draft.venueName.trim(),
                venueArea: draft.venueArea.trim() || undefined,
                dateISO: draft.dateISO,
                dateEndISO: draft.dateEndISO || undefined,
                time: draft.time,
                endTime: draft.endTime || undefined,
                capacity: draft.capacity,
                courts: draft.courts,
                roundMinutes: draft.roundMinutes,
                pointsPerRound: draft.pointsPerRound,
                registrationProfile: draft.registrationProfile,
                skillLevel: draft.skillLevel,
                priceInr: draft.priceInr,
                publish: draft.publish,
            });
            toast.success('Event created');
            setOpen(false);
            reset();
            onCreated();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not create event');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                setOpen(o);
                if (!o) reset();
            }}
        >
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-1.5 h-4 w-4" /> Create event
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create a tournament</DialogTitle>
                    <DialogDescription>
                        Create an event for any host — or for a house/PlayPass-run event — without logging in as
                        them.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Host</Label>
                        {!newHostMode ? (
                            <div className="flex gap-2">
                                <Select value={draft.organizerId} onValueChange={(v) => set('organizerId', v)}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select a host" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="px-2 pb-1.5 pt-1">
                                            <Input
                                                value={hostSearch}
                                                onChange={(e) => setHostSearch(e.target.value)}
                                                placeholder="Search by name or phone…"
                                                className="h-8"
                                                onKeyDown={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        {organizers.map((o) => (
                                            <SelectItem key={o.id} value={o.id}>
                                                {o.name || 'Unnamed'} · {o.phone}
                                            </SelectItem>
                                        ))}
                                        {organizers.length === 0 && (
                                            <p className="px-2 py-1.5 text-xs text-muted-foreground">No hosts found</p>
                                        )}
                                    </SelectContent>
                                </Select>
                                <Button type="button" variant="outline" onClick={() => setNewHostMode(true)}>
                                    <UserPlus className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2 rounded-lg border p-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        value={newHostName}
                                        onChange={(e) => setNewHostName(e.target.value)}
                                        placeholder="Host name"
                                    />
                                    <Input
                                        value={newHostPhone}
                                        onChange={(e) => setNewHostPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        placeholder="Phone number"
                                        inputMode="numeric"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" size="sm" onClick={handleCreateHost} disabled={creatingHost}>
                                        {creatingHost ? 'Creating…' : 'Create host'}
                                    </Button>
                                    <Button type="button" size="sm" variant="ghost" onClick={() => setNewHostMode(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1.5">
                            <Label>Tournament name</Label>
                            <Input value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="The Court Collective 2026" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Venue name</Label>
                            <Input value={draft.venueName} onChange={(e) => set('venueName', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Venue area (optional)</Label>
                            <Input value={draft.venueArea} onChange={(e) => set('venueArea', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Sport</Label>
                            <Select value={draft.sport} onValueChange={(v) => set('sport', v as 'PADEL' | 'PICKLEBALL')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PADEL">Padel</SelectItem>
                                    <SelectItem value="PICKLEBALL">Pickleball</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Format</Label>
                            <Input value={draft.format} onChange={(e) => set('format', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Date</Label>
                            <Input type="date" value={draft.dateISO} onChange={(e) => set('dateISO', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Last day (multi-day, optional)</Label>
                            <Input type="date" value={draft.dateEndISO} onChange={(e) => set('dateEndISO', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Start time</Label>
                            <Input type="time" value={draft.time} onChange={(e) => set('time', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>End time (optional)</Label>
                            <Input type="time" value={draft.endTime} onChange={(e) => set('endTime', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Player cap</Label>
                            <Input
                                type="number"
                                value={draft.capacity}
                                onChange={(e) => set('capacity', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Courts</Label>
                            <Input type="number" value={draft.courts} onChange={(e) => set('courts', Number(e.target.value))} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Round minutes</Label>
                            <Input
                                type="number"
                                value={draft.roundMinutes}
                                onChange={(e) => set('roundMinutes', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Points per round</Label>
                            <Input
                                type="number"
                                value={draft.pointsPerRound}
                                onChange={(e) => set('pointsPerRound', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Skill level</Label>
                            <Select value={draft.skillLevel} onValueChange={(v) => set('skillLevel', v as typeof draft.skillLevel)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Entry fee (₹)</Label>
                            <Input
                                type="number"
                                value={draft.priceInr}
                                onChange={(e) => set('priceInr', Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                            <Label>Detailed registration</Label>
                            <p className="text-xs text-muted-foreground">
                                Collects email, photo, level, city and consent instead of just name &amp; phone.
                            </p>
                        </div>
                        <Switch checked={draft.registrationProfile} onCheckedChange={(v) => set('registrationProfile', v)} />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                            <Label>Publish immediately</Label>
                            <p className="text-xs text-muted-foreground">Off saves it as a draft instead.</p>
                        </div>
                        <Switch checked={draft.publish} onCheckedChange={(v) => set('publish', v)} />
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" onClick={handleSubmit} disabled={!canSubmit || submitting}>
                        {submitting ? 'Creating…' : 'Create event'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
