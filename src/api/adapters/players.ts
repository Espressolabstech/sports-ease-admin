import apiClient from '../client/apiClient';
import { endpoints } from '../../config/apiEndpoints';

export interface PlayerListParams {
    search?: string;
    status?: string;
    venueId?: string;
    tier?: string;
    page?: number;
    limit?: number;
}

export const listPlayers = (params?: PlayerListParams) =>
    apiClient<{ players: any[]; pagination: { total: number; page: number; limit: number } }>({
        url: endpoints.players,
        method: 'GET',
        params,
    });

export const getPlayer = (id: string) =>
    apiClient<{ player: any }>({
        url: endpoints.playerDetail(id),
        method: 'GET',
    });

export const updatePlayerStatus = (id: string, status: 'ACTIVE' | 'INACTIVE' | 'BANNED') =>
    apiClient<{ player: any }>({
        url: endpoints.playerStatus(id),
        method: 'PATCH',
        data: { status },
    });

export const adjustPlayerWallet = (
    id: string,
    venueId: string,
    amount: number,
    type: 'CREDIT' | 'DEBIT',
    note?: string,
) =>
    apiClient<{ wallet: any; transaction: any }>({
        url: endpoints.playerWalletAdjustment(id),
        method: 'POST',
        data: { venueId, amount, type, note },
    });
