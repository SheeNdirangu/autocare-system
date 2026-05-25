import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate, Link } from "react-router-dom";

const BookService = () => {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    license_plate: "",
    serviceType: "",
    price: 0,
    date: null,
    notes: ""
  });

  const services = [
    { category: "Basic Maintenance", items: [{ name: "Oil Change", price: 3500 }, { name: "Car Wash", price: 1000 }, { name: "Tire Rotation", price: 2000 }, { name: "Spark Plug Replacement", price: 3000 }] },
    { category: "Diagnostics", items: [{ name: "Engine Check", price: 5000 }, { name: "Computer Diagnostics", price: 4000 }, { name: "Electrical Diagnosis", price: 4500 }] },
    { category: "Major Repairs", items: [{ name: "Full Service", price: 12000 }, { name: "Major Service", price: 18000 }, { name: "Suspension Repair", price: 14000 }] },
    { category: "Tyres & Brakes", items: [{ name: "Brake Service", price: 7000 }, { name: "Wheel Alignment", price: 2500 }, { name: "Tire Replacement", price: 15000 }] },
    { category: "Cooling & AC", items: [{ name: "AC Service", price: 6500 }, { name: "Radiator Service", price: 7000 }, { name: "Coolant Flush", price: 3000 }] },
    { category: "Battery", items: [{ name: "Battery Check", price: 1500 }, { name: "Battery Replacement", price: 8500 }] }
  ];

  useEffect(() => {
    const customerId = localStorage.getItem("customer_id");
    const token = localStorage.getItem("authToken");

    if (!customerId || !token) {
      navigate("/login");
      return;
    }

    // FIXED: Added Auth Header
    fetch(`http://127.0.0.1:5000/api/vehicle?customerID=${customerId}`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        setVehicles(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching vehicles:", err);
        setLoading(false);
      });
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.license_plate || !formData.serviceType || !formData.date) {
      alert("Please fill all required fields (Vehicle, Service, and Date).");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      
      // FIXED: Safely format date to local timezone (YYYY-MM-DD) avoiding UTC shifts
      const localDateStr = formData.date.toLocaleDateString('en-CA');

      const res = await fetch("http://127.0.0.1:5000/api/book-service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          date: localDateStr
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert("Service booked successfully!");
        navigate("/customer/bookings");
      } else {
        alert(data.message || data.error || "Booking failed");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto mb-8">
        <Link to="/customer/vehicles" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-[#CC0000] mb-4 transition-colors">
          <span className="mr-2">←</span> Back to Dashboard
        </Link>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Schedule a Service</h1>
        <p className="text-gray-500 mt-2 text-lg">Build your service package and choose a time that works for you.</p>
      </div>

      {loading ? (
        <div className="max-w-7xl mx-auto text-center py-20">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
            <p className="text-gray-500 font-medium">Loading your garage...</p>
          </div>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="max-w-3xl mx-auto text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="text-6xl mb-4">🚘</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Your garage is empty</h3>
          <p className="text-gray-500 mb-8">Add a vehicle to your profile before booking a service.</p>
          <Link to="/customer/add-vehicle" className="bg-[#CC0000] text-white px-8 py-3 rounded-full font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">
            + Register a Vehicle
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="h-8 w-8 rounded-full bg-red-100 text-[#CC0000] flex items-center justify-center font-bold mr-3">1</div>
                <h2 className="text-xl font-bold text-gray-900">Select Vehicle</h2>
              </div>
              <div className="relative">
                <select name="license_plate" value={formData.license_plate} onChange={handleChange} className="w-full appearance-none p-4 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-[#CC0000] focus:border-[#CC0000] outline-none transition-all cursor-pointer font-medium text-lg" required>
                  <option value="" disabled>Choose from your garage...</option>
                  {vehicles.map((v) => (
                    <option key={v.license_plate} value={v.license_plate}>{v.license_plate} • {v.make} {v.model}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">▼</div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center mb-8">
                <div className="h-8 w-8 rounded-full bg-red-100 text-[#CC0000] flex items-center justify-center font-bold mr-3">2</div>
                <h2 className="text-xl font-bold text-gray-900">Choose Service Package</h2>
              </div>
              
              <div className="space-y-8">
                {services.map((group) => (
                  <div key={group.category}>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 ml-1">{group.category}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {group.items.map((service) => {
                        const isSelected = formData.serviceType === service.name;
                        return (
                          <div key={service.name} onClick={() => setFormData({ ...formData, serviceType: service.name, price: service.price })} className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 overflow-hidden group ${isSelected ? "bg-red-50/50 border-[#CC0000]" : "bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50"}`}>
                            {isSelected && <div className="absolute top-0 left-0 w-1 h-full bg-[#CC0000]"></div>}
                            <div className="flex flex-col h-full justify-between">
                              <span className={`font-semibold mb-2 ${isSelected ? 'text-[#CC0000]' : 'text-gray-800'}`}>{service.name}</span>
                              <span className={`text-sm font-medium ${isSelected ? 'text-red-800' : 'text-gray-500'}`}>KSh {service.price.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="h-8 w-8 rounded-full bg-red-100 text-[#CC0000] flex items-center justify-center font-bold mr-3">3</div>
                <h2 className="text-xl font-bold text-gray-900">Date & Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Date</label>
                  <DatePicker filterDate={(date) => date.getDay() !== 0} selected={formData.date} onChange={(date) => setFormData({ ...formData, date: date })} minDate={new Date()} dateFormat="MMMM d, yyyy" placeholderText="Select available date" className="w-full p-4 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-[#CC0000] focus:border-[#CC0000] outline-none transition-all cursor-pointer" calendarClassName="border-none shadow-2xl rounded-2xl font-sans p-2" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes <span className="font-normal text-gray-400">(Optional)</span></label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows="1" className="w-full p-4 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-[#CC0000] focus:border-[#CC0000] outline-none transition-all resize-none min-h-[56px]" placeholder="Any specific issues?" />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[380px]">
            <div className="sticky top-8 bg-gray-900 rounded-3xl p-8 text-white shadow-2xl">
              <h3 className="text-xl font-bold mb-6 border-b border-gray-700 pb-4">Booking Summary</h3>
              
              <div className="space-y-6 mb-8">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Vehicle</p>
                  <p className="font-medium text-lg">{formData.license_plate || <span className="text-gray-600 italic">Not selected</span>}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Service</p>
                  <p className="font-medium text-lg">{formData.serviceType || <span className="text-gray-600 italic">Not selected</span>}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Date</p>
                  <p className="font-medium text-lg">{formData.date ? formData.date.toLocaleDateString() : <span className="text-gray-600 italic">Not selected</span>}</p>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-6 mb-8">
                <div className="flex justify-between items-end">
                  <p className="text-gray-400 text-sm font-medium">Estimated Total</p>
                  <p className="text-3xl font-black text-white">
                    <span className="text-lg text-gray-400 mr-1">KSh</span>
                    {Number(formData.price || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <button type="submit" disabled={!formData.license_plate || !formData.serviceType || !formData.date} className="w-full bg-[#CC0000] text-white py-4 rounded-xl text-lg font-bold shadow-lg hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform active:scale-[0.98]">
                Confirm Booking
              </button>
              
              <p className="text-center text-xs text-gray-500 mt-4">Payment is collected after service completion.</p>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default BookService;