import apiClient from '../client/apiClient';
import { endpoints } from '../../config/apiEndpoints';

export type EventPhase = 'DRAFT' | 'PUBLISHED' | 'LIVE' | 'COMPLETED';

export interface EntrantStats {
    registered: number;
    waitlisted: number;
    checkedIn: number;
    paidOnline: number;
    paidOffline: number;
    unpaid: number;
    paidWaitlisted: number;
    /** Refunded players — left out of every other count. */
    refunded: number;
}

export interface Financials {
    onlineGross: number;
    platformFee: number;
    platformFeeGst: number;
    gatewayFee: number;
    gatewayFeeGst: number;
    totalDeductions: number;
    hostNetPayable: number;
    offlineCollected: number;
    outstanding: number;
    expectedGross: number;
}

export interface FeeRates {
    platformFeeRate: number;
    gatewayFeeRate: number;
    gstRate: number;
}

export interface HostSummary {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    photoUrl: string | null;
}

export type PayoutStatus = 'NOTHING_DUE' | 'AWAITING_EVENT' | 'UNPAID' | 'PARTIAL' | 'PAID';

export interface PayoutInfo {
    /** Completed (non-voided) payouts made to the host. */
    paid: number;
    balanceDue: number;
    status: PayoutStatus;
    /** Tournament finished and there's a balance to record as paid. */
    canPayout: boolean;
}

export interface EventPayoutRecord {
    id: string;
    amount: number;
    method: string | null;
    reference: string | null;
    notes: string | null;
    status: 'COMPLETED' | 'VOIDED';
    paidAt: string;
    paidBy: { id: string; name: string | null } | null;
    voidedAt: string | null;
    voidedReason: string | null;
}

export type EventLedgerType =
    | 'EVENT_ENTRY_COLLECTED'
    | 'EVENT_GATEWAY_FEE'
    | 'EVENT_COMMISSION_EARNED'
    | 'EVENT_GST'
    | 'EVENT_HOST_PAYOUT'
    | 'EVENT_PAYOUT_REVERSED';

export interface EventLedgerEntry {
    id: string;
    type: EventLedgerType;
    amount: number;
    /** Memo rows record a figure (platform fee, GST) without moving cash. */
    memo: boolean;
    note: string | null;
    razorpayRef: string | null;
    createdAt: string;
    event: { id: string; title: string; hostId: string; hostName: string } | null;
    player: { id: string; name: string } | null;
    payout: { id: string; status: string; reference: string | null; method: string | null } | null;
}

export interface EventLedgerSummary {
    collected: number;
    gatewayFees: number;
    gatewayGst: number;
    platformFees: number;
    platformGst: number;
    paidToHosts: number;
    heldForHosts: number;
}

export interface EventRow {
    id: string;
    slug: string;
    title: string;
    sport: string;
    format: string;
    phase: EventPhase;
    eventDate: string;
    time: string;
    venueName: string;
    venueArea: string | null;
    capacity: number;
    priceInr: number;
    skillLevel: string;
    organizerId: string;
    stats: EntrantStats;
    financials: Financials;
    payout: PayoutInfo;
}

export interface EventListItem extends EventRow {
    host: HostSummary;
}

export interface Pagination {
    total: number;
    page: number;
    limit: number;
}

export interface EventsSummary {
    counts: { events: number; hosts: number; byPhase: Record<EventPhase, number> };
    players: EntrantStats;
    financials: Financials;
    payouts: { paidToHosts: number; dueToHosts: number };
    needsAttention: { paidButWaitlisted: number; liveEvents: number };
    monthly: { month: string; gross: number; platformFee: number }[];
    topEvents: { id: string; title: string; phase: EventPhase; onlineGross: number; platformFee: number }[];
    rates: FeeRates;
}

