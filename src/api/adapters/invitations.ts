import apiClient from '../client/apiClient';
import { endpoints } from '../../config/apiEndpoints';

export interface InvitationListParams {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export const listInvitations = (params?: InvitationListParams) =>
    apiClient<{ invitations: any[]; pagination: { total: number; page: number; limit: number } }>({
        url: endpoints.invitations,
        method: 'GET',
        params,
    });

export const createInvitation = (venueId: string, phone?: string, expiresInDays?: number) =>
    apiClient<{ invitation: any }>({
        url: endpoints.invitations,
        method: 'POST',
        data: { venueId, phone, expiresInDays },
    });

export const revokeInvitation = (id: string) =>
    apiClient<{ invitation: any }>({
        url: endpoints.invitationRevoke(id),
        method: 'PATCH',
    });
