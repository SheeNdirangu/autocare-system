import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Layout = () => {

  const navigate = useNavigate();

  const userName = localStorage.getItem('userName') || "Customer";

  useEffect(() => {

    const userId = localStorage.getItem('customer_id');

    if (!userId) {
      navigate('/login');
    }

  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navStyle = ({ isActive }) =>
    `block p-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em]
     transition-all duration-200 border ${
       isActive
         ? 'bg-[#CC0000] border-[#CC0000] text-white shadow-md shadow-red-500/20'
         : 'border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900'
     }`;

  return (

    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col p-6 shadow-sm z-10">

        {/* LOGO */}
        <div className="flex items-center gap-3 mb-12">

          <div className="bg-[#CC0000] w-10 h-10 rounded-lg flex items-center justify-center font-black text-white shadow-sm">
            AC
          </div>

          <div>
            <h1 className="font-black text-2xl tracking-tight text-gray-900">
              AutoCare
            </h1>

            <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">
              Customer Portal
            </p>
          </div>

        </div>

        {/* NAVIGATION */}
        <nav className="flex-grow space-y-3">

          {[
            { name: 'Dashboard', path: '/customer' },
            { name: 'My Vehicles', path: '/customer/vehicles' },
            { name: 'Book Service', path: '/customer/book' },
            { name: 'My Bookings', path: '/customer/bookings' },
            { name: 'Service Tracking', path: '/customer/tracking' },
            { name: 'Service History', path: '/customer/history' }

          ].map((item) => (

            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/customer'}
              className={navStyle}
            >
              {item.name}
            </NavLink>

          ))}

        </nav>

        {/* FOOTER */}
        <div className="pt-6 border-t border-gray-200">

          <button
            onClick={handleLogout}
            className="w-full border border-[#CC0000]
            text-[#CC0000] p-4 rounded-xl text-[11px]
            font-black uppercase tracking-[0.2em]
            hover:bg-[#CC0000] hover:text-white
            transition-all duration-200 shadow-sm"
          >
            Logout
          </button>

        </div>

      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}
        <header className="h-24 border-b border-gray-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-10 z-10">

          <div>

            <h2 className="text-xl font-bold text-gray-900">
              Welcome Back 👋
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Manage your vehicles and service bookings
            </p>

          </div>

          {/* PROFILE AREA */}
          <div className="flex items-center gap-4">

            {/* PROFILE BUTTON */}
            <button
              onClick={() => navigate('/customer/profile')}
              className="flex items-center gap-4 bg-gray-50 border border-gray-200 hover:border-[#CC0000] px-4 py-2 rounded-2xl transition-all duration-300 group shadow-sm"
            >

              <div className="text-right hidden sm:block">

                <p className="text-gray-500 text-[10px] uppercase tracking-[0.2em] group-hover:text-[#CC0000] transition-colors">
                  My Profile
                </p>

                <h3 className="font-bold text-gray-900">
                  {userName}
                </h3>

              </div>

              <div
                className="w-12 h-12 rounded-full bg-[#CC0000]
                flex items-center justify-center font-bold text-lg text-white
                shadow-md shadow-red-500/20"
              >
                {userName.charAt(0).toUpperCase()}
              </div>

            </button>

          </div>

        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-10 bg-gray-50">

          <Outlet />

        </main>

      </div>

    </div>
  );
};

export default Layout;