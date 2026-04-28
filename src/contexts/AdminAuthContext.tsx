import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminMe } from '../api/adapters/auth';
import { getToken, setToken, clearCookies } from '../utils/cookies.helpers';

interface AdminUser {
    id: string;
    name: string;
    phone: string;
    role: string;
}

interface AdminAuthContextValue {
    adminUser: AdminUser | null;
    isSuperAdmin: boolean;
    isLoading: boolean;
    setAdminFromToken: (token: string, admin: AdminUser) => void;
    logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
    const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = getToken();
        if (!token) {
            setIsLoading(false);
            return;
        }
        getAdminMe()
            .then((res) => setAdminUser(res.admin))
            .catch(() => {
                clearCookies();
                navigate('/login', { replace: true });
            })
            .finally(() => setIsLoading(false));
    }, []);

    const setAdminFromToken = (token: string, admin: AdminUser) => {
        setToken(token);
        setAdminUser(admin);
    };

    const logout = () => {
        clearCookies();
        setAdminUser(null);
        navigate('/login', { replace: true });
    };

    return (
        <AdminAuthContext.Provider
            value={{
                adminUser,
                isSuperAdmin: adminUser?.role === 'SUPER_ADMIN' || adminUser?.role === 'ADMIN',
                isLoading,
                setAdminFromToken,
                logout,
            }}
        >
            {children}
        </AdminAuthContext.Provider>
    );
}

export function useAdminAuth() {
    const ctx = useContext(AdminAuthContext);
    if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
    return ctx;
}
