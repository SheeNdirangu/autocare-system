import React from 'react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative h-screen max-h-screen bg-white text-black flex items-center overflow-hidden">
      
      {/* BACKGROUND IMAGE LAYER */}
      <div className="absolute right-0 top-0 h-full w-full lg:w-2/3 overflow-hidden">
        {/* Adjusted the fade gradient for a light background */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-white via-white/85 to-transparent lg:bg-gradient-to-l lg:from-transparent lg:to-white"></div>
        <img 
          src="/wrenches.jpg" 
          alt="Garage Service" 
          className="h-full w-full object-cover opacity-30 grayscale"
        />
      </div>

      {/* CONTENT LAYER */}
      <div className="container mx-auto px-8 lg:px-20 relative z-20">
        <div className="max-w-3xl">
          
          <h1 className="text-6xl md:text-8xl font-black mb-24 leading-[1.0] tracking-tighter uppercase">
            RELIABLE <br />
           VEHICLE MAINTENANCE <br />
            <span className="text-gray-400">SOLUTION.</span>
          </h1>

          {/* Fixed the typo border-1-2 to border-l-2 */}
          <p className="text-gray-600 text-sm md:text-base mb-8 max-w-md leading-relaxed border-l-2 border-red-600/40 pl-5">
            Delivering seamless car maintainance management with smart booking,repair tracking, and professional automotive support
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <button 
              onClick={() => navigate('/register')}
              className="bg-red-600 hover:bg-red-700 text-white px-12 py-5 font-bold text-xs tracking-[0.2em] transition-all uppercase shadow-xl shadow-red-900/20"
            >
              Get Started
            </button>
            
            <button 
              onClick={() => navigate('/login')}
              className="group flex items-center gap-4 text-black font-bold tracking-[0.2em] text-[11px] uppercase"
            >
              <div className="w-12 h-12 rounded-full border border-black/20 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                <span className="text-xl">→</span>
              </div>
              Login
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;