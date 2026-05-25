import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CarFront, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const VehicleReg = () => {
  const navigate = useNavigate();
  
  const [vehicleData, setVehicleData] = useState({
    license_plate: '', 
    make: '', 
    model: '', 
    year: '', 
    vin: '', 
    color: '' // FIXED: lowercase 'c' to match Flask backend!
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const customerID = localStorage.getItem('customer_id') || localStorage.getItem('customerID');
    const token = localStorage.getItem('authToken'); 
    
    if (!customerID || !token) {
        toast.error("Session expired. Please log in again.");
        navigate('/login');
        return;
    }

    const currentYear = new Date().getFullYear();

    if (vehicleData.year.length !== 4 || parseInt(vehicleData.year) < 1980 || parseInt(vehicleData.year) > currentYear) {
      toast.error(`Please enter a valid year between 1980 and ${currentYear}`);
      return;
    }

    try {
      setLoading(true);
      // Clean up the plate before sending
      const finalPlate = vehicleData.license_plate.replace(/\s+/g, ' ').trim().toUpperCase();

      const response = await fetch('http://127.0.0.1:5000/api/vehicle', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...vehicleData,
          license_plate: finalPlate,
          customerID: customerID
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Vehicle registered successfully!");
        navigate('/customer/vehicles');
      } else {
        toast.error(data.message || data.error || "Failed to register vehicle.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Link to="/customer/vehicles" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-[#CC0000] mb-6 transition-colors">
        <ArrowLeft size={16} className="mr-2" /> Back to Garage
      </Link>

      <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-12 shadow-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-red-50 text-[#CC0000] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <CarFront size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Add New Vehicle</h1>
          <p className="text-gray-500 mt-2">Register a new vehicle to your profile for service bookings.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">License Plate *</label>
            <input 
              required
              placeholder="e.g. KCA 123A"
              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 focus:border-[#CC0000] outline-none focus:ring-1 focus:ring-[#CC0000] transition uppercase font-bold" 
              value={vehicleData.license_plate} 
              onChange={(e) => setVehicleData({...vehicleData, license_plate: e.target.value})} 
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Make *</label>
            <input 
              required
              placeholder="e.g. Toyota"
              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 focus:border-[#CC0000] outline-none focus:ring-1 focus:ring-[#CC0000] transition" 
              value={vehicleData.make} 
              onChange={(e) => setVehicleData({...vehicleData, make: e.target.value})} 
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Model *</label>
            <input 
              required
              placeholder="e.g. Harrier"
              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 focus:border-[#CC0000] outline-none focus:ring-1 focus:ring-[#CC0000] transition" 
              value={vehicleData.model} 
              onChange={(e) => setVehicleData({...vehicleData, model: e.target.value})} 
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Year *</label>
            <input 
              required
              type="number"
              placeholder="e.g. 2018"
              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 focus:border-[#CC0000] outline-none focus:ring-1 focus:ring-[#CC0000] transition" 
              value={vehicleData.year} 
              onChange={(e) => setVehicleData({...vehicleData, year: e.target.value})} 
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">VIN (Optional)</label>
            <input 
              placeholder="Vehicle ID Number"
              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 focus:border-[#CC0000] outline-none focus:ring-1 focus:ring-[#CC0000] transition uppercase" 
              value={vehicleData.vin} 
              onChange={(e) => setVehicleData({...vehicleData, vin: e.target.value})} 
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Color</label>
            <input 
              placeholder="e.g. Silver"
              className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 focus:border-[#CC0000] outline-none focus:ring-1 focus:ring-[#CC0000] transition" 
              value={vehicleData.color} 
              onChange={(e) => setVehicleData({...vehicleData, color: e.target.value})} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="md:col-span-2 mt-4 bg-[#CC0000] hover:bg-red-700 text-white font-black py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Register Vehicle</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VehicleReg;