import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, Clock, Wrench, CreditCard, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ServiceTracking = () => {
    const [trackingData, setTrackingData] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Payment Modal States
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('mpesa'); // 'mpesa' or 'cash'
    const [phoneNumber, setPhoneNumber] = useState('');
    const [paymentLoading, setPaymentLoading] = useState(false);

    const customerId = localStorage.getItem('customer_id');
    const savedPhone = localStorage.getItem('phone') || '';

    const fetchTracking = async () => {
        try {
            const token = localStorage.getItem('authToken'); 
            const res = await fetch(`http://127.0.0.1:5000/api/customer/tracking/${customerId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            
            // STRICT FRONTEND FILTER: Ensure only unpaid & non-cancelled jobs enter tracking
            const activeBookings = Array.isArray(data) 
                ? data.filter(job => job.paymentStatus !== "Paid" && job.statusID !== 5 && job.statusID !== 6) 
                : [];
                
            setTrackingData(activeBookings);
        } catch (err) {
            console.error("Tracking fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (customerId) {
            fetchTracking();
            setPhoneNumber(savedPhone);
            const interval = setInterval(fetchTracking, 15000); 
            return () => clearInterval(interval);
        }
    }, [customerId, savedPhone]);

    const handleMpesaPayment = async (e) => {
        e.preventDefault();
        setPaymentLoading(true);

        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`http://127.0.0.1:5000/api/mpesa/stkpush`, {
                method: 'POST',
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    phone: phoneNumber,
                    amount: selectedBooking.amount,
                    bookingID: selectedBooking.bookingID
                })
            });

            const data = await res.json();
            
            if (res.ok) {
                toast.success("M-Pesa prompt sent! Please check your phone.");
                setSelectedBooking(null);
            } else {
                toast.error(data.error || "Failed to trigger M-Pesa.");
            }
        } catch (err) {
            toast.error("Network error. Please try again.");
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleCashSelection = async (bookingID) => {
        setPaymentLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`http://127.0.0.1:5000/api/customer/job/${bookingID}/select-cash`, {
                method: 'PUT',
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.ok) {
                toast.success("Cash payment selected. Please pay at the counter.");
                setSelectedBooking(null);
                fetchTracking();
            } else {
                toast.error("Failed to select cash payment.");
            }
        } catch (err) {
            toast.error("Network error. Please try again.");
        } finally {
            setPaymentLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 my-8 px-4">
            <div className="border-b border-gray-200 pb-5">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <MapPin className="text-[#CC0000] w-8 h-8" /> Live Service Tracking
                </h2>
                <p className="text-gray-500 mt-1 text-sm">Monitor the real-time status of your vehicles in the garage.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#CC0000]" /></div>
            ) : trackingData.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-3xl p-16 text-center shadow-sm">
                    <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-1">No Active Services</h3>
                    <p className="text-gray-500">You don't have any vehicles currently in the workshop.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {trackingData.map((job) => (
                        <div key={job.bookingID} className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                            
                            {/* Color Stripe based on status */}
                            <div className={`absolute top-0 left-0 w-full h-1.5 ${job.statusID === 2 ? 'bg-yellow-500' : job.statusID === 3 ? 'bg-green-500' : 'bg-blue-500'}`}></div>

                            <div className="flex-1 w-full">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md">
                                        {job.license_plate}
                                    </span>
                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                                        Ref: #{job.bookingID}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{job.serviceType}</h3>
                                <p className="text-gray-500 text-sm mt-1">{job.vehicle}</p>
                            </div>

                            <div className="flex-1 w-full flex items-center justify-center">
                                {job.statusID === 1 && (
                                    <div className="flex items-center gap-3 text-blue-600 bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100">
                                        <Clock className="animate-pulse" /> <span className="font-bold uppercase tracking-widest text-xs">Waiting in Queue</span>
                                    </div>
                                )}
                                {job.statusID === 2 && (
                                    <div className="flex items-center gap-3 text-yellow-600 bg-yellow-50 px-6 py-3 rounded-2xl border border-yellow-200">
                                        <Wrench className="animate-spin-slow" /> <span className="font-bold uppercase tracking-widest text-xs">Currently in Bay</span>
                                    </div>
                                )}
                                {job.statusID === 3 && (
                                    <div className="flex items-center gap-3 text-green-600 bg-green-50 px-6 py-3 rounded-2xl border border-green-200">
                                        <CheckCircle /> <span className="font-bold uppercase tracking-widest text-xs">Service Complete</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 w-full flex flex-col items-end border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8 mt-4 md:mt-0">
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Due</p>
                                <p className="text-2xl font-black text-gray-900 mb-4">KES {job.amount}</p>
                                
                                {job.statusID === 3 && job.paymentStatus !== "Paid" && job.paymentMethod !== "Cash" && (
                                    <button 
                                        onClick={() => { setSelectedBooking(job); setPaymentMethod('mpesa'); }}
                                        className="w-full sm:w-auto bg-[#CC0000] text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-md shadow-red-500/20 hover:bg-red-700 transition"
                                    >
                                        Pay Bill Now
                                    </button>
                                )}
                                {job.statusID === 3 && job.paymentMethod === "Cash" && (
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center border border-gray-200 bg-gray-50 px-4 py-2 rounded-lg">
                                        Paying at Counter
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* PAYMENT MODAL */}
            {selectedBooking && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Checkout</h3>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">
                                Ref: #{selectedBooking.bookingID} - {selectedBooking.license_plate}
                            </p>
                        </div>

                        <div className="flex bg-gray-100 p-1.5 rounded-xl mb-8 border border-gray-200">
                            <button 
                                onClick={() => setPaymentMethod('mpesa')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-lg transition ${paymentMethod === 'mpesa' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                M-PESA
                            </button>
                            <button 
                                onClick={() => setPaymentMethod('cash')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-lg transition ${paymentMethod === 'cash' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                CASH / CARD
                            </button>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8 flex justify-between items-center">
                            <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Total Due</span>
                            <span className="text-2xl font-black text-gray-900">KES {selectedBooking.amount}</span>
                        </div>

                        {paymentMethod === 'mpesa' ? (
                            <form onSubmit={handleMpesaPayment} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">M-Pesa Number</label>
                                    <input 
                                        type="text" 
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="w-full bg-white border border-gray-300 p-4 rounded-xl text-gray-900 font-bold focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                                        placeholder="07XX XXX XXX"
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setSelectedBooking(null)} className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-xl transition">
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={paymentLoading}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-3.5 rounded-xl transition shadow-md shadow-green-600/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
                                    >
                                        {paymentLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Pay Now"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6 text-center">
                                <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
                                    <CreditCard className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600 text-sm font-medium">
                                        Please proceed to the administration desk at the garage to process your physical payment.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setSelectedBooking(null)} className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-xl transition">
                                        Cancel
                                    </button>
                                    <button 
                                        type="button" 
                                        disabled={paymentLoading}
                                        onClick={() => handleCashSelection(selectedBooking.bookingID)} 
                                        className="flex-1 bg-gray-900 hover:bg-black text-white font-black py-3.5 rounded-xl transition shadow-md flex justify-center items-center gap-2 disabled:opacity-50 uppercase tracking-widest text-xs"
                                    >
                                        {paymentLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Understood"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceTracking;