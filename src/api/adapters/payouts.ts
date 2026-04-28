import apiClient from '../client/apiClient';
import { endpoints } from '../../config/apiEndpoints';

export interface PayoutListParams {
    status?: string;
    venueId?: string;
    page?: number;
    limit?: number;
}

export const listPayouts = (params?: PayoutListParams) =>
    apiClient<{ payouts: any[]; pagination: { total: number; page: number; limit: number } }>({
        url: endpoints.payouts,
        method: 'GET',
        params,
    });

export const updatePayoutStatus = (
    id: string,
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED',
    notes?: string,
    razorpayTransferId?: string,
) =>
    apiClient<{ payout: any }>({
        url: endpoints.payoutStatus(id),
        method: 'PATCH',
        data: { status, notes, razorpayTransferId },
    });
