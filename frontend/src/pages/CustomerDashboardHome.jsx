import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CalendarPlus, MapPin, Search } from "lucide-react";

const SummaryCard = ({ label, value, color = "text-gray-900" }) => (
  <div className="bg-white border border-gray-200 p-8 shadow-sm rounded-2xl flex flex-col justify-center">
    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">{label}</p>
    <h3 className={`text-5xl font-black ${color}`}>{value}</h3>
  </div>
);

const CustomerDashboardHome = () => {
  const [stats, setStats] = useState({ total_vehicles: 0, active_bookings: 0, completed_services: 0 });
  const [notifications, setNotifications] = useState([]);
  const customerId = localStorage.getItem("customer_id") || localStorage.getItem("customerID");

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("authToken"); // FIXED: Added Auth
      const res = await fetch(`http://127.0.0.1:5000/api/customer-stats/${customerId}`, {
          headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
    } catch (err) { console.error("Dashboard fetch error:", err); }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("authToken"); // FIXED: Added Auth
      const res = await fetch(`http://127.0.0.1:5000/api/customer/notifications/${customerId}`, {
          headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Notification fetch error:", err); }
  };

  useEffect(() => {
    if (customerId && customerId !== "undefined") {
      fetchStats();
      fetchNotifications();
      const interval = setInterval(() => { fetchStats(); fetchNotifications(); }, 15000); // Polling reduced to save server load
      return () => clearInterval(interval);
    }
  }, [customerId]);

  return (
    <div className="max-w-6xl mx-auto space-y-10 my-6 px-4">
      <div className="mb-2">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Dashboard Overview</h2>
      </div>

      {notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.bookingID} className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
              <div className="bg-yellow-100 p-2 rounded-full mt-0.5"><Bell className="text-yellow-600" size={18} /></div>
              <div>
                <p className="text-yellow-800 font-bold text-sm uppercase tracking-wider mb-1">Service Update</p>
                <p className="text-yellow-700 text-sm">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard label="Vehicles Registered" value={(stats?.total_vehicles ?? 0).toString().padStart(2, "0")} />
        <SummaryCard label="Active Bookings" value={(stats?.active_bookings ?? 0).toString().padStart(2, "0")} color="text-[#CC0000]" />
        <SummaryCard label="Completed Services" value={(stats?.completed_services ?? 0).toString().padStart(2, "0")} color="text-green-600" />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 border-b border-gray-100 pb-4">Quick Actions</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/customer/book" className="flex items-center justify-center gap-2 bg-[#CC0000] text-white py-4 px-6 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-red-500/20 hover:bg-red-700 transition-all hover:-translate-y-0.5">
            <CalendarPlus size={16} /> Book Service
          </Link>
          <Link to="/customer/tracking" className="flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 text-gray-700 py-4 px-6 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-100 hover:border-gray-300 transition-all hover:-translate-y-0.5">
            <MapPin size={16} /> Track Service
          </Link>
          <Link to="/customer/history" className="flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 text-gray-700 py-4 px-6 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-100 hover:border-gray-300 transition-all hover:-translate-y-0.5">
            <Search size={16} /> Service History
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboardHome;