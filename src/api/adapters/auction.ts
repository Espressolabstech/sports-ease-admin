import apiClient from '../client/apiClient';

/** Platform-admin auction endpoints (validateAdmin + events.manage). apiClient
 *  already unwraps `data`; it's re-wrapped so the console components ported
 *  from the player app keep their `{ data }` shape. */
const base = (eventId: string, path = '') => `/admin/events/${eventId}/auction${path}`;
const wrap = async <T>(p: Promise<T>): Promise<ApiResponse<T>> => ({ data: await p });

export const getAuctionBoard = (eventId: string) =>
    wrap(apiClient<ApiAuctionBoardData>({ url: base(eventId, '/board'), method: 'GET' }));

export const getAuctionTransactions = (eventId: string) =>
    wrap(apiClient<ApiAuctionTransactionsData>({ url: base(eventId, '/transactions'), method: 'GET' }));

export const setupAuction = (eventId: string) => wrap(apiClient<null>({ url: base(eventId, '/setup'), method: 'POST' }));

export const syncAuctionPlayers = (eventId: string) =>
    wrap(apiClient<{ added: number; removed: number }>({ url: base(eventId, '/sync-players'), method: 'POST' }));

export const createAuctionTeam = (eventId: string, data: { name: string; purseInr: number }) =>
    wrap(apiClient<{ team: ApiAuctionTeam }>({ url: base(eventId, '/teams'), method: 'POST', data }));

export const updateAuctionTeam = (
    eventId: string,
    teamId: string,
    data: { name?: string; purseInr?: number; logoUrl?: string | null },
) => wrap(apiClient<{ team: ApiAuctionTeam }>({ url: base(eventId, `/teams/${teamId}`), method: 'PATCH', data }));

export const deleteAuctionTeam = (eventId: string, teamId: string) =>
    wrap(apiClient<null>({ url: base(eventId, `/teams/${teamId}`), method: 'DELETE' }));

export const getAuctionTeamLogoUploadUrl = (eventId: string, mimetype: string) =>
    wrap(
        apiClient<{ uploadUrl: string; publicUrl: string }>({
            url: base(eventId, '/teams/logo-upload-url'),
            method: 'POST',
            data: { mimetype },
        }),
    );

export const createAuctionCategory = (
    eventId: string,
    data: { name: string; basePriceInr: number; retentionMultiplier?: number },
) => wrap(apiClient<{ category: ApiAuctionCategory }>({ url: base(eventId, '/categories'), method: 'POST', data }));

export const updateAuctionCategory = (
    eventId: string,
    categoryId: string,
    data: { name?: string; basePriceInr?: number; retentionMultiplier?: number },
) =>
    wrap(
        apiClient<{ category: ApiAuctionCategory }>({ url: base(eventId, `/categories/${categoryId}`), method: 'PATCH', data }),
    );

export const moveAuctionCategory = (eventId: string, categoryId: string, direction: -1 | 1) =>
    wrap(apiClient<null>({ url: base(eventId, `/categories/${categoryId}/move`), method: 'POST', data: { direction } }));

export const assignAuctionLots = (eventId: string, lotIds: string[], categoryId: string | null) =>
    wrap(apiClient<null>({ url: base(eventId, '/lots/assign'), method: 'POST', data: { lotIds, categoryId } }));

export const assignSuggestedAuctionLots = (eventId: string) =>
    wrap(apiClient<{ assigned: number }>({ url: base(eventId, '/lots/assign-suggested'), method: 'POST' }));

export const retainAuctionPlayer = (eventId: string, lotId: string, teamId: string) =>
    wrap(apiClient<null>({ url: base(eventId, '/retain'), method: 'POST', data: { lotId, teamId } }));

export const unretainAuctionPlayer = (eventId: string, lotId: string) =>
    wrap(apiClient<null>({ url: base(eventId, '/unretain'), method: 'POST', data: { lotId } }));
