import apiClient from '../client/apiClient';
import { endpoints } from '../../config/apiEndpoints';

export interface GenerateMagicLinkParams {
    venueName: string;
    venuemail: string;
    venuePhone: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    managerName: string;
    managerPhone: string;
    countryCode: string;
}

export const generateInviteMagicLink = (data: GenerateMagicLinkParams) =>
    apiClient<{ magicLink: string }>({
        url: endpoints.onboardGenerateMagicLink,
        method: 'POST',
        data,
    });
