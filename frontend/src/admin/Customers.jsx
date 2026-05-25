import React, { useState, useEffect } from 'react';
import { Users, Eye, X, Phone, Mail, Calendar, CarFront, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem('authToken');
        // Make sure you have this endpoint built in your Flask routes!
        const response = await fetch('http://127.0.0.1:5000/api/admin/customers', {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setCustomers(data);
        } else {
          toast.error("Failed to load customers data.");
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error("Network error while fetching customers.");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 py-8">
      
      {/* Header */}
      <div className="border-b border-gray-200 pb-5 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Users className="text-[#CC0000] w-8 h-8" /> Customer Directory
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            Manage registered clients and view their vehicle portfolios.
          </p>
        </div>
        <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold shadow-inner">
          Total Customers: {customers.length}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-[#CC0000]" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No customers found in the database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest">ID</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Customer Name</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Vehicles</th>
                  {/* <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th> */}
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer) => (
                  <tr key={customer.customerID} className="hover:bg-gray-50 transition duration-150">
                    <td className="p-4 font-bold text-gray-900">#{customer.customerID}</td>
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{customer.FullName}</p>
                      <p className="text-xs text-gray-500">{customer.Email}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center bg-gray-100 text-gray-900 font-black rounded-lg w-8 h-8 text-sm">
                        {customer.vehicles ? customer.vehicles.length : 0}
                      </span>
                    </td>
                    {/* <td className="p-4">
                      {customer.is_verified ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-200">
                          <ShieldCheck size={12} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-yellow-200">
                          <ShieldAlert size={12} /> Pending
                        </span>
                      )}
                    </td> */}
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => setSelectedCustomer(customer)}
                        className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-[#CC0000] hover:bg-red-50 rounded-xl transition"
                        title="View Details"
                      >
                        <Eye size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Details Modal Overlay */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 lg:p-8 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                  {selectedCustomer.FullName}
                </h3>
                <p className="text-sm text-gray-500 font-medium mt-1">Customer ID: #{selectedCustomer.customerID}</p>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 lg:p-8 space-y-8">
              
              {/* Contact Information Grid */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <Mail className="text-[#CC0000] w-5 h-5" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Email Address</p>
                      <p className="font-bold text-gray-900 text-sm">{selectedCustomer.Email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <Phone className="text-[#CC0000] w-5 h-5" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Phone Number</p>
                      <p className="font-bold text-gray-900 text-sm">{selectedCustomer.PhoneNumber || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 md:col-span-2">
                    <Calendar className="text-[#CC0000] w-5 h-5" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Date Joined</p>
                      <p className="font-bold text-gray-900 text-sm">
                        {selectedCustomer.DateJoined ? new Date(selectedCustomer.DateJoined).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registered Vehicles Section */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                  <span>Registered Vehicles</span>
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md text-[10px]">
                    {selectedCustomer.vehicles?.length || 0} Total
                  </span>
                </h4>
                
                {selectedCustomer.vehicles && selectedCustomer.vehicles.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCustomer.vehicles.map((vehicle, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-[#CC0000] transition">
                        <div className="flex items-center gap-4">
                          <div className="bg-red-50 text-[#CC0000] p-3 rounded-xl">
                            <CarFront size={20} />
                          </div>
                          <div>
                            <p className="font-black text-gray-900 uppercase tracking-wide">
                              {vehicle.make} {vehicle.model}
                            </p>
                            <p className="text-xs font-bold text-gray-500 uppercase">
                              {vehicle.year} • {vehicle.color || 'No Color'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm">
                            {vehicle.license_plate}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-gray-50 border border-dashed border-gray-300 rounded-2xl">
                    <CarFront className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-500">No vehicles registered yet.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Customers;