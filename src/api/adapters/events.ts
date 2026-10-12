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
    paymentMethod: 'ONLINE' | 'OFFLINE' | 'NONE';
    razorpayOrderId: string | null;
    registeredAt: string;
    needsAttention: boolean;
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
