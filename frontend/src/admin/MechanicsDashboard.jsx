import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, Trash2, Edit2, Wrench, CheckCircle2, Clock3, X, Phone, Mail, Users, Loader2 } from "lucide-react";

const MechanicsDashboard = () => {
    const [mechanics, setMechanics] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingMechanic, setEditingMechanic] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ FullName: "", PhoneNumber: "", Email: "", Password: "", Specialization: "", Availability: "Available" });

    // ==========================================
    // 1. SECURED FETCH (Added Auth Token)
    // ==========================================
    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const headers = { "Authorization": `Bearer ${token}` };

            const [mechanicsRes, assignmentsRes] = await Promise.all([
                fetch("http://127.0.0.1:5000/api/admin/mechanics", { headers }),
                fetch("http://127.0.0.1:5000/api/admin/assignments", { headers })
            ]);
            
            const mData = await mechanicsRes.json();
            const aData = await assignmentsRes.json();

            setMechanics(Array.isArray(mData) ? mData : []);
            setAssignments(Array.isArray(aData) ? aData : []);

        } catch (err) { 
            console.error(err); 
            setMechanics([]);
            setAssignments([]);
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const validateKenyanPhone = (phone) => /^(07|01)\d{8}$/.test(phone || "");

    // ==========================================
    // 2. SECURED SAVE (Added Auth Token)
    // ==========================================
    const saveMechanic = async () => {
        if (!formData.FullName || !formData.PhoneNumber || !formData.Email) return alert("Please fill all required fields");
        if (!validateKenyanPhone(formData.PhoneNumber)) return alert("Enter valid Kenyan number (e.g. 0712345678)");

        try {
            setSaving(true);
            const token = localStorage.getItem('authToken');
            const url = editingMechanic ? `http://127.0.0.1:5000/api/admin/mechanics/${editingMechanic}` : "http://127.0.0.1:5000/api/admin/mechanics";
            
            const res = await fetch(url, {
                method: editingMechanic ? "PUT" : "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) return alert(data.error || "Failed to save mechanic");
            await fetchData();
            closeModal();
        } catch (err) { console.error(err); } finally { setSaving(false); }
    };

    // ==========================================
    // 3. SECURED DELETE (Added Auth Token)
    // ==========================================
    const deleteMechanic = async (id) => {
        if (!window.confirm("Are you sure you want to remove this mechanic? Their historical records will be saved.")) return;

        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`http://127.0.0.1:5000/api/admin/mechanics/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to remove mechanic.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error.");
        }
    };

    const editMechanic = (m) => {
        const id = m.MechanicID || m.id;
        setEditingMechanic(id);
        setFormData({
            FullName: m.FullName || m.name || "", 
            PhoneNumber: m.PhoneNumber || m.phone || "", 
            Email: m.Email || m.email || "",
            Password: "", 
            Specialization: m.Specialization || m.specialization || "", 
            Availability: m.Availability || m.availability || "Available"
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingMechanic(null);
        setFormData({ FullName: "", PhoneNumber: "", Email: "", Password: "", Specialization: "", Availability: "Available" });
    };

    const filtered = mechanics.filter((m) => {
        const name = m.FullName || m.name || "";
        return name.toLowerCase().includes(search.toLowerCase());
    });

    const workloadMap = useMemo(() => {
        const map = {};
        assignments.forEach((a) => { 
            const mechanicId = a.mechanicID || a.mechanic_id;
            if (mechanicId) map[mechanicId] = (map[mechanicId] || 0) + 1; 
        });
        return map;
    }, [assignments]);

    const availableCount = mechanics.filter(m => (m.Availability || m.availability) === "Available").length;
    const busyCount = mechanics.filter(m => (m.Availability || m.availability) === "Busy").length;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 pb-5 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mechanics Directory</h1>
                    <p className="text-gray-500 mt-1 text-sm">Manage staff, assignments and performance</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-[#CC0000] text-white hover:bg-red-700 transition px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-red-500/20">
                    <Plus className="w-5 h-5" /> Add Mechanic
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <StatCard title="Total Staff" value={mechanics.length} icon={<Users />} color="text-blue-600" bg="bg-blue-50" />
                <StatCard title="Available" value={availableCount} icon={<CheckCircle2 />} color="text-green-600" bg="bg-green-50" />
                <StatCard title="Busy" value={busyCount} icon={<Clock3 />} color="text-yellow-600" bg="bg-yellow-50" />
                <StatCard title="Total Jobs" value={assignments.length} icon={<Wrench />} color="text-purple-600" bg="bg-purple-50" />
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="Search mechanic..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-[#CC0000] transition shadow-sm" />
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-gray-400" /></div>
            ) : filtered.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center text-gray-500 font-medium">No mechanics found</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map((m) => {
                        const id = m.MechanicID || m.id;
                        const name = m.FullName || m.name || "Unknown";
                        const phone = m.PhoneNumber || m.phone || "N/A";
                        const email = m.Email || m.email || "N/A";
                        const spec = m.Specialization || m.specialization || "General";
                        const avail = m.Availability || m.availability || "Unknown";
                        
                        const jobs = workloadMap[id] || 0;

                        return (
                            <div key={id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-[#CC0000] text-lg font-black">{name.charAt(0)}</div>
                                        <div>
                                            <h2 className="font-bold text-gray-900">{name}</h2>
                                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{spec}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                        avail === "Available" ? "bg-green-50 text-green-700 border-green-200" :
                                        avail === "Busy" ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-red-50 text-red-700 border-red-200"
                                    }`}>{avail}</div>
                                </div>
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 text-sm text-gray-600 font-medium"><Phone className="w-4 h-4 text-gray-400" /> {phone}</div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 font-medium"><Mail className="w-4 h-4 text-gray-400" /> {email}</div>
                                </div>
                                <div className="mb-6">
                                    <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"><span>Active Jobs</span><span className="text-gray-900">{jobs}</span></div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden"><div style={{ width: `${Math.min(jobs * 20, 100)}%` }} className="bg-[#CC0000] h-2 rounded-full" /></div>
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button onClick={() => editMechanic(m)} className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 transition py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-sm"><Edit2 className="w-4 h-4" /> Edit</button>
                                    <button onClick={() => deleteMechanic(id)} className="flex-1 bg-red-50 border border-red-100 hover:bg-red-100 text-[#CC0000] transition py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"><Trash2 className="w-4 h-4" /> Delete</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                            <h2 className="text-2xl font-black text-gray-900">{editingMechanic ? "Edit Mechanic" : "Add Mechanic"}</h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-[#CC0000]"><X /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                            <div><label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Full Name</label><input name="FullName" value={formData.FullName} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 p-3.5 rounded-xl outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]" /></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Phone Number</label><input name="PhoneNumber" value={formData.PhoneNumber} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 p-3.5 rounded-xl outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]" /></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Email</label><input name="Email" value={formData.Email} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 p-3.5 rounded-xl outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]" /></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Password</label><input type="password" name="Password" placeholder={editingMechanic ? "Leave blank to keep current" : ""} value={formData.Password} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 p-3.5 rounded-xl outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]" /></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Specialization</label><input name="Specialization" value={formData.Specialization} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 p-3.5 rounded-xl outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]" /></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Status</label>
                                <select name="Availability" value={formData.Availability} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 p-3.5 rounded-xl outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]">
                                    <option>Available</option><option>Busy</option><option>Off Duty</option>
                                </select>
                            </div>
                        </div>
                        <button onClick={saveMechanic} disabled={saving} className="w-full bg-[#CC0000] text-white hover:bg-red-700 transition py-4 rounded-xl font-black uppercase tracking-widest shadow-md">
                            {saving ? "Saving..." : editingMechanic ? "Update Mechanic" : "Add Mechanic"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, icon, color, bg }) => (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex justify-between items-center">
        <div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{title}</p>
            <h2 className="text-3xl font-black text-gray-900 mt-1">{value}</h2>
        </div>
        <div className={`p-3 rounded-xl ${bg} ${color}`}>{icon}</div>
    </div>
);

export default MechanicsDashboard;