export interface EventEntrantRow {
    id: string;
    name: string;
    phone: string | null;
    paid: boolean;
    checkedIn: boolean;
    waitlisted: boolean;
    waitlistPosition: number | null;
    source: 'REGISTRATION' | 'WALK_IN';
    paymentMethod: 'ONLINE' | 'OFFLINE' | 'NONE' | 'REFUNDED' | 'REFUNDING';
    razorpayOrderId: string | null;
    /** Set for refunded players when the refund was made from this dashboard. */
    refund: { amount: number; refundId: string | null; at: string } | null;
    /** Paid online through PlayPass and not refunded yet. */
    canRefund: boolean;
    registeredAt: string;
    needsAttention: boolean;
    /**
     * Temporary manual-payment path (shared UPI QR, no Razorpay) — set until
     * a real gateway replaces this registration route. Needs a human to
     * check the screenshot/UPI reference against what actually came in.
     */
    manualPayment: { proofUrl: string | null; upiRef: string | null } | null;
}

export interface EventDetail {
    event: {
        id: string;
        slug: string;
        title: string;
        description: string | null;
        sport: string;
        format: string;
        phase: EventPhase;
        skillLevel: string;
        goldenPoint: boolean;
        eventDate: string;
        time: string;
        endTime: string | null;
        venueName: string;
        venueArea: string | null;
        capacity: number;
        courts: number;
        roundMinutes: number;
        pointsPerRound: number;
        priceInr: number;
        upiId: string | null;
        posterUrl: string | null;
        startedAt: string | null;
        plannedRounds: number | null;
        createdAt: string;
    };
    host: HostSummary;
    stats: EntrantStats;
    financials: Financials;
    payout: PayoutInfo;
    payouts: EventPayoutRecord[];
    entrants: EventEntrantRow[];
    play: {
        matches: { queued: number; active: number; completed: number };
        totalMatches: number;
        rounds: number;
        closedRounds: number;
    };
    rates: FeeRates;
}

export interface HostRow extends HostSummary {
    socialUrl: string | null;
    joinedAt: string;
    events: { total: number; live: number; completed: number };
    players: EntrantStats;
    financials: Financials;
    payouts: { paid: number; due: number };
}

export interface HostDetail {
    host: {
        id: string;
        name: string;
        phone: string;
        email: string | null;
        status: string;
        joinedAt: string;
        lastLoginAt: string | null;
        profile: {
            description: string | null;
            socialUrl: string | null;
            photoUrl: string | null;
            contactPhone: string | null;
        } | null;
    };
    events: EventRow[];
    players: EntrantStats;
    financials: Financials;
    payouts: { paid: number; due: number };
}

export interface EventListParams {
    search?: string;
    phase?: string;
    sport?: string;
    hostId?: string;
    page?: number;
    limit?: number;
}

export const getEventsSummary = () =>
    apiClient<EventsSummary>({ url: endpoints.eventsSummary, method: 'GET' });

export const listEvents = (params?: EventListParams) =>
    apiClient<{ events: EventListItem[]; pagination: Pagination }>({
        url: endpoints.events,
        method: 'GET',
        params,
    });

export const getEventDetail = (id: string) =>
    apiClient<EventDetail>({ url: endpoints.eventDetail(id), method: 'GET' });

export const listEventHosts = (params?: { search?: string; page?: number; limit?: number }) =>
    apiClient<{ hosts: HostRow[]; pagination: Pagination }>({
        url: endpoints.eventHosts,
        method: 'GET',
        params,
    });

export const getEventHostDetail = (id: string) =>
    apiClient<HostDetail>({ url: endpoints.eventHostDetail(id), method: 'GET' });

export interface EventLedgerParams {
    eventId?: string;
    hostId?: string;
    type?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}

export const listEventLedger = (params?: EventLedgerParams) =>
    apiClient<{ entries: EventLedgerEntry[]; summary: EventLedgerSummary; pagination: Pagination }>({
        url: endpoints.eventLedger,
        method: 'GET',
        params,
    });

export const createEventPayout = (
    eventId: string,
    data: { method?: string; reference?: string; notes?: string; paidAt?: string },
) => apiClient<{ payout: EventPayoutRecord; summary: PayoutInfo }>({ url: endpoints.eventPayouts(eventId), method: 'POST', data });

