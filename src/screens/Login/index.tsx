import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { loginAdmin, verifyAdminOtp } from '../../api/adapters/auth';
import { setToken } from '../../utils/cookies.helpers';

const Login = () => {
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async () => {
        if (!phone.trim()) return;
        setLoading(true);
        try {
            await loginAdmin(phone.trim());
            setStep('otp');
            toast.success('OTP sent to your phone');
        } catch (err: any) {
            toast.error(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp.trim()) return;
        setLoading(true);
        try {
            const res = await verifyAdminOtp(phone.trim(), otp.trim());
            setToken(res.token);
            navigate('/admin/dashboard', { replace: true });
        } catch (err: any) {
            toast.error(err.message || 'Invalid OTP');
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
                        {step === 'phone' ? 'Enter your phone number to sign in' : `Enter the OTP sent to ${phone}`}
                    </p>
                </div>

                <div className="space-y-3">
                    {step === 'phone' ? (
                        <>
                            <Input
                                type="tel"
                                placeholder="+971 50 000 0000"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                                autoFocus
                            />
                            <Button
                                onClick={handleSendOtp}
                                disabled={loading || !phone.trim()}
                                className="w-full bg-[hsl(var(--admin-navy))] text-[hsl(var(--admin-navy-foreground))] hover:bg-[hsl(var(--admin-navy))]/90"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send OTP
                            </Button>
                        </>
                    ) : (
                        <>
                            <Input
                                type="text"
                                inputMode="numeric"
                                placeholder="Enter 6-digit OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                                maxLength={6}
                                autoFocus
                            />
                            <Button
                                onClick={handleVerifyOtp}
                                disabled={loading || !otp.trim()}
                                className="w-full bg-[hsl(var(--admin-navy))] text-[hsl(var(--admin-navy-foreground))] hover:bg-[hsl(var(--admin-navy))]/90"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verify OTP
                            </Button>
                            <button
                                onClick={() => { setStep('phone'); setOtp(''); }}
                                className="w-full text-sm text-muted-foreground hover:text-foreground"
                            >
                                ← Change phone number
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
