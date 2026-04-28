import apiClient from '../client/apiClient';
import { endpoints } from '../../config/apiEndpoints';

export interface BookingListParams {
    status?: string;
    venueId?: string;
    search?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}

export const listBookings = (params?: BookingListParams) =>
    apiClient<{ bookings: any[]; pagination: { total: number; page: number; limit: number } }>({
        url: endpoints.bookings,
        method: 'GET',
        params,
    });

export const getBooking = (id: string) =>
    apiClient<{ booking: any }>({
        url: endpoints.bookingDetail(id),
        method: 'GET',
    });

export const updateBookingStatus = (id: string, status: string, cancelReason?: string) =>
    apiClient<{ booking: any }>({
        url: endpoints.bookingStatus(id),
        method: 'PATCH',
        data: { status, cancelReason },
    });
