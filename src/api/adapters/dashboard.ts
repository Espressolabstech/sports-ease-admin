import apiClient from '../client/apiClient';
import { endpoints } from '../../config/apiEndpoints';

export interface DashboardStats {
    activeVenues: number;
    pendingReview: number;
    liveCourts: number;
    bookingsToday: number;
    revenueToday: number;
    newPlayers7d: number;
}

export interface RewardsMonitoring {
    activeHolds: number;
    failedAuthVoids24h: number;
    failedRefundsPending: number;
    totalWalletLiability: number;
}

export interface DashboardResponse {
    stats: DashboardStats;
    rewardsMonitoring: RewardsMonitoring;
    liveActivity: any[];
    revenueByVenueThisMonth: { venueId: string; name: string; revenue: number }[];
    bookingDensityLast30Days: any[];
    bookingsOverTime: any[];
}

export const getDashboard = () =>
    apiClient<DashboardResponse>({
        url: endpoints.dashboard,
        method: 'GET',
    });

export const getBookingsOverTime = (period: '7d' | '30d' | '90d') =>
    apiClient<{ data: { date: string; count: number; revenue: number }[] }>({
        url: endpoints.bookingsOverTime,
        method: 'GET',
        params: { period },
    });