export const voidEventPayout = (payoutId: string, reason: string) =>
    apiClient<{ payout: EventPayoutRecord }>({ url: endpoints.eventPayoutVoid(payoutId), method: 'POST', data: { reason } });

/** Refunds the player's online fee through Razorpay and cancels their registration. */
export const refundEventEntrant = (eventId: string, entrantId: string, data: { amount: number; reason?: string }) =>
    apiClient<{ refundId: string; amount: number }>({ url: endpoints.eventEntrantRefund(eventId, entrantId), method: 'POST', data });

// ───── Court Collective league: per-team round locks + change ledger ─────
export type LeagueLockState = 'locked' | 'unlocked' | 'auto';
export interface LeagueLockSide {
    slot: number;
    code: string;
    name: string;
    logoUrl: string | null;
    locked: boolean;
    lockedByDeadline: boolean;
    override: 'locked' | 'unlocked' | null;
    confirmed: boolean;
    changedAfterLock: boolean;
}
export interface LeagueLocksView {
    setUp?: boolean;
    now?: string;
    rounds: { key: string; label: string; lockAt: string | null; ties: { number: number; lockedAt: string | null; sides: (LeagueLockSide | null)[] }[] }[];
}
export interface LeagueLedgerEntry {
    id: string;
    at: string;
    kind: string;
    who: string;
    by: { kind: 'organiser' | 'admin' | 'team' | 'system'; name: string; phone: string | null; role: string | null };
    tie: number | null;
    round: string | null;
    team: { slot: number; code: string; name: string } | null;
    changes: string[];
    warnings: string[];
}

export const getLeagueLocks = (eventId: string) => apiClient<LeagueLocksView>({ url: endpoints.eventLeagueLocks(eventId), method: 'GET' });
export const setLeagueLock = (eventId: string, data: { tie: number; slot: number; state: LeagueLockState }) =>
    apiClient<LeagueLocksView>({ url: endpoints.eventLeagueLocks(eventId), method: 'PUT', data });
export const getLeagueLedger = (eventId: string, params: { kind?: string; before?: string; limit?: number }) =>
    apiClient<{ entries: LeagueLedgerEntry[]; next: string | null; kinds: { kind: string; count: number }[] }>({
        url: endpoints.eventLeagueLog(eventId),
        method: 'GET',
        params,
    });

export interface OrganizerOption {
    id: string;
    name: string | null;
    phone: string;
}

export const listOrganizers = (search?: string) =>
    apiClient<{ organizers: OrganizerOption[] }>({ url: endpoints.organizers, method: 'GET', params: { search } });

export const createOrganizer = (data: { phone: string; name: string }) =>
    apiClient<{ organizer: OrganizerOption }>({ url: endpoints.organizers, method: 'POST', data });

export interface CreateEventBody {
    organizerId: string;
    title: string;
    description?: string;
    sport: 'PADEL' | 'PICKLEBALL';
    format?: string;
    venueName: string;
    venueArea?: string;
    dateISO: string;
    dateEndISO?: string;
    time: string;
    endTime?: string;
    capacity: number;
    courts: number;
    roundMinutes: number;
    pointsPerRound: number;
    registrationProfile?: boolean;
    skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    priceInr: number;
    publish?: boolean;
}

export const createEvent = (data: CreateEventBody) =>
    apiClient<{ event: { id: string; slug: string; title: string } }>({
        url: endpoints.events,
        method: 'POST',
        data,
    });

export interface HostViewer {
    id: string;
    name: string | null;
    phone: string;
    createdAt: string;
}

export const listHostViewers = (eventId: string) =>
    apiClient<{ viewers: HostViewer[] }>({ url: endpoints.eventHostViewers(eventId), method: 'GET' });

export const createHostViewer = (eventId: string, data: { phone: string; name: string }) =>
    apiClient<{ viewer: HostViewer }>({ url: endpoints.eventHostViewers(eventId), method: 'POST', data });

export const deleteHostViewer = (eventId: string, viewerId: string) =>
    apiClient<null>({ url: endpoints.eventHostViewer(eventId, viewerId), method: 'DELETE' });
