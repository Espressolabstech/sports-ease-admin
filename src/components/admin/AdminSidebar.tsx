import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Mail,
    Building2,
    ClipboardList,
    CalendarCheck,
    DollarSign,
    BookOpen,
    Users,
    Settings,
    ChevronDown,
    ChevronRight,
    LogOut,
    PanelLeftClose,
    PanelLeft,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { useQuery } from '@tanstack/react-query';
import { cn } from '../../utils/twMerge';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { listPendingVenues } from '../../api/adapters/venues';

interface AdminSidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
    const location = useLocation();
    const { adminUser, isSuperAdmin, logout } = useAdminAuth();
    const [venuesOpen, setVenuesOpen] = useState(
        location.pathname.startsWith('/admin/venues') ||
            location.pathname.startsWith('/admin/courts'),
    );

    const { data: pendingData } = useQuery({
        queryKey: ['admin-pending-venues-count'],
        queryFn: () => listPendingVenues(),
        select: (res) => res.venues.length,
    });

    const pendingCount = pendingData ?? 0;

    const linkClass = (isActive: boolean) =>
        cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isActive
                ? 'bg-[hsl(var(--admin-lime))]/15 text-[hsl(var(--admin-lime))]'
                : 'text-[hsl(var(--admin-navy-foreground))]/70 hover:bg-[hsl(var(--admin-navy-foreground))]/5 hover:text-[hsl(var(--admin-navy-foreground))]',
        );

    const navItems = [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/admin/invitations', icon: Mail, label: 'Invitations' },
    ];

    const venueSubItems = [
        { to: '/admin/venues', label: 'All Venues' },
        { to: '/admin/venues/pending', label: 'Pending Review', badge: pendingCount },
    ];

    const bottomNavItems = [
        { to: '/admin/courts', icon: ClipboardList, label: 'Courts' },
        { to: '/admin/bookings', icon: CalendarCheck, label: 'Bookings' },
        ...(isSuperAdmin ? [{ to: '/admin/payouts', icon: DollarSign, label: 'Payouts' }] : []),
        { to: '/admin/ledger', icon: BookOpen, label: 'Ledger' },
        { to: '/admin/players', icon: Users, label: 'Players' },
        ...(isSuperAdmin ? [{ to: '/admin/settings', icon: Settings, label: 'Settings' }] : []),
    ];

    return (
        <aside
            className={cn(
                'fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-[hsl(var(--admin-navy))] transition-all duration-200',
                collapsed ? 'w-16' : 'w-60',
            )}
        >
            <div className="flex h-16 items-center justify-between px-4">
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--admin-lime))]">
                            <span className="text-sm font-bold text-[hsl(var(--admin-navy))]">B</span>
                        </div>
                        <span className="text-sm font-semibold text-[hsl(var(--admin-navy-foreground))]">
                            BookEase
                        </span>
                    </div>
                )}
                <button
                    onClick={onToggle}
                    className="rounded-lg p-1.5 text-[hsl(var(--admin-navy-foreground))]/60 hover:bg-[hsl(var(--admin-navy-foreground))]/10 hover:text-[hsl(var(--admin-navy-foreground))]"
                >
                    {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => linkClass(isActive)}
                        title={collapsed ? item.label : undefined}
                    >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}

                <div>
                    <button
                        onClick={() => setVenuesOpen(!venuesOpen)}
                        className={cn(
                            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            location.pathname.startsWith('/admin/venues')
                                ? 'text-[hsl(var(--admin-lime))]'
                                : 'text-[hsl(var(--admin-navy-foreground))]/70 hover:bg-[hsl(var(--admin-navy-foreground))]/5 hover:text-[hsl(var(--admin-navy-foreground))]',
                        )}
                    >
                        <Building2 className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                            <>
                                <span className="flex-1 text-left">Venues</span>
                                {venuesOpen ? (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                    <ChevronRight className="h-3.5 w-3.5" />
                                )}
                            </>
                        )}
                    </button>

                    {venuesOpen && !collapsed && (
                        <div className="ml-7 mt-1 space-y-1">
                            {venueSubItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end
                                    className={({ isActive }) =>
                                        cn(
                                            'flex items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-colors',
                                            isActive
                                                ? 'text-[hsl(var(--admin-lime))]'
                                                : 'text-[hsl(var(--admin-navy-foreground))]/60 hover:text-[hsl(var(--admin-navy-foreground))]',
                                        )
                                    }
                                >
                                    <span>{item.label}</span>
                                    {item.badge && item.badge > 0 ? (
                                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[hsl(var(--admin-status-amber))]/20 px-1.5 text-xs font-medium text-[hsl(var(--admin-status-amber))]">
                                            {item.badge}
                                        </span>
                                    ) : null}
                                </NavLink>
                            ))}
                        </div>
                    )}
                </div>

                {bottomNavItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => linkClass(isActive)}
                        title={collapsed ? item.label : undefined}
                    >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {adminUser && (
                <div className="border-t border-[hsl(var(--admin-navy-foreground))]/10 p-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--admin-lime))]/20 text-xs font-semibold text-[hsl(var(--admin-lime))]">
                            {adminUser.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                        </div>
                        {!collapsed && (
                            <div className="flex-1 overflow-hidden">
                                <p className="truncate text-sm font-medium text-[hsl(var(--admin-navy-foreground))]">
                                    {adminUser.name}
                                </p>
                                <StatusBadge
                                    status={adminUser.role}
                                    variant={adminUser.role === 'SUPER_ADMIN' ? 'lime' : 'blue'}
                                    className="mt-0.5"
                                />
                            </div>
                        )}
                        <button
                            onClick={logout}
                            className="rounded-lg p-1.5 text-[hsl(var(--admin-navy-foreground))]/50 hover:bg-[hsl(var(--admin-navy-foreground))]/10 hover:text-[hsl(var(--admin-status-red))]"
                            title="Sign out"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </aside>
    );
}
