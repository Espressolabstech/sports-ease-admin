export const endpoints = {
    // Auth
    login: '/admin/login',
    verifyOtp: '/admin/verify-otp',
    me: '/admin/me',

    // Dashboard
    dashboard: '/admin/dashboard',
    bookingsOverTime: '/admin/dashboard/bookings-over-time',

    // Venues
    venues: '/admin/venues',
    venuesPendingReview: '/admin/venues/pending-review',
    venueDetail: (id: string) => `/admin/venues/${id}`,
    venueStatus: (id: string) => `/admin/venues/${id}/status`,
    venueCommission: (id: string) => `/admin/venues/${id}/commission`,
    venueBookingsMonthly: (id: string) => `/admin/venues/${id}/bookings-monthly`,

    // Courts
    courts: '/admin/courts',

    // Bookings
    bookings: '/admin/bookings',
    bookingDetail: (id: string) => `/admin/bookings/${id}`,
    bookingStatus: (id: string) => `/admin/bookings/${id}/status`,

    // Payouts
    payouts: '/admin/payouts',
    payoutStatus: (id: string) => `/admin/payouts/${id}/status`,

    // Ledger
    ledger: '/admin/ledger',
    walletLedger: '/admin/ledger/wallet',
    ledgerSummary: '/admin/ledger/summary',

    // Players
    players: '/admin/players',
    playerDetail: (id: string) => `/admin/players/${id}`,
    playerStatus: (id: string) => `/admin/players/${id}/status`,
    playerWalletAdjustment: (id: string) => `/admin/players/${id}/wallet-adjustment`,

    // Invitations
    invitations: '/admin/invitations',
    invitationRevoke: (id: string) => `/admin/invitations/${id}/revoke`,

    // Settings
    settingsTiers: '/admin/settings/tiers',
    settingsTier: (tier: string) => `/admin/settings/tiers/${tier}`,
    platformStats: '/admin/settings/platform-stats',
};
