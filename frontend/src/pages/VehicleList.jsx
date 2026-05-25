import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { CarFront, Trash2, Plus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const VehicleList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const customerId = localStorage.getItem('customer_id') || localStorage.getItem('customerID');

  const fetchVehicles = () => {
    const token = localStorage.getItem('authToken'); 
    
    fetch(`http://127.0.0.1:5000/api/vehicle?customerID=${customerId}`, {
        headers: { "Authorization": `Bearer ${token}` } 
    })
      .then(res => res.json())
      .then(data => {
        setVehicles(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("Error fetching vehicles:", err);
        toast.error("Failed to load your vehicles.");
        setVehicles([]); 
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!customerId || customerId === 'null') {
      setLoading(false);
      return;
    }
    fetchVehicles();
  }, [customerId]);

  const removeVehicle = async (plate) => {
    if (!window.confirm("Are you sure you want to remove this vehicle? It will be hidden from your active list.")) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://127.0.0.1:5000/api/vehicle/${plate}`, { 
          method: 'DELETE',
          headers: { "Authorization": `Bearer ${token}` } 
      });

      if (response.ok) {
        toast.success("Vehicle removed successfully!");
        fetchVehicles(); // Refresh the list
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to remove vehicle.");
      }
    } catch (error) {
      console.error("Error removing vehicle:", error);
      toast.error("Network error occurred.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-5 mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <CarFront className="text-[#CC0000] w-8 h-8" /> My Garage
          </h2>
          <p className="text-gray-500 mt-1 text-sm">Manage your registered vehicles.</p>
        </div>
        <Link 
          to="/customer/add-vehicle" 
          className="bg-[#CC0000] hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition shadow-md shadow-red-500/20 uppercase tracking-wider text-xs"
        >
          <Plus size={16} /> Add Vehicle
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#CC0000]" />
        </div>
      ) : vehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition group">
              <div className="flex justify-between items-start mb-6">
                <span className="bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm">
                  {vehicle.license_plate}
                </span>
                <button 
                  onClick={() => removeVehicle(vehicle.license_plate)} 
                  className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                  title="Remove Vehicle"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">{vehicle.make}</h3>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">{vehicle.model}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Year</p>
                  <p className="text-gray-900 font-bold">{vehicle.year}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Color</p>
                  <p className="text-gray-900 font-bold">{vehicle.color || 'N/A'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-20 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <CarFront size={40} />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">Your garage is empty</h3>
          <p className="text-gray-500 mb-6">You haven't registered any vehicles yet.</p>
          <Link to="/customer/add-vehicle" className="text-[#CC0000] font-bold hover:underline">
            Click here to register one
          </Link>
        </div>
      )}
    </div>
  );
};

export default VehicleList;