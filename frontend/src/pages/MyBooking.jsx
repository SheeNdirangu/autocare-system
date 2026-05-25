import React, { useState, useEffect } from 'react';
import { CalendarCheck, Clock, CalendarDays, X, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MyBooking = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [cancelModal, setCancelModal] = useState({ show: false, bookingId: null, reason: "" });
    const [rescheduleModal, setRescheduleModal] = useState({ show: false, booking: null, newDate: "" });
    const [processing, setProcessing] = useState(false);

    const customerId = localStorage.getItem('customer_id');

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const res = await fetch(`http://127.0.0.1:5000/api/my-bookings/${customerId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            setBookings(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching bookings:", err);
            toast.error("Failed to fetch bookings.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (customerId) fetchBookings();
    }, [customerId]);

    // ==========================================
    // CANCEL LOGIC
    // ==========================================
    const handleCancel = async () => {
        if (!cancelModal.reason.trim()) {
            toast.error("Please provide a reason for cancellation.");
            return;
        }

        setProcessing(true);
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`http://127.0.0.1:5000/api/bookings/${cancelModal.bookingId}/cancel`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ reason: cancelModal.reason })
            });

            if (res.ok) {
                toast.success("Booking cancelled successfully!");
                setCancelModal({ show: false, bookingId: null, reason: "" });
                fetchBookings();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to cancel booking.");
            }
        } catch (err) {
            toast.error("Network error. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    // ==========================================
    // RESCHEDULE LOGIC
    // ==========================================
    const handleReschedule = async () => {
        if (!rescheduleModal.newDate) return toast.error("Please select a new date.");

        setProcessing(true);
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`http://127.0.0.1:5000/api/bookings/${rescheduleModal.booking.id}/reschedule`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ newDate: rescheduleModal.newDate })
            });

            if (res.ok) {
                toast.success("Booking rescheduled successfully!");
                setRescheduleModal({ show: false, booking: null, newDate: "" });
                fetchBookings();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to reschedule booking.");
            }
        } catch (err) {
            toast.error("Network error. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 my-8 px-4">
            
            <div className="border-b border-gray-200 pb-5">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <CalendarDays className="text-[#CC0000] w-8 h-8" /> My Appointments
                </h2>
                <p className="text-gray-500 mt-1 text-sm">Manage your upcoming service bookings and schedules.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#CC0000]" /></div>
            ) : bookings.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-3xl p-16 text-center shadow-sm">
                    <CalendarCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-1">No Upcoming Bookings</h3>
                    <p className="text-gray-500">You don't have any pending service appointments.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {bookings.map((booking) => (
                        <div key={booking.id} className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition">
                            
                            <div className="flex items-start gap-5">
                                <div className="bg-red-50 p-4 rounded-2xl text-[#CC0000] border border-red-100 hidden sm:block">
                                    <Clock size={28} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md">
                                            {booking.license_plate}
                                        </span>
                                        <span className="text-[#CC0000] text-sm font-bold flex items-center gap-1">
                                            <CalendarDays size={14}/> {booking.appointment_date}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900">
                                        {booking.service_type}
                                    </h3>
                                    <p className="mt-2 text-xs font-bold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200 w-fit px-3 py-1 rounded-lg">
                                        {booking.statusID === 1 ? 'Pending Approval' : 'In Service Bay'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto">
                                {booking.statusID === 1 ? (
                                    <>
                                        <button 
                                            onClick={() => setRescheduleModal({ show: true, booking, newDate: "" })}
                                            className="flex-1 md:flex-none bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl transition text-xs uppercase tracking-widest"
                                        >
                                            Reschedule
                                        </button>
                                        <button 
                                            onClick={() => setCancelModal({ show: true, bookingId: booking.id, reason: "" })}
                                            className="flex-1 md:flex-none bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-500 hover:text-[#CC0000] font-bold py-3 px-6 rounded-xl transition text-xs uppercase tracking-widest"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <div className="bg-gray-50 border border-gray-200 px-6 py-4 rounded-xl text-center w-full">
                                        <AlertCircle className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Locked</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CANCEL CONFIRMATION MODAL */}
            {cancelModal.show && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
                        <div className="w-16 h-16 bg-red-50 text-[#CC0000] rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Cancel Booking?</h3>
                        <p className="text-gray-500 text-sm mb-6">This action cannot be undone. Please let us know why you are cancelling.</p>
                        
                        <textarea 
                            value={cancelModal.reason}
                            onChange={(e) => setCancelModal({...cancelModal, reason: e.target.value})}
                            placeholder="Reason for cancellation..."
                            className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl mb-6 text-sm outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]"
                            rows="3"
                        />

                        <div className="flex gap-3">
                            <button onClick={() => setCancelModal({ show: false, bookingId: null, reason: "" })} className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-xl transition">
                                Keep It
                            </button>
                            <button disabled={processing} onClick={handleCancel} className="flex-1 bg-[#CC0000] hover:bg-red-700 text-white font-black py-3.5 rounded-xl transition flex items-center justify-center disabled:opacity-50 uppercase tracking-widest text-xs">
                                {processing ? <Loader2 className="animate-spin w-4 h-4" /> : "Yes, Cancel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RESCHEDULE MODAL */}
            {rescheduleModal.show && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="bg-gray-50 border-b border-gray-100 p-6 flex justify-between items-center">
                            <h3 className="text-xl font-black text-gray-900">Reschedule Appointment</h3>
                            <button onClick={() => setRescheduleModal({ show: false, booking: null, newDate: "" })} className="text-gray-400 hover:text-gray-900">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Current Vehicle</p>
                                <p className="font-black text-gray-900">{rescheduleModal.booking?.license_plate} - {rescheduleModal.booking?.service_type}</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                                    New Appointment Date
                                </label>
                                <input 
                                    type="date" 
                                    min={getTodayDate()}
                                    value={rescheduleModal.newDate}
                                    onChange={(e) => setRescheduleModal({ ...rescheduleModal, newDate: e.target.value })}
                                    className="w-full bg-white border border-gray-300 p-4 rounded-xl outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] font-medium text-gray-900 shadow-sm"
                                    required
                                />
                            </div>

                            <button 
                                onClick={handleReschedule}
                                disabled={processing}
                                className="w-full bg-[#CC0000] hover:bg-red-700 text-white font-black py-4 rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-widest text-xs mt-4"
                            >
                                {processing ? <Loader2 className="animate-spin w-5 h-5" /> : "Confirm New Date"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyBooking;