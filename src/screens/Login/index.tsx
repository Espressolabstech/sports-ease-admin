import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { loginAdminWithPassword } from '../../api/adapters/auth';
import { setToken } from '../../utils/cookies.helpers';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) return;
        setLoading(true);
        try {
            const res = await loginAdminWithPassword(email.trim(), password.trim());
            setToken(res.token);
            navigate('/admin/dashboard', { replace: true });
        } catch (err: any) {
            toast.error(err.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--admin-bg))]">
            <div className="w-full max-w-sm space-y-8 px-4">
                <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--admin-navy))]">
                        <span className="text-lg font-bold text-[hsl(var(--admin-lime))]">B</span>
                    </div>
                    <h1 className="mt-4 text-xl font-semibold text-[hsl(var(--admin-navy))]">
                        BookEase Platform Admin
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Sign in with your admin email
                    </p>
                </div>

                <div className="space-y-3">
                    <Input
                        type="email"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        autoFocus
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    <Button
                        onClick={handleLogin}
                        disabled={loading || !email.trim() || !password.trim()}
                        className="w-full bg-[hsl(var(--admin-navy))] text-[hsl(var(--admin-navy-foreground))] hover:bg-[hsl(var(--admin-navy))]/90"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign In
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Login;
