import { useMutation } from '@tanstack/react-query';
import { Copy, ExternalLink, Lock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { generateInviteMagicLink } from '../../api/adapters/onboarding';

const COUNTRY_CODES = ['+91', '+971', '+1', '+44', '+61', '+65'];

const INITIAL_FORM = {
    venueName: '',
    venuemail: '',
    venuePhone: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    managerName: '',
    managerPhone: '',
    countryCode: '+91',
};

const Field = ({
    label,
    required,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) => (
    <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
        {children}
    </div>
);

const OnboardVenue = () => {
    const [form, setForm] = useState(INITIAL_FORM);
    const [isPrivateClub, setIsPrivateClub] = useState(false);
    const [magicLink, setMagicLink] = useState('');
    const [clubLink, setClubLink] = useState('');

    const set = (key: keyof typeof INITIAL_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

    const mutation = useMutation({
        mutationFn: () => generateInviteMagicLink({ ...form, isPrivateClub }),
        onSuccess: (res) => {
            setMagicLink(res.magicLink);
            setClubLink(res.clubLink ?? '');
            toast.success('Magic link generated — email sent to venue');
            setForm(INITIAL_FORM);
        },
        onError: (err: any) => toast.error(err.message || 'Failed to generate magic link'),
    });

    const copyLink = async (link: string) => {
        await navigator.clipboard.writeText(link);
        toast.success('Link copied to clipboard');
    };

    const isValid =
        form.venueName &&
        form.venuemail &&
        /^\d{10}$/.test(form.venuePhone) &&
        form.city &&
        form.state &&
        form.country &&
        /^\d{6}$/.test(form.pincode) &&
        form.managerName &&
        /^\d{10}$/.test(form.managerPhone) &&
        form.countryCode;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold text-foreground">Onboard New Venue</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Creates the venue and manager account, then emails a magic link to the venue so they can complete onboarding.
                </p>
            </div>

            {/* Venue type selector */}
            <div className="rounded-xl bg-card shadow-sm">
                <div className="border-b border-border px-6 py-4">
                    <h2 className="text-sm font-semibold text-foreground">Venue Type</h2>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isPrivateClub ? 'bg-[hsl(var(--admin-navy))] text-[hsl(var(--admin-navy-foreground))]' : 'bg-muted text-muted-foreground'}`}>
                                <Lock className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">Private Club</p>
                                <p className="text-xs text-muted-foreground">
                                    Enables points-based booking system and member management for this venue.
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={isPrivateClub}
                            onCheckedChange={setIsPrivateClub}
                        />
                    </div>
                    {isPrivateClub && (
                        <p className="mt-3 text-xs text-[hsl(var(--admin-navy))]">
                            This venue will be set up as a private club with points enabled. Members will book using points instead of cash.
                        </p>
                    )}
                </div>
            </div>

            <div className="rounded-xl bg-card shadow-sm">
                <div className="border-b border-border px-6 py-4">
                    <h2 className="text-sm font-semibold text-foreground">Venue Details</h2>
                </div>
                <div className="grid gap-4 p-6 sm:grid-cols-2">
                    <Field label="Venue Name" required>
                        <Input placeholder="e.g. Ace Pickleball Club" value={form.venueName} onChange={set('venueName')} />
                    </Field>
                    <Field label="Venue Email" required>
                        <Input type="email" placeholder="venue@example.com" value={form.venuemail} onChange={set('venuemail')} />
                    </Field>
                    <Field label="Venue Phone" required>
                        <Input placeholder="10-digit number" value={form.venuePhone} onChange={set('venuePhone')} maxLength={10} />
                    </Field>
                    <Field label="City" required>
                        <Input placeholder="Mumbai" value={form.city} onChange={set('city')} />
                    </Field>
                    <Field label="State" required>
                        <Input placeholder="Maharashtra" value={form.state} onChange={set('state')} />
                    </Field>
                    <Field label="Country" required>
                        <Input placeholder="India" value={form.country} onChange={set('country')} />
                    </Field>
                    <Field label="Pincode" required>
                        <Input placeholder="6-digit pincode" value={form.pincode} onChange={set('pincode')} maxLength={6} />
                    </Field>
                </div>
            </div>

            <div className="rounded-xl bg-card shadow-sm">
                <div className="border-b border-border px-6 py-4">
                    <h2 className="text-sm font-semibold text-foreground">Manager Details</h2>
                </div>
                <div className="grid gap-4 p-6 sm:grid-cols-2">
                    <Field label="Manager Name" required>
                        <Input placeholder="Full name" value={form.managerName} onChange={set('managerName')} />
                    </Field>
                    <Field label="Country Code" required>
                        <select
                            value={form.countryCode}
                            onChange={set('countryCode')}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            {COUNTRY_CODES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Manager Phone" required>
                        <Input placeholder="10-digit number" value={form.managerPhone} onChange={set('managerPhone')} maxLength={10} />
                    </Field>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Button
                    onClick={() => mutation.mutate()}
                    disabled={!isValid || mutation.isPending}
                    className="bg-[hsl(var(--admin-lime))] text-[hsl(var(--admin-lime-foreground))] hover:bg-[hsl(var(--admin-lime))]/90"
                >
                    {mutation.isPending ? 'Generating...' : 'Generate Magic Link'}
                </Button>
                {isPrivateClub && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--admin-navy))]/10 px-3 py-1 text-xs font-medium text-[hsl(var(--admin-navy))]">
                        <Lock className="h-3 w-3" /> Private Club
                    </span>
                )}
            </div>

            {magicLink && (
                <div className="space-y-3">
                    {/* Onboarding magic link */}
                    <div className="rounded-xl border border-[hsl(var(--admin-lime))]/30 bg-[hsl(var(--admin-lime))]/5 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">Magic link generated — email sent to venue</p>
                            {clubLink && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--admin-navy))]/10 px-2 py-0.5 text-[10px] font-semibold text-[hsl(var(--admin-navy))]">
                                    <Lock className="h-2.5 w-2.5" /> Private Club
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">Share this link with the venue manager if the email doesn't arrive.</p>
                        <div className="flex items-center gap-2">
                            <Input value={magicLink} readOnly className="flex-1 bg-card text-xs font-mono" />
                            <Button size="icon" variant="outline" onClick={() => copyLink(magicLink)} title="Copy link">
                                <Copy className="h-4 w-4" />
                            </Button>
                            <a href={magicLink} target="_blank" rel="noopener noreferrer">
                                <Button size="icon" variant="outline" title="Open link">
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </a>
                        </div>
                    </div>

                    {/* Club member link — only for private clubs */}
                    {clubLink && (
                        <div className="rounded-xl border border-[hsl(var(--admin-navy))]/20 bg-[hsl(var(--admin-navy))]/5 p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4 text-[hsl(var(--admin-navy))]" />
                                <p className="text-sm font-medium text-foreground">Member club link</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                This link is where members log in and book courts. It's already included in the email — keep it for your records.
                            </p>
                            <div className="flex items-center gap-2">
                                <Input value={clubLink} readOnly className="flex-1 bg-card text-xs font-mono" />
                                <Button size="icon" variant="outline" onClick={() => copyLink(clubLink)} title="Copy club link">
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <a href={clubLink} target="_blank" rel="noopener noreferrer">
                                    <Button size="icon" variant="outline" title="Open club link">
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OnboardVenue;
