import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const AdminLayout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin-login');
    };

    // Sidebar link styling - Updated for Light Theme
    const navStyle = ({ isActive }) =>
        `block p-3.5 rounded-xl transition-all duration-200 font-bold text-sm ${
            isActive
                ? 'bg-[#CC0000] text-white shadow-md shadow-red-500/20'
                : 'text-gray-500 hover:bg-red-50 hover:text-[#CC0000]'
        }`;

    return (
        <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-gray-200 p-6 flex flex-col z-20 shadow-sm">
                <div className="flex items-center gap-3 mb-10">
                    <div className="bg-[#CC0000] w-10 h-10 rounded-lg flex items-center justify-center font-black text-white shadow-sm shadow-red-500/30">
                        AC
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-gray-900">
                            AutoCare Admin
                        </h1>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavLink to="/admin" end className={navStyle}>Dashboard</NavLink>
                    <NavLink to="/admin/bookings" className={navStyle}>Bookings</NavLink>
                    <NavLink to="/admin/customers" className={navStyle}>Customers</NavLink>
                    <NavLink to="/admin/mechanics" className={navStyle}>Mechanics</NavLink>
                    <NavLink to="/admin/assignments" className={navStyle}>Assignments</NavLink>
                    <NavLink to="/admin/reports" className={navStyle}>Reports</NavLink>
                    <NavLink to="/admin/analytics" className={navStyle}>Analytics</NavLink>
                </nav>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="mt-10 p-4 rounded-xl border border-red-100 bg-red-50 text-[#CC0000] hover:bg-[#CC0000] hover:text-white text-xs font-black uppercase tracking-widest transition-all duration-200"
                >
                    Logout
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;