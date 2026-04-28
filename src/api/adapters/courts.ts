import apiClient from '../client/apiClient';
import { endpoints } from '../../config/apiEndpoints';

export interface CourtListParams {
    sport?: string;
    venueId?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export const listCourts = (params?: CourtListParams) =>
    apiClient<{
        courts: any[];
        summary: { total: number; padel: number; pickelball: number };
        pagination: { total: number; page: number; limit: number };
    }>({
        url: endpoints.courts,
        method: 'GET',
        params,
    });
