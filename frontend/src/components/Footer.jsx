// src/components/Footer.jsx
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-10 px-8 lg:px-20">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">
          © {new Date().getFullYear()} AUTOCARE PRO SOLUTIONS. ALL RIGHTS RESERVED.
        </div>
        <div className="flex gap-8">
          <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors">Privacy</a>
          <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors">Terms</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;