import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, CheckCircle, Play, Plus, Loader2 } from 'lucide-react';

const MechanicPortal = () => {
    const navigate = useNavigate();
    const mechanicId = localStorage.getItem('mechanic_id');
    const mechanicName = localStorage.getItem('userName') || "Mechanic";
    
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chargeForm, setChargeForm] = useState({ id: null, desc: "", amount: "" });

    const fetchJobs = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`http://127.0.0.1:5000/api/mechanic/jobs/${mechanicId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            setJobs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching jobs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!mechanicId) {
            navigate('/login');
            return;
        }
        fetchJobs();
    }, [mechanicId, navigate]);

    const updateJobStatus = async (bookingID, newStatus) => {
        try {
            const token = localStorage.getItem('authToken');
            await fetch(`http://127.0.0.1:5000/api/mechanic/job/${bookingID}/status`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ statusID: newStatus })
            });
            fetchJobs();
        } catch (err) {
            alert("Failed to update status.");
        }
    };

    const handleAddCharge = async (e, bookingID) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`http://127.0.0.1:5000/api/mechanic/job/${bookingID}/add-charge`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    description: chargeForm.desc, 
                    amount: parseFloat(chargeForm.amount) 
                })
            });

            if (res.ok) {
                setChargeForm({ id: null, desc: "", amount: "" });
                fetchJobs(); 
                alert("Part & Charge added successfully!");
            }
        } catch (err) {
            alert("Failed to add charge.");
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-900">
            <Loader2 className="animate-spin w-10 h-10 text-[#CC0000]" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                <header className="flex justify-between items-end border-b border-gray-200 pb-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 text-[#CC0000] mb-2">
                            <Wrench size={24} />
                            <span className="font-black tracking-widest uppercase text-xs">Workstation</span>
                        </div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900">Welcome, {mechanicName}</h1>
                    </div>
                    <button onClick={handleLogout} className="text-gray-500 hover:text-gray-900 text-xs font-bold uppercase tracking-widest transition-colors">
                        Sign Out 
                    </button>
                </header>

                <div className="grid md:grid-cols-2 gap-6">
                    {jobs.length === 0 ? (
                        <div className="col-span-2 text-center py-20 text-gray-400 bg-white rounded-3xl border border-gray-200 shadow-sm">
                            <Wrench className="mx-auto mb-4 opacity-20 text-gray-400" size={48} />
                            <p className="font-bold uppercase tracking-widest text-sm text-gray-500">No active jobs assigned</p>
                        </div>
                    ) : (
                        jobs.map(job => (
                            <div key={job.bookingID} className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm relative overflow-hidden flex flex-col justify-between group">
                                {/* Status Color Stripe */}
                                <div className={`absolute top-0 left-0 w-full h-1.5 ${job.statusID === 1 ? 'bg-amber-500' : 'bg-[#CC0000]'}`}></div>

                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <h2 className="text-3xl font-black tracking-tight text-gray-900">{job.license_plate}</h2>
                                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                            job.statusID === 1 
                                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                                : 'bg-red-50 text-[#CC0000] border-red-200'
                                        }`}>
                                            {job.statusID === 1 ? 'Pending' : 'In Service'}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-6">{job.serviceType}</p>
                                </div>

                                {/* Extra Charges Section (Only visible when In Service) */}
                                {job.statusID === 2 && (
                                    <div className="mb-6 border-t border-gray-100 pt-5">
                                        {chargeForm.id === job.bookingID ? (
                                            <form onSubmit={(e) => handleAddCharge(e, job.bookingID)} className="bg-gray-50 border border-gray-200 p-5 rounded-2xl space-y-4">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Add Extra Part / Labor</p>
                                                <input type="text" placeholder="Part Name (e.g. Brake Pads)" required value={chargeForm.desc} onChange={(e) => setChargeForm({...chargeForm, desc: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#CC0000] transition" />
                                                <input type="number" placeholder="Cost (KES)" required value={chargeForm.amount} onChange={(e) => setChargeForm({...chargeForm, amount: e.target.value})} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#CC0000] transition" />
                                                <div className="flex gap-2 pt-1">
                                                    <button type="submit" className="flex-1 bg-gray-900 text-white text-xs font-black py-3 rounded-xl hover:bg-black uppercase tracking-wider transition">Save</button>
                                                    <button type="button" onClick={() => setChargeForm({id: null, desc: "", amount: ""})} className="flex-1 bg-white border border-gray-200 text-gray-600 text-xs font-black py-3 rounded-xl hover:bg-gray-100 uppercase tracking-wider transition">Cancel</button>
                                                </div>
                                            </form>
                                        ) : (
                                            <button onClick={() => setChargeForm({id: job.bookingID, desc: "", amount: ""})} className="text-gray-500 hover:text-[#CC0000] text-xs font-bold flex items-center gap-2 transition-colors py-1">
                                                <Plus size={14} /> Add Extra Parts / Charges
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons mapped to state transitions */}
                                <div className="mt-4">
                                    {job.statusID === 1 ? (
                                        <button onClick={() => updateJobStatus(job.bookingID, 2)} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 rounded-xl shadow-sm shadow-amber-500/10">
                                            <Play size={16} fill="currentColor" /> Start Service
                                        </button>
                                    ) : (
                                        <button onClick={() => updateJobStatus(job.bookingID, 3)} className="w-full bg-[#CC0000] hover:bg-red-700 text-white font-black py-4 text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 rounded-xl shadow-sm shadow-red-500/10">
                                            <CheckCircle size={16} /> Finish & Mark Ready
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MechanicPortal;