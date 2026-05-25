import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const ResetPassword = () => {
    const { token } = useParams(); // Grabs the secure token from the URL
    const navigate = useNavigate();

    const [passwords, setPasswords] = useState({ password: '', confirm: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (passwords.password !== passwords.confirm) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('http://127.0.0.1:5000/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token, password: passwords.password })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("Password reset successful! Redirecting to login...");
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setError(data.error || "Failed to reset password.");
            }
        } catch (err) {
            setError("Cannot connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-black items-center justify-center p-6">
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-900 p-10 rounded-2xl shadow-2xl">
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">
                    New Password
                </h2>
                <p className="text-zinc-500 text-xs mb-8 font-bold uppercase tracking-widest">
                    Secure your account
                </p>

                {message && <div className="bg-green-950/30 border border-green-900/50 text-green-500 p-4 mb-6 text-xs font-bold uppercase tracking-wider">{message}</div>}
                {error && <div className="bg-[#CC0000]/10 border border-[#CC0000]/30 text-[#CC0000] p-4 mb-6 text-xs font-bold uppercase tracking-wider">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input 
                            type="password"
                            placeholder="New Password"
                            className="w-full bg-transparent border-b border-zinc-800 py-3 text-white outline-none focus:border-[#CC0000] transition-all"
                            value={passwords.password}
                            onChange={(e) => setPasswords({...passwords, password: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <input 
                            type="password"
                            placeholder="Confirm New Password"
                            className="w-full bg-transparent border-b border-zinc-800 py-3 text-white outline-none focus:border-[#CC0000] transition-all"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                            required
                        />
                    </div>

                    <button disabled={loading || message !== ''} className="w-full bg-white text-black font-black py-4 text-[11px] tracking-[0.3em] uppercase hover:bg-[#CC0000] hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center">
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'SAVE NEW PASSWORD'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;