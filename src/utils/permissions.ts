// Mirrors the API's permission list (sports-api/src/utils/permissions.ts).
// The API is the source of truth — it enforces every one of these — and the
// console gets the caller's list from /admin/me; this file only gives the
// permission names a type and the roles a display name.

export type AdminPermission =
    | 'dashboard.view'
    | 'venues.view'
    | 'venues.manage'
    | 'courts.view'
    | 'bookings.view'
    | 'bookings.manage'
    | 'players.view'
    | 'players.manage'
    | 'invitations.manage'
    | 'payouts.view'
    | 'payouts.manage'
    | 'ledger.view'
    | 'events.view'
    | 'events.manage'
    | 'events.payouts'
    | 'settings.view'
    | 'settings.manage'
    | 'admins.manage';

export type AdminRoleName = 'SUPER_ADMIN' | 'FINANCE' | 'OPERATIONS' | 'EVENTS' | 'SUPPORT';

export const ROLE_LABEL: Record<AdminRoleName, string> = {
    SUPER_ADMIN: 'Super Admin',
    FINANCE: 'Finance',
    OPERATIONS: 'Operations',
    EVENTS: 'Events',
    SUPPORT: 'Support',
};

export const PERMISSION_LABEL: Record<AdminPermission, string> = {
    'dashboard.view': 'View dashboard',
    'venues.view': 'View venues',
    'venues.manage': 'Manage venues',
    'courts.view': 'View courts',
    'bookings.view': 'View bookings',
    'bookings.manage': 'Manage bookings',
    'players.view': 'View players',
    'players.manage': 'Manage players',
    'invitations.manage': 'Manage invitations',
    'payouts.view': 'View venue payouts',
    'payouts.manage': 'Process venue payouts',
    'ledger.view': 'View platform ledger',
    'events.view': 'View events, hosts & event ledger',
    'events.manage': 'Create events for any host',
    'events.payouts': 'Pay tournament hosts',
    'settings.view': 'View settings',
    'settings.manage': 'Change settings',
    'admins.manage': 'Manage team & roles',
};
