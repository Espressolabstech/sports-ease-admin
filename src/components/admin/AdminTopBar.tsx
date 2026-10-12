import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Bell, Command, Building2, Users, ArrowRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { listVenues } from '../../api/adapters/venues';
import { listPlayers } from '../../api/adapters/players';
import { listPendingVenues } from '../../api/adapters/venues';
import { listPayouts } from '../../api/adapters/payouts';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const routeTitles: Record<string, string> = {
    '/admin/dashboard': 'Dashboard',
    '/admin/invitations': 'Invitations',
    '/admin/venues': 'All Venues',
    '/admin/venues/pending': 'Pending Review',
    '/admin/courts': 'Courts',
    '/admin/bookings': 'Bookings',
    '/admin/payouts': 'Payouts',
    '/admin/players': 'Players',
    '/admin/settings': 'Settings',
    '/admin/ledger': 'Ledger',
    '/admin/events': 'Events',
    '/admin/team': 'Team & Roles',
};

export function AdminTopbar() {
    const { can } = useAdminAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [notifOpen, setNotifOpen] = useState(false);

    let pageTitle = routeTitles[location.pathname] || 'Admin';
    if (location.pathname.includes('/review')) pageTitle = 'Venue Review';
    if (location.pathname.match(/\/admin\/venues\/[^/]+$/) && !location.pathname.includes('pending'))
        pageTitle = 'Venue Detail';
    if (location.pathname.match(/\/admin\/events\/[^/]+$/)) pageTitle = 'Tournament Detail';
    if (location.pathname.match(/\/admin\/event-hosts\/[^/]+$/)) pageTitle = 'Host Detail';

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const { data: notifCounts } = useQuery({
        queryKey: ['admin-notif-counts'],
        refetchInterval: 60000,
        queryFn: async () => {
            // Only ask for what this role is allowed to see.
            const [pending, failed] = await Promise.all([
                can('venues.view') ? listPendingVenues() : Promise.resolve({ venues: [] }),
                can('payouts.view') ? listPayouts({ status: 'FAILED', limit: 1 }) : Promise.resolve({ pagination: { total: 0 } }),
            ]);
            const pendingVenues = pending.venues.length;
            const failedPayouts = failed.pagination.total;
            return { pendingVenues, failedPayouts, total: pendingVenues + failedPayouts };
        },
    });

    const { data: searchResults } = useQuery({
        queryKey: ['admin-search', searchQuery],
        enabled: searchQuery.length >= 2,
        queryFn: async () => {
            const [venues, players] = await Promise.all([
                can('venues.view') ? listVenues({ search: searchQuery, limit: 4 }) : Promise.resolve({ venues: [] }),
                can('players.view') ? listPlayers({ search: searchQuery, limit: 4 }) : Promise.resolve({ players: [] }),
            ]);
            return { venues: venues.venues, players: players.players };
        },
    });

    return (
        <>
            <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card px-6">
                <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>

                <button
                    onClick={() => setSearchOpen(true)}
                    className="mx-4 hidden max-w-md flex-1 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex"
                >
                    <Search className="h-4 w-4" />
                    <span className="flex-1 text-left">Search venues, players...</span>
                    <kbd className="flex items-center gap-0.5 rounded border border-border bg-card px-1.5 py-0.5 text-xs font-medium">
                        <Command className="h-3 w-3" />K
                    </kbd>
                </button>

                <div className="relative">
                    <button
                        onClick={() => setNotifOpen(!notifOpen)}
                        className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <Bell className="h-5 w-5" />
                        {(notifCounts?.total || 0) > 0 && (
                            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--admin-status-red))] px-1 text-[10px] font-bold text-white">
                                {notifCounts!.total}
                            </span>
                        )}
                    </button>

                    {notifOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                            <div className="absolute right-0 top-12 z-40 w-80 max-h-96 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
                                <div className="border-b border-border px-4 py-3">
                                    <h3 className="text-sm font-semibold">Notifications</h3>
                                </div>
                                <div className="divide-y divide-border">
                                    {(notifCounts?.pendingVenues || 0) > 0 && (
                                        <button
                                            onClick={() => { navigate('/admin/venues/pending'); setNotifOpen(false); }}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted/50"
                                        >
                                            <div className="h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--admin-status-amber))]" />
                                            <span className="flex-1">{notifCounts!.pendingVenues} venues awaiting review</span>
                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                        </button>
                                    )}
                                    {(notifCounts?.failedPayouts || 0) > 0 && (
                                        <button
                                            onClick={() => { navigate('/admin/payouts'); setNotifOpen(false); }}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted/50"
                                        >
                                            <div className="h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--admin-status-red))]" />
                                            <span className="flex-1">{notifCounts!.failedPayouts} failed payouts need attention</span>
                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                        </button>
                                    )}
                                    {(notifCounts?.total || 0) === 0 && (
                                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                            No new notifications
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </header>

            <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
                <CommandInput
                    placeholder="Search venues, players..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                />
                <CommandList>
                    <CommandEmpty>
                        {searchQuery.length < 2 ? 'Type to search...' : 'No results found.'}
                    </CommandEmpty>
                    {searchResults?.venues.length ? (
                        <CommandGroup heading="Venues">
                            {searchResults.venues.map((v: any) => (
                                <CommandItem
                                    key={v.id}
                                    onSelect={() => { navigate(`/admin/venues/${v.id}`); setSearchOpen(false); setSearchQuery(''); }}
                                >
                                    <Building2 className="mr-2 h-4 w-4" />
                                    <span className="flex-1">{v.name}</span>
                                    <span className="text-xs text-muted-foreground">{v.city}</span>
                                    <StatusBadge status={v.status} className="ml-2" />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    ) : null}
                    {searchResults?.players.length ? (
                        <CommandGroup heading="Players">
                            {searchResults.players.map((p: any) => (
                                <CommandItem
                                    key={p.id}
                                    onSelect={() => { navigate('/admin/players'); setSearchOpen(false); setSearchQuery(''); }}
                                >
                                    <Users className="mr-2 h-4 w-4" />
                                    <span className="flex-1">{p.name}</span>
                                    <span className="text-xs text-muted-foreground">{p.phone}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    ) : null}
                    {searchQuery.length < 2 && (
                        <CommandGroup heading="Pages">
                            {Object.entries(routeTitles).map(([path, label]) => (
                                <CommandItem
                                    key={path}
                                    onSelect={() => { navigate(path); setSearchOpen(false); }}
                                >
                                    {label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}
