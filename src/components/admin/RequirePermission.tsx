import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import type { AdminPermission } from '../../utils/permissions';

/** Renders its children only for admins whose role includes the permission. */
export function RequirePermission({ permission, children }: { permission: AdminPermission; children: ReactNode }) {
    const { can } = useAdminAuth();
    if (!can(permission)) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl bg-card py-20 shadow-sm">
                <Lock className="h-12 w-12 text-muted-foreground/30" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">Restricted Access</h2>
                <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
                    Your role doesn't include access to this section. Ask a Super Admin if you need it.
                </p>
            </div>
        );
    }
    return <>{children}</>;
}
