// src/pages/Home.jsx
import React, { useState } from 'react';
import Hero from '../components/Hero';
import AboutUs from '../components/AboutUs';
import Contacts from '../components/Contacts';
import Footer from '../components/Footer';

const Home = () => {
  const [activeSection, setActiveSection] = useState('home');

  return (
    // Flex wrapper ensures footer stays at the very bottom of short viewport screens
    <div className="flex flex-col min-h-screen bg-white font-sans antialiased">
      
      {/* NAVIGATION BAR - Elevated with frosted-glass blur effect */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 md:px-12 py-6 bg-white/75 backdrop-blur-md border-b border-gray-100/80 transition-all duration-300">
        <div className="flex items-center gap-3 select-none">
          <div className="bg-[#CC0000] px-2.5 py-1.5 font-black text-white text-xs tracking-tighter rounded-sm shadow-sm">
            AC
          </div>
          <span className="font-black tracking-tight text-slate-900 uppercase text-lg md:text-xl">
            AutoCare<span className="text-[#CC0000]">.</span>
          </span>
        </div>
        
        <div className="flex gap-6 md:gap-10">
          {['home', 'about', 'contacts'].map((section) => (
            <button 
              key={section}
              onClick={() => setActiveSection(section)}
              className={`text-[11px] font-bold uppercase tracking-[0.25em] transition-all duration-300 relative py-1 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#CC0000] after:transform after:origin-right after:scale-x-0 hover:after:scale-x-105 hover:after:origin-left after:transition-transform after:duration-300 ${
                activeSection === section 
                  ? 'text-[#CC0000] after:scale-x-100' 
                  : 'text-gray-400 hover:text-slate-900'
              }`}
            >
              {section === 'about' ? 'About Us' : section}
            </button>
          ))}
        </div>
      </nav>

      {/* COMPONENT HOST CONTAINER - Flex-grow pushes everything below it (the footer) to the bottom */}
      <main className="flex-grow pt-24">
        <div className="transition-all duration-500 ease-in-out">
          {activeSection === 'home' && <Hero />}
          {activeSection === 'about' && <AboutUs />}
          {activeSection === 'contacts' && <Contacts />}
        </div>
      </main>

      {/* FOOTER - Firmly anchored */}
      <Footer />
    </div>
  );
};

export default Home;