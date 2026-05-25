import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('http://127.0.0.1:5000/api/register-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          FullName: formData.fullName,
          PhoneNumber: formData.phone,
          Email: formData.email,
          Password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Registration failed.");
        return;
      }

      alert("Account created successfully! Please log in.");
      navigate("/login");

    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* LEFT SIDE - VISUAL PANEL */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-white border-r border-gray-100">
        
        {/* FIX: Added a white gradient overlay so the black text at the bottom is readable against the image */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-white via-white/50 to-white/10"></div>
        
        {/* FIX: Re-added the actual image tag! */}
        <img 
          src="https://images.unsplash.com/photo-1613214149922-f1809c99b414?q=80&w=2070" 
          alt="Garage Workshop" 
          className="absolute inset-0 w-full h-full object-cover opacity-80 grayscale"
        />

        <div className="relative z-20 p-20 flex flex-col justify-between h-full w-full">
          <div className="flex items-center gap-2 cursor-pointer self-start" onClick={() => navigate('/')}>
            <div className="bg-[#CC0000] px-3 py-1 font-black text-white">AC</div>
            <span className="font-black tracking-tighter text-black uppercase text-2xl drop-shadow-sm">
              AutoCare Pro
            </span>
          </div>

          <h1 className="text-6xl font-black text-black uppercase leading-none tracking-tighter mt-auto drop-shadow-sm">
            Join the <br />
            <span className="text-[#CC0000]">Elite</span> Service.
          </h1>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-12 bg-white">
        <div className="w-full max-w-md">

          <h2 className="text-4xl font-black text-black uppercase italic mb-6 tracking-tighter">
            Create Account
          </h2>

          {error && (
            <div className="bg-[#CC0000]/10 border border-[#CC0000]/30 text-[#CC0000] p-4 mb-6 text-xs font-bold uppercase tracking-wider flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#CC0000] animate-pulse"></span> {error}
            </div>
          )}

          <form onSubmit={handleAccountSubmit} className="space-y-8">
            <input
              placeholder="Full Name"
              type="text"
              className="w-full bg-transparent border-b border-gray-200 py-3 text-black placeholder-gray-400 outline-none focus:border-[#CC0000] transition-colors font-medium"
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
            <input
              placeholder="Email"
              type="email"
              className="w-full bg-transparent border-b border-gray-200 py-3 text-black placeholder-gray-400 outline-none focus:border-[#CC0000] transition-colors font-medium"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <input
              placeholder="Phone Number (e.g., 2547XXXXXXXX)"
              type="text"
              className="w-full bg-transparent border-b border-gray-200 py-3 text-black placeholder-gray-400 outline-none focus:border-[#CC0000] transition-colors font-medium"
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <input
              placeholder="Password"
              type="password"
              className="w-full bg-transparent border-b border-gray-200 py-3 text-black placeholder-gray-400 outline-none focus:border-[#CC0000] transition-colors font-medium"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <input
              placeholder="Confirm Password"
              type="password"
              className="w-full bg-transparent border-b border-gray-200 py-3 text-black placeholder-gray-400 outline-none focus:border-[#CC0000] transition-colors font-medium"
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
            
            <button
              disabled={loading}
              className="w-full bg-black text-white hover:bg-[#CC0000] transition-colors duration-300 font-black py-4 uppercase tracking-[0.2em] disabled:opacity-50 shadow-md rounded-sm text-[11px]"
            >
              {loading ? "Creating..." : "Create Account →"}
            </button>
            
            <p className="text-center text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-6">
              Already have an account?{' '}
              <span 
                onClick={() => navigate('/login')} 
                className="text-zinc-900 font-black cursor-pointer hover:text-[#CC0000] border-b border-[#CC0000]/30 hover:border-[#CC0000] pb-1 transition-all"
              >
                Log in here
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;