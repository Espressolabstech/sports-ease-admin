import apiClient from '../client/apiClient';
import { endpoints } from '../../config/apiEndpoints';

export const loginAdmin = (phone: string) =>
    apiClient<{ message: string }>({
        url: endpoints.login,
        method: 'POST',
        data: { phone },
    });

export const verifyAdminOtp = (phone: string, otp: string) =>
    apiClient<{ token: string; admin: { id: string; phone: string; name: string; role: string } }>({
        url: endpoints.verifyOtp,
        method: 'POST',
        data: { phone, otp },
    });

export const loginAdminWithPassword = (email: string, password: string) =>
    apiClient<{ token: string; admin: { id: string; email: string; name: string; role: string } }>({
        url: endpoints.loginWithPassword,
        method: 'POST',
        data: { email, password },
    });

export const getAdminMe = () =>
    apiClient<{ admin: { id: string; name: string; phone: string; role: string; createdAt: string } }>({
        url: endpoints.me,
        method: 'GET',
    });
