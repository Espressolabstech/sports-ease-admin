import apiClient from '../client/apiClient';
import { endpoints } from '../../config/apiEndpoints';

export interface VenueListParams {
    status?: string;
    city?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export const listVenues = (params?: VenueListParams) =>
    apiClient<{ venues: any[]; pagination: { total: number; page: number; limit: number } }>({
        url: endpoints.venues,
        method: 'GET',
        params,
    });

export const listPendingVenues = () =>
    apiClient<{ venues: any[] }>({
        url: endpoints.venuesPendingReview,
        method: 'GET',
    });

export const getVenue = (id: string) =>
    apiClient<{ venue: any }>({
        url: endpoints.venueDetail(id),
        method: 'GET',
    });

export const updateVenueStatus = (id: string, status: string, reason?: string) =>
    apiClient<{ venue: any }>({
        url: endpoints.venueStatus(id),
        method: 'PATCH',
        data: { status, reason },
    });

export const updateVenueCommission = (id: string, commissionRate: number) =>
    apiClient<{ venue: any }>({
        url: endpoints.venueCommission(id),
        method: 'PATCH',
        data: { commissionRate },
    });

export const getVenueBookingsMonthly = (id: string) =>
    apiClient<{ data: { month: string; bookings: number }[] }>({
        url: endpoints.venueBookingsMonthly(id),
        method: 'GET',
    });
