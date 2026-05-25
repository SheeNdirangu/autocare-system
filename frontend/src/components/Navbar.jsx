import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="absolute top-0 left-0 w-full z-50 px-8 lg:px-20 py-8 flex items-center justify-between">
      {/* LOGO */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-8 h-8 bg-red-600 flex items-center justify-center font-black text-white italic shadow-lg shadow-red-900/20">
          AC
        </div>
        <span className="text-black font-black tracking-tighter text-xl uppercase">
          AutoCare
        </span>
      </div>

      {/* CLEAN NAV LINKS */}
      <div className="flex items-center gap-12">
        {['Home', 'About Us', 'Contacts'].map((item) => (
          <Link 
            key={item} 
            to={item === 'Home' ? '/' : `/${item.toLowerCase().replace(' ', '')}`}
            className="text-[11px] uppercase tracking-[0.4em] font-bold text-gray-500 hover:text-black transition-all duration-300"
          >
            {item}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;