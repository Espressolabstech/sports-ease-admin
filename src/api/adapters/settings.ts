import apiClient from '../client/apiClient';
import { endpoints } from '../../config/apiEndpoints';

export interface TierBenefit {
    tier: string;
    cancellationWindowHours: number;
    refundPercentage: number;
    bookingDiscountPct: number;
    canHoldCourt: boolean;
    holdDurationMinutes: number;
    earlyAccessHours: number;
}

export const getTierBenefits = () =>
    apiClient<{ tiers: TierBenefit[] }>({
        url: endpoints.settingsTiers,
        method: 'GET',
    });

export const updateTierBenefit = (tier: string, data: Partial<TierBenefit>) =>
    apiClient<{ tier: TierBenefit }>({
        url: endpoints.settingsTier(tier),
        method: 'PUT',
        data,
    });

export const getPlatformStats = () =>
    apiClient<{ totalUsers: number; totalVenues: number; totalBookings: number; totalRevenue: number }>({
        url: endpoints.platformStats,
        method: 'GET',
    });
