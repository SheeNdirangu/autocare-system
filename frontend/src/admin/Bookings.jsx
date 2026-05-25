import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Trash2, CalendarCheck, Archive, Printer, Download, XCircle } from 'lucide-react';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [mechanics, setMechanics] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // FILTERS
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("active");
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterServiceType, setFilterServiceType] = useState("All"); // NEW: Service history filter element
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    // EXPORT STATES
    const reportRef = useRef();
    const [isExporting, setIsExporting] = useState(false);

    const getStatusLabel = (id) => {
        const statuses = {
            1: { label: "Pending", color: "bg-blue-50 text-blue-700 border-blue-200" },
            2: { label: "In Service", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
            3: { label: "Ready / Unpaid", color: "bg-orange-50 text-orange-700 border-orange-200" },
            4: { label: "Completed & Paid", color: "bg-green-50 text-green-700 border-green-200" },
            5: { label: "Cancelled", color: "bg-red-50 text-red-700 border-red-200" },
            6: { label: "Archived (Cancelled)", color: "bg-gray-100 text-gray-600 border-gray-200" }
        };
        return statuses[id] || { label: "Unknown", color: "bg-gray-100 text-gray-500 border-gray-200" };
    };

    // Extract unique service types for the dropdown dynamic options list
    const uniqueServiceTypes = Array.from(
        new Set(bookings.map(b => b.serviceType).filter(Boolean))
    );

    // ==========================================
    // DATA FETCHING (CACHE BUSTED)
    // ==========================================
    const fetchBookings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const res = await fetch("http://127.0.0.1:5000/api/admin/bookings", {
                headers: { "Authorization": `Bearer ${token}` },
                cache: 'no-store'
            });
            const data = await res.json();
            setBookings(Array.isArray(data) ? data : []);
        } catch (err) { 
            console.error(err); 
            setBookings([]);
        } finally { 
            setLoading(false); 
        }
    };

    const fetchMechanics = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch("http://127.0.0.1:5000/api/admin/mechanics", {
                headers: { "Authorization": `Bearer ${token}` },
                cache: 'no-store'
            });
            const data = await res.json();
            setMechanics(Array.isArray(data) ? data : []);
        } catch (err) { 
            console.error(err); 
            setMechanics([]);
        }
    };

    useEffect(() => {
        fetchBookings();
        fetchMechanics();
    }, []);

    // ==========================================
    // CONFIRM CASH PAYMENT ACTION
    // ==========================================
    const confirmCashPayment = async (bookingID) => {
        if (!window.confirm("Confirm cash payment received?")) return;
        
        setBookings(prev => prev.map(b => b.bookingID === bookingID ? { ...b, statusID: 4, paymentStatus: "Paid" } : b));

        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`http://127.0.0.1:5000/api/admin/confirm-payment/${bookingID}`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({ method: "Cash" })
            });

            if (res.ok) fetchBookings(); 
            else { alert("Failed to confirm payment on server."); fetchBookings(); }
        } catch (err) { console.error(err); fetchBookings(); }
    };

    // ==========================================
    // MECHANIC REASSIGNMENT
    // ==========================================
    const assignMechanic = async (bookingID, mechanicID) => {
        const mechanicName = mechanics.find(m => (m.MechanicID || m.id) === mechanicID)?.FullName || mechanics.find(m => (m.MechanicID || m.id) === mechanicID)?.name || "Unassigned";
        setBookings(prev => prev.map(b => b.bookingID === bookingID ? { ...b, mechanicID, mechanicName } : b));

        try {
            const token = localStorage.getItem('authToken');
            await fetch(`http://127.0.0.1:5000/api/admin/reassign/${bookingID}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({ mechanicID: mechanicID ?? null })
            });
            fetchBookings();
        } catch (err) { console.error(err); fetchBookings(); }
    };

    // ==========================================
    // ARCHIVE CANCELLED BOOKING (TRASH BIN ACTION)
    // ==========================================
    const handleArchiveCancel = async (id) => {
        if (window.confirm("Move this cancelled booking to the archived history?")) {
            setBookings(prev => prev.map(b => b.bookingID === id ? { ...b, statusID: 6 } : b));

            try {
                const token = localStorage.getItem('authToken');
                await fetch(`http://127.0.0.1:5000/api/admin/bookings/${id}/archive-cancel`, { 
                    method: 'PUT',
                    headers: { "Authorization": `Bearer ${token}` }
                });
                fetchBookings();
            } catch (err) { 
                alert("Error archiving record"); 
                fetchBookings();
            }
        }
    };

    // ==========================================
    // REVISED WORKFLOW TAB & RUNTIME FILTER LOGIC
    // ==========================================
    const filteredBookings = bookings.filter((b) => {
        const matchesSearch = (b.customer || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (b.license_plate || "").toLowerCase().includes(searchTerm.toLowerCase());
        
        // Exact state distribution assignment
        let matchesTab = false;
        if (activeTab === "active") {
            // ONLY core handling statuses. Cancelled are kept separate.
            matchesTab = (b.statusID === 1 || b.statusID === 2 || b.statusID === 3) && b.paymentStatus !== "Paid";
        } else if (activeTab === "history") {
            // Completed and settled transactions
            matchesTab = (b.statusID === 4 || b.paymentStatus === "Paid");
        } else if (activeTab === "cancelled") {
            // Shows customer cancelled state (5) and archived cancelled states (6)
            matchesTab = (b.statusID === 5 || b.statusID === 6);
        }
        
        const statusObj = getStatusLabel(b.statusID);
        const matchesStatus = filterStatus === "All" || statusObj.label.includes(filterStatus);

        // Filter out based on chosen Service Type dropdown string matching logic
        const matchesServiceType = filterServiceType === "All" || b.serviceType === filterServiceType;

        let matchesDate = true;
        if (startDate || endDate) {
            const bDate = new Date(b.bookingDate);
            if (startDate && bDate < startDate) matchesDate = false;
            if (endDate && bDate > endDate) matchesDate = false;
        }

        return matchesSearch && matchesTab && matchesStatus && matchesServiceType && matchesDate;
    });

    // Handle columns length mapping cleanly inside DOM array layouts
    let totalColumns = isExporting ? 3 : 4; // Date, Customer, Vehicle, Mechanic (dropped if exporting)
    if (activeTab !== "history" && !isExporting) {
        totalColumns += 2; // Status & Manage (both dropped if exporting)
    }

    // ==========================================
    // EXPORT & PRINT LOGIC
    // ==========================================
    const handlePrint = () => {
        setIsExporting(true);
        setTimeout(() => {
            const printContents = reportRef.current.innerHTML;
            const win = window.open("", "", "width=1200,height=900");
            win.document.write(`
                <html>
                    <head>
                        <title>AUTOCARE PRO - Bookings Report</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
                            body { font-family: 'Inter', sans-serif; padding: 40px; background: white; color: #111827; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border-bottom: 1px solid #e5e7eb; padding: 12px; text-align: left; }
                            th { background-color: #f9fafb; color: #6b7280; text-transform: uppercase; font-size: 12px; font-weight: bold; }
                            .no-print { display: none !important; }
                        </style>
                    </head>
                    <body>${printContents}</body>
                </html>
            `);
            win.document.close();
            win.focus();
            setTimeout(() => { win.print(); win.close(); setIsExporting(false); }, 1000);
        }, 500);
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        setTimeout(async () => {
            const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
            const pdf = new jsPDF("p", "mm", "a4");
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight);
            pdf.save(`AUTOCARE_PRO_Bookings_${new Date().getTime()}.pdf`);
            setIsExporting(false);
        }, 500);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                
                {/* HEADER & TABS */}
                <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-gray-50/50">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                            <CalendarCheck className="text-[#CC0000]" /> Service Bookings
                        </h1>
                        <p className="text-gray-500 text-sm mt-1 mb-4">Manage, filter, and export workflow records</p>

                        <div className="flex space-x-2 bg-gray-200/50 p-1 rounded-xl w-fit flex-wrap">
                            <button onClick={() => { setActiveTab("active"); setFilterStatus("All"); setFilterServiceType("All"); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "active" ? "bg-white text-[#CC0000] shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>
                                Active Queue
                            </button>
                            <button onClick={() => { setActiveTab("history"); setFilterStatus("All"); setFilterServiceType("All"); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "history" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>
                                <Archive size={16}/> Service History
                            </button>
                            <button onClick={() => { setActiveTab("cancelled"); setFilterStatus("All"); setFilterServiceType("All"); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "cancelled" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-red-600"}`}>
                                <XCircle size={16}/> Cancelled
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={handlePrint} disabled={isExporting} className="bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition flex items-center gap-2 disabled:opacity-50">
                            <Printer size={16} /> Print
                        </button>
                        <button onClick={handleExportPDF} disabled={isExporting} className="bg-[#CC0000] text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-red-500/20 hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50">
                            <Download size={16} /> PDF
                        </button>
                    </div>
                </div>

                {/* FILTERS BAR */}
                <div className="p-6 border-b border-gray-100 bg-white flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Search customer or plate..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#CC0000] w-full md:w-64"
                    />
                    
                    <DatePicker 
                        selectsRange 
                        startDate={startDate} 
                        endDate={endDate} 
                        onChange={(update) => { setStartDate(update[0]); setEndDate(update[1]); }} 
                        isClearable 
                        placeholderText="Filter by Date Range" 
                        className="bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#CC0000] w-full md:w-64 cursor-pointer" 
                    />

                    {/* DYNAMIC SERVICE TYPE FILTER MENU FOR HISTORY BAR VIEW */}
                    {activeTab === "history" && (
                        <select 
                            value={filterServiceType} 
                            onChange={(e) => setFilterServiceType(e.target.value)}
                            className="bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#CC0000] w-full md:w-56 cursor-pointer font-medium text-gray-700"
                        >
                            <option value="All">All Service Types</option>
                            {uniqueServiceTypes.map((type, idx) => (
                                <option key={idx} value={type}>{type}</option>
                            ))}
                        </select>
                    )}

                    {activeTab === "active" && (
                        <select 
                            value={filterStatus} 
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#CC0000] w-full md:w-48 cursor-pointer font-medium text-gray-700"
                        >
                            <option value="All">All Active Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="In Service">In Service</option>
                            <option value="Ready">Ready / Unpaid</option>
                        </select>
                    )}

                    <button onClick={fetchBookings} className="bg-gray-50 border border-gray-200 p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 ml-auto">
                        <RefreshCw className={loading ? "animate-spin w-5 h-5" : "w-5 h-5"} />
                    </button>
                </div>

                {/* MAIN TABLE CONTAINER */}
                <div className="overflow-x-auto bg-white p-8" ref={reportRef}>
                    {isExporting && (
                        <div className="mb-10 text-center border-b-2 border-gray-900 pb-8">
                            <div className="flex justify-center mb-4">
                                <div className="bg-[#CC0000] w-16 h-16 rounded-xl flex items-center justify-center font-black text-white text-3xl shadow-md">AC</div>
                            </div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">AUTOCARE PRO</h1>
                            <p className="text-gray-500 font-bold tracking-widest uppercase text-sm mt-3">
                                Official Bookings Report ({activeTab === 'active' ? 'Active Queue' : activeTab === 'history' ? 'Service History' : 'Cancelled Bookings'})
                            </p>
                        </div>
                    )}

                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold tracking-wider border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Vehicle & Service</th>
                                
                                {/* OMIT MECHANIC IF EXPORTING */}
                                {!isExporting && (
                                    <th className="px-6 py-4 no-print" data-html2canvas-ignore="true">Mechanic</th>
                                )}
                                
                                {/* Conditionality applies to drop Status column if Service History view is selected OR Exporting */}
                                {activeTab !== "history" && !isExporting && (
                                    <th className="px-6 py-4 no-print" data-html2canvas-ignore="true">Status</th>
                                )}
                                
                                {/* {!isExporting && activeTab !== "history" && (
                                    <th className="px-6 py-4 text-center no-print" data-html2canvas-ignore="true">Manage</th>
                                )} */}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredBookings.length > 0 ? (
                                filteredBookings.map((b) => {
                                    const status = getStatusLabel(b.statusID);

                                    return (
                                        <tr key={b.bookingID} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="font-bold text-gray-900">{b.bookingDate}</div>
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="font-bold text-gray-900">{b.customer}</div>
                                                <div className="text-xs text-gray-400 font-mono mt-0.5">#{b.bookingID}</div>
                                            </td>
                                            
                                            <td className="px-6 py-5">
                                                <div className="font-bold text-gray-700">{b.license_plate}</div>
                                                <div className="text-gray-500 mt-0.5 text-xs">{b.serviceType}</div>
                                            </td>

                                            {/* OMIT MECHANIC IF EXPORTING */}
                                            {!isExporting && (
                                                <td className="px-6 py-5 no-print" data-html2canvas-ignore="true">
                                                    {activeTab === "active" && !isExporting && b.statusID < 3 ? (
                                                        <select
                                                            value={b.mechanicID || ""}
                                                            onChange={(e) => assignMechanic(b.bookingID, e.target.value === "" ? null : Number(e.target.value))}
                                                            className="bg-white border border-gray-300 px-3 py-2 rounded-lg text-xs outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] w-full max-w-[150px] font-medium text-gray-700 shadow-sm"
                                                        >
                                                            <option value="">Unassigned</option>
                                                            {mechanics.map((m) => {
                                                                const id = m.MechanicID || m.id;
                                                                const name = m.FullName || m.name || "Unknown";
                                                                return <option key={id} value={id}>{name}</option>;
                                                            })}
                                                        </select>
                                                    ) : (
                                                        <span className={`font-medium ${b.statusID >= 5 ? "text-gray-400 line-through" : "text-gray-700"}`}>
                                                            {b.mechanicName || "Unassigned"}
                                                        </span>
                                                    )}
                                                </td>
                                            )}

                                            {/* STATUS CELL CONDITIONALLY OMITTED FOR SERVICE HISTORY AND EXPORTS */}
                                            {activeTab !== "history" && !isExporting && (
                                                <td className="px-6 py-5 no-print" data-html2canvas-ignore="true">
                                                    <div className="flex flex-col gap-3 items-start">
                                                        <span className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold border ${status.color}`}>
                                                            {status.label}
                                                        </span>

                                                        {(b.statusID === 5 || b.statusID === 6) && !isExporting && (
                                                            <button 
                                                                onClick={() => alert(`Customer's Reason for Cancellation:\n\n"${b.cancellation_reason}"`)}
                                                                className="text-[10px] font-bold text-red-600 underline hover:text-red-800"
                                                            >
                                                                View Reason
                                                            </button>
                                                        )}
                                                        
                                                        {activeTab === "active" && !isExporting && b.statusID === 3 && b.paymentMethod === "Cash" && (
                                                            <div className="flex gap-2 text-xs font-bold mt-1">
                                                                <button onClick={() => confirmCashPayment(b.bookingID)} className="bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-black transition shadow-sm uppercase tracking-wider text-[10px] font-black">
                                                                    Confirm Cash Received
                                                                </button>
                                                            </div>
                                                        )}

                                                        {activeTab === "active" && !isExporting && b.statusID === 3 && b.paymentMethod !== "Cash" && (
                                                            <div className="mt-2 text-[11px] font-bold text-gray-400 italic">
                                                                Awaiting Customer Payment...
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            )}

                                            {/* MANAGE CELL - TRASH BIN ONLY ACCESSIBLE WITHIN THE CANCELLED TAB LIST */}
                                            {!isExporting && activeTab !== "history" && (
                                                <td className="px-6 py-5 text-center no-print" data-html2canvas-ignore="true">
                                                    {/* {b.statusID === 5 ? (
                                                        <button 
                                                            onClick={() => handleArchiveCancel(b.bookingID)} 
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center w-full" 
                                                            title="Archive Cancellation"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-300 text-xs">-</span>
                                                    )} */}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={totalColumns} className="px-6 py-16 text-center text-gray-500 font-medium">
                                        No matching bookings found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Bookings;