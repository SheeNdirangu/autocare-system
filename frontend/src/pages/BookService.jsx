import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate, Link } from "react-router-dom";

const BookService = () => {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]); 
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    license_plate: "",
    serviceType: "",
    price: 0,
    date: null,
    notes: ""
  });

  useEffect(() => {
    const customerId = localStorage.getItem("customer_id");
    const token = localStorage.getItem("authToken");

    if (!customerId || !token) {
      navigate("/login");
      return;
    }

    // 1. Fetch Customer Vehicles
    fetch(`http://127.0.0.1:5000/api/vehicle?customerID=${customerId}`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        setVehicles(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Error fetching vehicles:", err));

    // 2. Fetch Live Services & Pricing from the Database
    fetch(`http://127.0.0.1:5000/api/services`)
      .then((res) => res.json())
      .then((data) => {
        const groupedServices = data.reduce((acc, curr) => {
            let group = acc.find(g => g.category === curr.category);
            if (!group) {
                group = { category: curr.category, items: [] };
                acc.push(group);
            }
            group.items.push({ name: curr.name, price: curr.price });
            return acc;
        }, []);
        
        setServices(groupedServices);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching services:", err);
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
        alert("Service booked successfully! Thank you for choosing Autocare Pro");
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
    <div className="min-h-screen bg-slate-50 text-slate-600 py-12 px-6 lg:px-12 font-sans selection:bg-[#CC0000] selection:text-white">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-8">
        <div>
          <Link to="/customer/vehicles" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-[#CC0000] mb-6 transition-colors">
            <span className="mr-2">←</span> Return to Garage
          </Link>
          <h1 className="text-4xl md:text-5xl font-light text-slate-900 tracking-tight">
            Schedule <span className="font-bold text-[#CC0000]">Service</span>
          </h1>
        </div>
        <p className="text-slate-500 max-w-sm mt-4 md:mt-0 text-sm md:text-right">
          Select the service you need and the preferred date for your appointment. Appointments should be made at leaast a day prior.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#CC0000] rounded-full animate-spin"></div>
          <p className="text-slate-400 animate-pulse tracking-widest text-sm uppercase font-semibold">Accessing Database...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="max-w-2xl mx-auto text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="text-5xl mb-6 opacity-80">🚘</div>
          <h3 className="text-3xl font-light text-slate-900 mb-3">Garage Empty</h3>
          <p className="text-slate-500 mb-10">A registered vehicle is required to schedule a service.</p>
          <Link to="/customer/add-vehicle" className="bg-[#CC0000] text-white px-8 py-4 rounded-full font-semibold hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all">
            Register Your First Vehicle
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row gap-12 lg:gap-20">
          
          {/* Left Side: Configuration Flow */}
          <div className="flex-1 space-y-16">
            
            {/* Step 1 */}
            <section>
              <h2 className="text-2xl font-light text-slate-900 mb-6 flex items-center">
                <span className="text-[#CC0000] font-bold mr-4 text-sm tracking-widest bg-red-50 px-3 py-1 rounded-full">01</span>
                Vehicle Selection
              </h2>
              <div className="relative group">
                <select 
                  name="license_plate" 
                  value={formData.license_plate} 
                  onChange={handleChange} 
                  className="w-full appearance-none p-5 bg-white border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-[#CC0000] focus:border-[#CC0000] outline-none transition-all cursor-pointer text-lg hover:border-slate-300 shadow-sm" 
                  required
                >
                  <option value="" disabled className="text-slate-400">Select a vehicle from your garage</option>
                  {vehicles.map((v) => (
                    <option key={v.license_plate} value={v.license_plate}>
                      {v.license_plate} — {v.make} {v.model}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-slate-400 group-hover:text-slate-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </section>

            {/* Step 2 */}
            <section>
              <h2 className="text-2xl font-light text-slate-900 mb-8 flex items-center">
                <span className="text-[#CC0000] font-bold mr-4 text-sm tracking-widest bg-red-50 px-3 py-1 rounded-full">02</span>
                Service Package
              </h2>
              <div className="space-y-10">
                {services.map((group) => (
                  <div key={group.category}>
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-5 pl-1 border-l-2 border-slate-200">{group.category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {group.items.map((service) => {
                        const isSelected = formData.serviceType === service.name;
                        return (
                          <div 
                            key={service.name} 
                            onClick={() => setFormData({ ...formData, serviceType: service.name, price: service.price })} 
                            className={`p-5 rounded-xl cursor-pointer transition-all duration-300 ${
                              isSelected 
                                ? "bg-red-50/50 border-2 border-[#CC0000] shadow-[0_4px_20px_rgba(204,0,0,0.08)] transform scale-[1.02]" 
                                : "bg-white border-2 border-transparent shadow-sm ring-1 ring-slate-200 hover:ring-slate-300 hover:shadow-md"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className={`font-semibold ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>{service.name}</span>
                              {isSelected && (
                                <div className="h-2.5 w-2.5 bg-[#CC0000] rounded-full shadow-[0_0_8px_rgba(204,0,0,0.4)]"></div>
                              )}
                            </div>
                            <div className={`mt-3 text-sm font-medium ${isSelected ? 'text-[#CC0000]' : 'text-slate-500'}`}>
                              KSh {service.price.toLocaleString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Step 3 */}
            <section>
              <h2 className="text-2xl font-light text-slate-900 mb-6 flex items-center">
                <span className="text-[#CC0000] font-bold mr-4 text-sm tracking-widest bg-red-50 px-3 py-1 rounded-full">03</span>
                Scheduling & Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <DatePicker 
                    filterDate={(date) => date.getDay() !== 0} 
                    selected={formData.date} 
                    onChange={(date) => setFormData({ ...formData, date: date })} 
                    minDate={new Date()} 
                    dateFormat="MMMM d, yyyy" 
                    placeholderText="Select available date" 
                    className="w-full p-5 bg-white border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-[#CC0000] focus:border-[#CC0000] outline-none transition-all cursor-pointer hover:border-slate-300 shadow-sm" 
                    required 
                  />
                </div>
                <div>
                  <textarea 
                    name="notes" 
                    value={formData.notes} 
                    onChange={handleChange} 
                    rows="1" 
                    className="w-full p-5 bg-white border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-[#CC0000] focus:border-[#CC0000] outline-none transition-all resize-none min-h-[68px] hover:border-slate-300 shadow-sm" 
                    placeholder="Specific issues or symptoms? (Optional)" 
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Right Side: Sticky Checkout Summary */}
          <div className="w-full lg:w-[400px]">
            <div className="sticky top-12 bg-white text-slate-900 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
              <h3 className="text-xl font-bold mb-8">Summary</h3>
              
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                  <span className="text-sm text-slate-500 font-medium">Vehicle</span>
                  <span className="font-semibold text-right max-w-[150px] truncate">
                    {formData.license_plate || <span className="text-slate-300 font-normal">--</span>}
                  </span>
                </div>
                
                <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                  <span className="text-sm text-slate-500 font-medium">Service</span>
                  <span className="font-semibold text-right max-w-[180px] truncate">
                    {formData.serviceType || <span className="text-slate-300 font-normal">--</span>}
                  </span>
                </div>

                <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                  <span className="text-sm text-slate-500 font-medium">Date</span>
                  <span className="font-semibold text-right">
                    {formData.date ? formData.date.toLocaleDateString() : <span className="text-slate-300 font-normal">--</span>}
                  </span>
                </div>
              </div>

              <div className="mt-8 mb-8">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Estimated Total</p>
                <p className="text-4xl font-black tracking-tight text-[#CC0000]">
                  <span className="text-lg text-slate-400 font-semibold mr-1">KSh</span>
                  {Number(formData.price || 0).toLocaleString()}
                </p>
              </div>

              <button 
                type="submit" 
                disabled={!formData.license_plate || !formData.serviceType || !formData.date} 
                className="w-full bg-[#CC0000] text-white py-4 rounded-xl text-lg font-bold hover:bg-red-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-red-500/20 active:scale-[0.98]"
              >
                Confirm Appointment
              </button>
              
              <p className="text-center text-xs text-slate-500 font-medium mt-5 flex items-center justify-center">
                <svg className="w-4 h-4 mr-1.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                Secure Booking. Pay after service.
              </p>
            </div>
          </div>

        </form>
      )}
    </div>
  );
};

export default BookService;