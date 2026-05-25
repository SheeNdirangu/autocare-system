import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch('http://127.0.0.1:5000/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Email: email })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(data.message);
            } else {
                setError(data.error || "Failed to process request.");
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
                    Reset Password
                </h2>
                <p className="text-zinc-500 text-xs mb-8 font-bold uppercase tracking-widest">
                    Enter your email to receive a recovery link
                </p>

                {message && <div className="bg-green-950/30 border border-green-900/50 text-green-500 p-4 mb-6 text-xs font-bold uppercase tracking-wider">{message}</div>}
                {error && <div className="bg-[#CC0000]/10 border border-[#CC0000]/30 text-[#CC0000] p-4 mb-6 text-xs font-bold uppercase tracking-wider">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input 
                            type="email"
                            placeholder="Email Address"
                            className="w-full bg-transparent border-b border-zinc-800 py-3 text-white outline-none focus:border-[#CC0000] transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button disabled={loading} className="w-full bg-[#CC0000] text-white font-black py-4 text-[11px] tracking-[0.3em] uppercase hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center">
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'SEND RECOVERY LINK'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link to="/login" className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest hover:text-white transition-colors">
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;