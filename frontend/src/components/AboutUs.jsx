// src/components/AboutUs.jsx
import React from 'react';

const AboutUs = () => {
  return (
    <section id="about" className="bg-slate-50 text-slate-900 py-24 px-6 md:px-12 lg:px-24 border-t border-slate-200/60 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        
        {/* Left Column: Content (Spans 5 columns on large screens) */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-[2px] bg-[#CC0000]"></div>
            <span className="uppercase tracking-[0.35em] text-[#CC0000] font-black text-xs">
              Who We Are
            </span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase mb-8 leading-[1.1] text-slate-950">
            Modern Solutions <br /> 
            <span className="text-slate-400 font-extrabold">For Automotive </span> <br />
            Excellence.
          </h2>
          
          <p className="text-slate-600 leading-relaxed mb-10 text-base md:text-lg font-medium max-w-xl">
            AutoCare Pro is more than a garage; it's a specialized hub for modern vehicle maintenance. 
            By combining advanced diagnostics with a transparent digital portal, we ensure your 
            vehicle performs at its peak while giving you real-time tracking of every repair phase.
          </p>
          
          {/* Stats Display Grid */}
          <div className="grid grid-cols-2 gap-6 border-t border-slate-200 pt-8">
            <div className="group p-4 rounded-xl bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md">
              <h4 className="text-4xl font-black text-slate-950 transition-colors group-hover:text-[#CC0000]">5+</h4>
              <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold mt-1">Years Experience</p>
            </div>
            <div className="group p-4 rounded-xl bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md">
              <h4 className="text-4xl font-black text-slate-950 transition-colors group-hover:text-[#CC0000]">5k+</h4>
              <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold mt-1">Vehicles Serviced</p>
            </div>
          </div>
        </div>

        {/* Right Column: Image Display (Spans 7 columns on large screens) */}
        <div className="lg:col-span-7 relative flex justify-center items-center mt-8 lg:mt-0">
          
          {/* Accent Frame Elements */}
          <div className="absolute -inset-3 border-2 border-dashed border-slate-200 rounded-2xl pointer-events-none z-0"></div>
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-radial from-[#CC0000]/10 to-transparent blur-xl pointer-events-none"></div>
          
          {/* Main Visual Container */}
          <div className="relative w-full h-[350px] md:h-[480px] rounded-xl overflow-hidden shadow-2xl border border-slate-200 z-10 bg-slate-900 group">
            <img 
              src="/WORKSHOP.JPG" 
              alt="Garage Interior" 
              className="w-full h-full object-cover relative z-10 grayscale group-hover:grayscale-0 scale-100 group-hover:scale-105 transition-all duration-700 ease-out object-center"
            />
            {/* Subtle Gradient overlay inside image container to blend dark tones */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity duration-500 z-20 pointer-events-none"></div>
          </div>
          
          {/* Small floating branding geometry */}
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-[#CC0000] to-red-700 rounded-xl z-20 shadow-lg flex items-center justify-center text-white hidden md:flex">
            <span className="font-black text-xs tracking-tighter">AC</span>
          </div>
          
        </div>

      </div>
    </section>
  );
};

export default AboutUs;