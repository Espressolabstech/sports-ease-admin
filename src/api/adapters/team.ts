import apiClient from '../client/apiClient';
import { endpoints } from '../../config/apiEndpoints';
import type { AdminPermission, AdminRoleName } from '../../utils/permissions';

export interface TeamAdmin {
    id: string;
    name: string | null;
    email: string | null;
    status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
    role: AdminRoleName;
    lastLoginAt: string | null;
    createdAt: string;
}

export interface RoleInfo {
    role: AdminRoleName;
    label: string;
    description: string;
    permissions: AdminPermission[];
}

export const listTeam = () =>
    apiClient<{ admins: TeamAdmin[]; roles: RoleInfo[] }>({ url: endpoints.team, method: 'GET' });

export const createAdmin = (data: { name: string; email: string; role: AdminRoleName; password: string }) =>
    apiClient<{ admin: TeamAdmin }>({ url: endpoints.team, method: 'POST', data });

export const updateAdmin = (
    id: string,
    data: { name?: string; role?: AdminRoleName; status?: 'ACTIVE' | 'INACTIVE'; password?: string },
) => apiClient<{ admin: TeamAdmin }>({ url: endpoints.teamMember(id), method: 'PATCH', data });
