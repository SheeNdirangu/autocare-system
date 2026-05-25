// src/components/Assignments.jsx
import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, AlertTriangle, User, Car, Wrench, Calendar, X } from "lucide-react";

const Assignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [mechanics, setMechanics] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter States
    const [filterMechanic, setFilterMechanic] = useState("All");
    const [filterDate, setFilterDate] = useState(""); // Stores 'YYYY-MM-DD' from the input

    // Retrieve correct authToken used across the system
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");

    // FETCH ASSIGNMENTS
    const fetchAssignments = async () => {
        try {
            setLoading(true);

            const response = await fetch(
                "http://127.0.0.1:5000/api/admin/assignments",
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            setAssignments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch assignments:", err);
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    };

    // FETCH MECHANICS
    const fetchMechanics = async () => {
        try {
            const response = await fetch("http://127.0.0.1:5000/api/admin/mechanics", {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setMechanics(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to fetch mechanics:", err);
        }
    };

    useEffect(() => {
        fetchAssignments();
        fetchMechanics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // MULTI-LEVEL FILTERING LOGIC
    const filteredAssignments = useMemo(() => {
        if (!Array.isArray(assignments)) return [];
        
        // 1. Filter out Cancelled assignments (statusID 5)
        let activeTasks = assignments.filter((a) => a.statusID !== 5); //

        // 2. Apply the mechanic dropdown filter
        if (filterMechanic !== "All") { //
            activeTasks = activeTasks.filter((a) => a.mechanicName === filterMechanic); //
        } //

        // 3. Apply the date input filter
        if (filterDate) {
            activeTasks = activeTasks.filter((a) => {
                // Safeguard to handle either 'date' or 'bookingDate' payloads safely
                const taskDate = a.date || a.bookingDate || "";
                return taskDate.includes(filterDate);
            });
        }

        return activeTasks;
    }, [assignments, filterMechanic, filterDate]);

    // GET STATUS DETAILS
    const getStatusDetails = (statusID) => {
        const statuses = {
            1: { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200" }, //
            2: { label: "In Service", color: "bg-blue-50 text-blue-700 border-blue-200" }, //
            3: { label: "Ready", color: "bg-emerald-50 text-emerald-700 border-emerald-200" }, //
            4: { label: "Completed", color: "bg-gray-100 text-gray-700 border-gray-300" }, //
            5: { label: "Cancelled", color: "bg-red-50 text-red-700 border-red-200" }, //
        };
        return statuses[statusID] || { label: "Unknown", color: "bg-slate-50 text-slate-600 border-slate-200" }; //
    };

    return (
        <div className="p-8 max-w-7xl mx-auto font-sans antialiased">
            
            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
                        Work Assignments
                    </h1>
                    <p className="text-gray-500 font-medium">
                        Track and manage mechanic task allocations.
                    </p>
                </div>

                <button
                    onClick={fetchAssignments}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-[#CC0000] text-gray-700 hover:text-[#CC0000] rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-50 group"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
                    {loading ? "Syncing..." : "Sync Data"}
                </button>
            </div>

            {/* FILTER BAR CONTAINER */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-8 flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between">
                
                {/* Inputs Group */}
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4 w-full lg:w-auto">
                    
                    {/* Mechanic Selector */}
                    <div className="flex flex-col gap-1.5 sm:w-60">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Mechanic Allocation:
                        </span>
                        <select
                            value={filterMechanic}
                            onChange={(e) => setFilterMechanic(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000] block w-full p-3 font-semibold outline-none transition-all cursor-pointer"
                        >
                            <option value="All">All Mechanics</option>
                            {mechanics.map((m) => (
                                <option key={m.mechanicID} value={m.name}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date Selector */}
                    <div className="flex flex-col gap-1.5 sm:w-56 relative">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Service Date:
                        </span>
                        <div className="relative flex items-center">
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000] block w-full p-3 font-semibold outline-none transition-all cursor-pointer appearance-none"
                            />
                            {filterDate && (
                                <button 
                                    onClick={() => setFilterDate("")}
                                    className="absolute right-3 text-gray-400 hover:text-red-500 transition-colors p-1"
                                    title="Clear date filter"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Counter Metric badge */}
                <div className="text-sm font-bold text-gray-500 bg-gray-50 px-5 py-3 rounded-xl border border-gray-100 self-stretch sm:self-auto flex items-center justify-center">
                    Tasks Displayed: &nbsp;<span className="text-[#CC0000] font-black">{filteredAssignments.length}</span>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            {loading && assignments.length === 0 ? (
                <div className="py-24 text-center">
                    <RefreshCw size={32} className="animate-spin text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">
                        Loading Assignments...
                    </p>
                </div>
            ) : filteredAssignments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                        <AlertTriangle size={24} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No Assignments Found</h3>
                    <p className="text-gray-500">There are currently no active tasks matching your select criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAssignments.map((a, index) => {
                        const status = getStatusDetails(a.statusID); //
                        
                        return (
                            <div 
                                key={index} 
                                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-[#CC0000]/30 transition-all duration-300 relative group flex flex-col"
                            >
                                {/* Status Badge & Initials */}
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Mechanic</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-black text-xs border border-gray-200">
                                                {a.mechanicName ? a.mechanicName.charAt(0).toUpperCase() : "?"}
                                            </div>
                                            <h3 className="text-base font-bold text-gray-900 group-hover:text-[#CC0000] transition-colors">
                                                {a.mechanicName || "Unassigned"}
                                            </h3>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${status.color}`}>
                                        {status.label}
                                    </span>
                                </div>

                                <div className="h-px bg-gray-100 w-full mb-5"></div>

                                {/* Details Grid */}
                                <div className="space-y-4 flex-grow">
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Customer</span>
                                        <p className="font-semibold text-gray-800 flex items-center gap-2">
                                            <User size={14} className="text-gray-400" /> {a.customer}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Vehicle</span>
                                        <p className="font-semibold text-gray-800 flex items-center gap-2">
                                            <Car size={14} className="text-gray-400" /> {a.license_plate || a.vehicle}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Service Type</span>
                                        <p className="font-semibold text-gray-800 flex items-center gap-2">
                                            <Wrench size={14} className="text-gray-400" /> {a.serviceType}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Scheduled Date</span>
                                        <p className="font-semibold text-gray-800 flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-400" /> {a.date || a.bookingDate || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Assignments;