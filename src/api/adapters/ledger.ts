import apiClient from '../client/apiClient';
import { endpoints } from '../../config/apiEndpoints';

export interface LedgerListParams {
    type?: string;
    venueId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}

export const listLedger = (params?: LedgerListParams) =>
    apiClient<{
        entries: any[];
        totalAmount: number;
        pagination: { total: number; page: number; limit: number };
    }>({
        url: endpoints.ledger,
        method: 'GET',
        params,
    });

export const listWalletLedger = (params?: Omit<LedgerListParams, 'type'>) =>
    apiClient<{
        entries: any[];
        pagination: { total: number; page: number; limit: number };
    }>({
        url: endpoints.walletLedger,
        method: 'GET',
        params,
    });

export const getLedgerSummary = () =>
    apiClient<{
        totalInEscrow: number;
        commissionEarned: number;
        totalPaidOut: number;
        currentBalance: number;
        byType: { type: string; totalAmount: number; count: number }[];
    }>({
        url: endpoints.ledgerSummary,
        method: 'GET',
    });
