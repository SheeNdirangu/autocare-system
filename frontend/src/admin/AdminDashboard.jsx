import { motion } from "framer-motion";
import { Users, Car, Wrench, ClipboardList, Activity } from "lucide-react";
import { useEffect, useState } from "react";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchRecentBookings();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch("http://127.0.0.1:5000/api/admin/stats", {
          headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.log("Error fetching stats:", err);
    }
  };

  const fetchRecentBookings = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch("http://127.0.0.1:5000/api/admin/recent-bookings", {
          headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setRecentBookings(data);
    } catch (err) {
      console.log("Recent bookings error:", err);
    }
  };

  const dashboardCards = [
    { title: "Total Customers", value: stats?.customers || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Vehicles", value: stats?.vehicles || 0, icon: Car, color: "text-green-600", bg: "bg-green-50" },
    { title: "Active Bookings", value: stats?.activeBookings || 0, icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-50" },
    { title: "Mechanics", value: stats?.mechanics || 0, icon: Wrench, color: "text-purple-600", bg: "bg-purple-50" }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">Welcome back! Here’s what’s happening in your system.</p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardCards.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{item.title}</p>
                <h2 className="text-3xl font-black mt-2 text-gray-900">{item.value}</h2>
              </div>
              <div className={`p-4 rounded-xl ${item.bg}`}>
                <Icon className={`w-8 h-8 ${item.color}`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ACTIVITY SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RECENT BOOKINGS */}
        <div className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
            <ClipboardList className="text-[#CC0000]" /> Recent Bookings
          </h2>
          <div className="space-y-4">
            {recentBookings.length > 0 ? (
              recentBookings.map((booking) => (
                <div key={booking.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="font-bold text-gray-900">{booking.vehicle}</p>
                          <p className="text-gray-500 text-sm">{booking.service}</p>
                      </div>
                      <div className="text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Status ID: {booking.status}</span>
                          <p className="text-xs text-gray-400 mt-1 font-medium">{booking.date}</p>
                      </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic text-sm">No recent bookings found.</p>
            )}
          </div>
        </div>

        {/* SYSTEM STATUS */}
        <div className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
            <Activity className="text-[#CC0000]" /> System Status
          </h2>
          <div className="space-y-4 text-sm font-semibold">
            <div className="flex items-center gap-3 bg-green-50 text-green-700 p-4 rounded-xl border border-green-100">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Database: Online
            </div>
            <div className="flex items-center gap-3 bg-green-50 text-green-700 p-4 rounded-xl border border-green-100">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> API Services: Running
            </div>
            <div className="flex items-center gap-3 bg-yellow-50 text-yellow-700 p-4 rounded-xl border border-yellow-200">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span> M-Pesa: Sandbox Mode
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;