import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Receipt, X } from "lucide-react";

// FIX 1: Added 5th color so the Pie Chart doesn't run out of colors for the Cancelled status
const COLORS = ["#3B82F6", "#FACC15", "#F97316", "#22C55E", "#EF4444"];

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all');
  
  // Shift Report States
  const [showShiftReport, setShowShiftReport] = useState(false);
  const [shiftData, setShiftData] = useState(null);

  useEffect(() => {
    // FIX: Fallback applied to ensure the correct token is used, plus Content-Type header
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    fetch(`http://127.0.0.1:5000/api/admin/analytics?filter=${timeFilter}`, {
        headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })
      .then((res) => res.json())
      .then((data) => setAnalytics(data))
      .catch((err) => console.error("Analytics fetch error:", err));
  }, [timeFilter]);

  const fetchShiftReport = async () => {
      try {
          const token = localStorage.getItem('token') || localStorage.getItem('authToken');
          const res = await fetch(`http://127.0.0.1:5000/api/admin/shift-report`, {
              headers: { 
                  "Authorization": `Bearer ${token}`,
                  "Content-Type": "application/json"
              }
          });
          const data = await res.json();
          setShiftData(data);
          setShowShiftReport(true);
      } catch (err) {
          alert("Failed to fetch shift report.");
      }
  };

  const downloadReport = async (elementId, filename) => {
    const input = document.getElementById(elementId);
    if (!input) return;
    
    const originalClasses = input.className;
    input.className = "p-8 bg-white text-black"; 
    
    const canvas = await html2canvas(input, { scale: 2, backgroundColor: '#ffffff' });
    input.className = originalClasses; 

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(filename);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Analytics & Finance</h1>
          <p className="text-gray-500 mt-1 text-sm">System insights and cash reconciliation.</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
          <button onClick={fetchShiftReport} className="bg-gray-900 text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:bg-black transition-all flex items-center gap-2">
              <Receipt size={16} /> End of Day Report
          </button>

          <select 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="bg-white border border-gray-300 text-gray-900 text-sm font-bold uppercase tracking-wider rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#CC0000] cursor-pointer shadow-sm"
          >
            <option value="all">All Time</option>
            <option value="daily">Today</option>
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last 30 Days</option>
            <option value="yearly">This Year</option>
          </select>

          <button onClick={() => downloadReport("analytics-report", `Analytics_${timeFilter}.pdf`)} className="bg-[#CC0000] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:bg-red-700 transition-all">
              Export Dashboard
          </button>
        </div>
      </div>

      {/* SHIFT REPORT MODAL */}
      {showShiftReport && shiftData && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-black text-xl text-gray-900 uppercase">Daily Shift Report</h3>
                      <button onClick={() => setShowShiftReport(false)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
                  </div>
                  
                  <div id="shift-receipt" className="p-8 overflow-y-auto">
                      <div className="text-center mb-8">
                          <h2 className="text-2xl font-black uppercase text-gray-900">AutoCare Pro</h2>
                          <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mt-1">End of Day Reconciliation</p>
                          <p className="text-gray-400 text-xs mt-1">Date: {shiftData.date}</p>
                      </div>

                      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8 space-y-4">
                          <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500 font-bold uppercase">Expected Cash in Drawer:</span>
                              <span className="text-2xl font-black text-gray-900">KES {shiftData.cashTotal}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm pt-4 border-t border-gray-200">
                              <span className="text-gray-500 font-bold uppercase">M-Pesa Transfers:</span>
                              <span className="text-lg font-bold text-gray-700">KES {shiftData.mpesaTotal}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm pt-4 border-t border-gray-200">
                              <span className="text-[#CC0000] font-black uppercase tracking-widest">Total Daily Revenue:</span>
                              <span className="text-lg font-black text-[#CC0000]">KES {shiftData.grandTotal}</span>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-2">Transaction Log</h4>
                          {shiftData.transactions?.length === 0 ? (
                              <p className="text-center text-gray-400 text-sm py-4 italic">No paid transactions today.</p>
                          ) : (
                              shiftData.transactions?.map((tx, idx) => (
                                  <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-3">
                                      <div>
                                          <p className="font-bold text-gray-900 text-sm">{tx.vehicle}</p>
                                          <p className="text-xs text-gray-500">{tx.time} • {tx.method}</p>
                                      </div>
                                      <p className="font-bold text-gray-900 text-sm">KES {tx.amount}</p>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>

                  <div className="p-6 border-t border-gray-100 bg-gray-50">
                      <button onClick={() => downloadReport("shift-receipt", `ShiftReport_${shiftData.date}.pdf`)} className="w-full bg-[#CC0000] text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition">
                          Download Shift Receipt
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* DASHBOARD CHARTS */}
      <div id="analytics-report">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Revenue</p>
            <h2 className="text-3xl font-black mt-2 text-gray-900">KES {analytics?.totalRevenue || 0}</h2>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Completed Services</p>
            <h2 className="text-3xl font-black mt-2 text-gray-900">{analytics?.completedServices || 0}</h2>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Active Mechanics</p>
            <h2 className="text-3xl font-black mt-2 text-gray-900">{analytics?.activeMechanics || 0}</h2>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Booking Status</h2>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                <Pie 
                    data={analytics?.bookingStatusData || []} 
                    dataKey="value" // FIX 2: Added dataKey="value" so Recharts actually renders the slices
                    nameKey="name" 
                    outerRadius={100} 
                    label
                >
                    {(analytics?.bookingStatusData || []).map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
            </ResponsiveContainer>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Monthly Bookings</h2>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.monthlyBookings || []}>
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="bookings" stroke="#CC0000" strokeWidth={4} dot={{ r: 6, fill: '#CC0000' }} />
                </LineChart>
            </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Most Requested Services</h2>
            <ResponsiveContainer width="100%" height={350}>
            <BarChart data={analytics?.servicesData || []}>
                <XAxis dataKey="service" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#CC0000" radius={[6, 6, 0, 0]} />
            </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;