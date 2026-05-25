import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  
  // New State for the Role Selector
  const [roleType, setRoleType] = useState('customer'); // Default to customer
  
  const [credentials, setCredentials] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        // Point to the correct API route based on selected role
        let endpoint = 'http://127.0.0.1:5000/api/login'; // Handles both Admin & Customer
        if (roleType === 'mechanic') {
            endpoint = 'http://127.0.0.1:5000/api/mechanic/login'; // Dedicated mechanic route
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                Email: credentials.identifier, 
                Password: credentials.password
            }),
        });

        const data = await response.json();

        if (response.ok) {
            // Handle routing and storage based on returned role
            if (data.role === 'admin') {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userRole', 'admin');
                localStorage.setItem('userName', data.name);
                navigate('/admin');
            } else if (data.role === 'mechanic') {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userRole', 'mechanic');
                localStorage.setItem('userName', data.name);
                localStorage.setItem('mechanic_id', data.mechanicID); 
                navigate('/mechanic');
            } else {
                // Must be a customer
                localStorage.setItem('customer_id', data.customerID);
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userRole', 'customer');
                localStorage.setItem('userName', data.name);
                localStorage.setItem('phone', data.PhoneNumber);
                navigate('/customer');
            }
        } else {
            setError(data.message || data.error || "Login failed.");
        }
    } catch (err) {
        setError("Cannot connect to server. Ensure backend is running.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* LEFT SIDE - VISUAL */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-100 relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1613214149922-f1809c99b414?q=80&w=2070" 
          className="absolute inset-0 w-full h-full object-cover opacity-15 grayscale"
          alt="Luxury garage"
        />
        
        <div className="relative z-10 p-20 flex flex-col justify-between h-full">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-[#CC0000] px-3 py-1 font-black text-white">AC</div>
            <span className="font-black tracking-tighter text-black uppercase text-2xl">AutoCare Pro</span>
          </div>

          <div>
            <h1 className="text-6xl font-black text-black uppercase leading-[0.9] tracking-tighter">
              Precision <br/>
              <span className="text-[#CC0000]">Engineering.</span>
            </h1>
            <p className="text-gray-600 mt-6 max-w-sm font-medium">
              Access your digital garage, track live bookings, and manage your vehicle's maintenance history securely.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative bg-white">
        <div className="w-full max-w-md">
          
          <h2 className="text-4xl font-black text-black uppercase italic tracking-tighter mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-400 text-sm mb-10 font-bold uppercase tracking-widest">
            Login to continue
          </p>

          {error && (
            <div className="bg-[#CC0000]/10 border border-[#CC0000]/30 text-[#CC0000] p-4 mb-6 text-xs font-bold uppercase tracking-wider flex items-center gap-3">
               <span className="w-2 h-2 rounded-full bg-[#CC0000] animate-pulse"></span> {error}
            </div>
          )}

          {/* ROLE SELECTOR TABS */}
          <div className="flex gap-2 mb-8 bg-gray-100 p-1.5 rounded-lg border border-gray-200">
            <button 
                type="button"
                onClick={() => setRoleType('customer')}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded transition-all duration-300 ${roleType === 'customer' ? 'bg-[#CC0000] text-white shadow-md' : 'text-gray-500 hover:text-black hover:bg-gray-200'}`}
            >
                Customer
            </button>
            <button 
                type="button"
                onClick={() => setRoleType('mechanic')}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded transition-all duration-300 ${roleType === 'mechanic' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black hover:bg-gray-200'}`}
            >
                Mechanic
            </button>
            <button 
                type="button"
                onClick={() => setRoleType('admin')}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded transition-all duration-300 ${roleType === 'admin' ? 'bg-gray-300 text-black shadow-md' : 'text-gray-500 hover:text-black hover:bg-gray-200'}`}
            >
                Admin
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                {roleType === 'admin' ? 'Email or Username' : 'Email Address'}
              </label>
              <input 
                type={roleType === 'admin' ? "text" : "email"}
                className="w-full bg-gray-50 border border-gray-200 py-4 px-5 text-black outline-none focus:border-[#CC0000] focus:bg-white transition-all font-medium"
                onChange={(e) => setCredentials({...credentials, identifier: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                Password
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-gray-50 border border-gray-200 py-4 px-5 text-black outline-none focus:border-[#CC0000] focus:bg-white transition-all font-medium pr-16"
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 bottom-4 text-gray-400 hover:text-[#CC0000] text-[10px] font-black uppercase mr-4"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Main Action Button - Inverted to black background with red slide overlay */}
            <button disabled={loading} className="group relative w-full bg-black text-white font-black py-5 text-[11px] tracking-[0.3em] uppercase overflow-hidden hover:text-white transition-colors duration-300 disabled:opacity-50 mt-4 rounded-sm shadow-md">
              <span className="relative z-10">{loading ? 'AUTHORIZING...' : ' LOGIN →'}</span>
              <div className="absolute inset-0 bg-[#CC0000] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>

            {roleType === 'customer' && (
                <div className="text-right mt-2">
                  <span onClick={() => navigate('/forgot-password')} className="text-gray-400 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:text-black transition-colors">
                    Forgot Password?
                  </span>
                </div>
            )}
            
            {roleType === 'customer' && (
                <p className="text-center text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-8">
                  New customer? <span onClick={() => navigate('/register')} className="text-black cursor-pointer hover:text-[#CC0000] border-b border-[#CC0000]/30 hover:border-[#CC0000] pb-1 transition-all">Register here</span>
                </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;