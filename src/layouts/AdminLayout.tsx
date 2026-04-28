import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { LayoutDashboard, Building2, CalendarCheck, Menu } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { Sheet, SheetContent } from '../components/ui/sheet';
import { AdminTopbar } from '../components/admin/AdminTopBar';
import { AdminAuthProvider, useAdminAuth } from '../contexts/AdminAuthContext';
import { cn } from '../utils/twMerge';

function AdminLayoutInner() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const { adminUser, isLoading } = useAdminAuth();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--admin-bg))]">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[hsl(var(--admin-lime))] border-t-transparent" />
            </div>
        );
    }

    if (!adminUser) {
        return <Navigate to="/login" replace />;
    }

    const mobileBottomTabs = [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/admin/venues', icon: Building2, label: 'Venues' },
        { to: '/admin/bookings', icon: CalendarCheck, label: 'Bookings' },
    ];

    return (
        <div className="flex min-h-screen w-full bg-[hsl(var(--admin-bg))]">
            <div className="hidden md:block">
                <AdminSidebar
                    collapsed={collapsed}
                    onToggle={() => setCollapsed(!collapsed)}
                />
            </div>

            <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
                <SheetContent side="left" className="w-64 p-0 [&>button]:hidden">
                    <AdminSidebar collapsed={false} onToggle={() => setMobileDrawerOpen(false)} />
                </SheetContent>
            </Sheet>

            <div
                className={cn(
                    'flex flex-1 flex-col transition-all duration-200',
                    collapsed ? 'md:ml-16' : 'md:ml-60',
                )}
            >
                <div className="flex h-14 items-center gap-2 border-b border-border bg-card px-4 md:hidden">
                    <button
                        onClick={() => setMobileDrawerOpen(true)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--admin-navy))]">
                        <span className="text-xs font-bold text-[hsl(var(--admin-lime))]">B</span>
                    </div>
                    <span className="text-sm font-semibold">BookEase Admin</span>
                </div>

                <div className="hidden md:block">
                    <AdminTopbar />
                </div>

                <main className="flex-1 overflow-auto p-4 pb-20 md:p-6 md:pb-6">
                    <Outlet />
                </main>

                <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-border bg-card md:hidden">
                    {mobileBottomTabs.map((tab) => (
                        <NavLink
                            key={tab.to}
                            to={tab.to}
                            className={({ isActive }) =>
                                cn(
                                    'flex flex-col items-center gap-0.5 text-xs font-medium transition-colors',
                                    isActive
                                        ? 'text-[hsl(var(--admin-lime))]'
                                        : 'text-muted-foreground',
                                )
                            }
                        >
                            <tab.icon className="h-5 w-5" />
                            <span>{tab.label}</span>
                        </NavLink>
                    ))}
                    <button
                        onClick={() => setMobileDrawerOpen(true)}
                        className="flex flex-col items-center gap-0.5 text-xs font-medium text-muted-foreground"
                    >
                        <Menu className="h-5 w-5" />
                        <span>More</span>
                    </button>
                </nav>
            </div>
        </div>
    );
}

export function AdminLayout() {
    return (
        <AdminAuthProvider>
            <AdminLayoutInner />
        </AdminAuthProvider>
    );
}
