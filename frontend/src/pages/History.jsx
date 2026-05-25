import React, { useEffect, useState } from 'react';
import { Download, FileText, CheckCircle, Loader2, Archive, Calendar, Filter, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // NEW: Filter States
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedVehicle, setSelectedVehicle] = useState("");
    const [selectedService, setSelectedService] = useState("");

    const customerId = localStorage.getItem('customer_id') || localStorage.getItem('customerID');
    const customerName = localStorage.getItem('userName') || "Valued Customer";

    const fetchHistory = async () => {
        if (!customerId || customerId === 'null') {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            
            const res = await fetch(`http://127.0.0.1:5000/api/service-history/${customerId}`, {
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            const data = await res.json();
            
            if (Array.isArray(data)) {
                // Sort them by newest first
                const sortedRecords = data.sort((a, b) => 
                    new Date(b.date || b.bookingDate || b.appointment_date) - 
                    new Date(a.date || a.bookingDate || a.appointment_date)
                );
                setHistory(sortedRecords);
            } else {
                setHistory([]);
            }
        } catch (err) {
            console.error("Error fetching history:", err);
            toast.error("Failed to load service history.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [customerId]);

    // ==========================================
    // EXTRACT UNIQUE VALUES FOR DROPDOWNS
    // ==========================================
    const uniqueVehicles = [...new Set(history.map(record => record.license_plate || record.vehicle).filter(Boolean))];
    const uniqueServices = [...new Set(history.map(record => record.service_type || record.serviceType || record.service).filter(Boolean))];

    // ==========================================
    // FILTER LOGIC
    // ==========================================
    const filteredHistory = history.filter((record) => {
        const recordDate = new Date(record.appointment_date || record.bookingDate || record.date);
        const vehicle = record.license_plate || record.vehicle || "";
        const service = record.service_type || record.serviceType || record.service || "";

        // 1. Date Range Filter
        let dateMatch = true;
        if (startDate) {
            dateMatch = dateMatch && recordDate >= new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include the whole end day
            dateMatch = dateMatch && recordDate <= end;
        }

        // 2. Vehicle Filter
        const vehicleMatch = selectedVehicle ? vehicle === selectedVehicle : true;

        // 3. Service Filter
        const serviceMatch = selectedService ? service === selectedService : true;

        return dateMatch && vehicleMatch && serviceMatch;
    });

    // ==========================================
    // PDF REPORT GENERATOR (For Filtered Data)
    // ==========================================

    const addFooter = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        const pageHeight = doc.internal.pageSize.getHeight();

        doc.setDrawColor(220, 220, 220);
        doc.line(15, pageHeight - 20, 195, pageHeight - 20);

        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);

        doc.text(
            "AutoCare Pro • Automotive Service Management System",
            15,
            pageHeight - 12
        );

        doc.text(
            `Page ${i} of ${pageCount}`,
            170,
            pageHeight - 12
        );
    }
};
  const generateReportPDF = () => {
    try {
        if (!filteredHistory || filteredHistory.length === 0) {
            toast.error("No data to generate report.");
            return;
        }

        const doc = new jsPDF();

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        let y = 20;
        let totalAmount = 0;

        // ================= HEADER =================
        doc.setFillColor(204, 0, 0);
        doc.rect(0, 0, pageWidth, 30, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("AUTOCARE PRO", 15, 20);

        doc.setFontSize(10);
        doc.text("SERVICE REPORT", 15, 26);

        doc.setTextColor(0, 0, 0);

        // ================= META =================
        y = 40;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        doc.text(`Customer: ${customerName || "N/A"}`, 15, y);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 120, y);

        y += 10;

        // Safe filter text
        const filterText =
            `Filters: ` +
            [
                startDate ? `Date (${startDate})` : null,
                endDate ? `to (${endDate})` : null,
                selectedVehicle ? `Vehicle (${selectedVehicle})` : null,
                selectedService ? `Service (${selectedService})` : null,
            ]
                .filter(Boolean)
                .join(" | ") || "Filters: None";

        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(filterText, 15, y);

        y += 12;

        // ================= TABLE HEADER =================
        doc.setFillColor(240, 240, 240);
        doc.rect(15, y - 6, pageWidth - 30, 8, "F");

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");

        doc.text("Date", 17, y);
        doc.text("Ref", 45, y);
        doc.text("Vehicle", 75, y);
        doc.text("Service", 110, y);
        doc.text("Amount", 170, y);

        y += 10;

        doc.setFont("helvetica", "normal");

        // ================= TABLE ROWS =================
        filteredHistory.forEach((record) => {
            const amount = Number(record?.amount || 0);

            const date = record?.appointment_date || record?.bookingDate || record?.date || "N/A";
            const refID = String(record?.id || record?.bookingID || "N/A");
            const vehicle = record?.license_plate || record?.vehicle || "N/A";
            const service = record?.service_type || record?.serviceType || record?.service || "General";

            totalAmount += amount;

            // PAGE BREAK SAFE CHECK
            if (y > 260) {
                addFooter(doc);
                doc.addPage();
                y = 20;
            }

            doc.text(String(date).substring(0, 10), 17, y);
            doc.text(refID.substring(0, 10), 45, y);
            doc.text(vehicle.substring(0, 12), 75, y);
            doc.text(service.substring(0, 20), 110, y);
            doc.text(amount.toLocaleString(), 170, y);

            y += 8;
        });

        // ================= TOTAL =================
        y += 5;

        doc.setDrawColor(200, 200, 200);
        doc.line(15, y, pageWidth - 15, y);

        y += 10;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);

        doc.text("TOTAL:", 110, y);
        doc.setTextColor(204, 0, 0);
        doc.text(`KES ${totalAmount.toLocaleString()}`, 170, y);

        doc.setTextColor(0, 0, 0);

        // ================= FOOTER =================
        addFooter(doc);

        // ================= DOWNLOAD =================
        doc.save(`AutoCare_Report_${Date.now()}.pdf`);
        toast.success("Report downloaded successfully!");

    } catch (error) {
        console.error("PDF ERROR:", error);
        toast.error("Failed to generate PDF. Check console.");
    }
};

    // ==========================================
    // PDF RECEIPT GENERATOR (Individual)
    // ==========================================
    const generateReceiptPDF = (record) => {
        const doc = new jsPDF();
        
        const refID = record.id || record.bookingID || "N/A";
        const date = record.appointment_date || record.bookingDate || record.date || new Date().toLocaleDateString();
        const vehicle = record.license_plate || record.vehicle || "N/A";
        const service = record.service_type || record.serviceType || record.service || "General Service";
        const amount = record.amount || 0;

        // Header Background
        doc.setFillColor(204, 0, 0); 
        doc.rect(0, 0, 210, 40, "F");

     // Header Logo
        doc.setFillColor(204, 0, 0); 
        doc.roundedRect(20, 20, 16, 16, 2, 2, 'F');
        doc.setTextColor(255, 255, 255); 
        doc.setFontSize(14); 
        doc.setFont("helvetica", "bold"); 
        doc.text("AC", 28, 31, null, null, "center");

        // Company Name
        doc.setTextColor(17, 24, 39); 
        doc.setFontSize(22); 
        doc.text("AUTOCARE PRO", 42, 28);
        doc.setTextColor(107, 114, 128); 
        doc.setFontSize(8); 
        doc.text("AUTOMOTIVE SERVICE MANAGEMENT", 42, 34);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("OFFICIAL SERVICE RECEIPT", 120, 25);

        // Customer Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Billed To:", 20, 60);
        doc.setFont("helvetica", "normal");
        doc.text(customerName, 20, 68);
        doc.text("Nairobi, Kenya", 20, 76);

        // Receipt Meta
        doc.setFont("helvetica", "bold");
        doc.text(`Receipt No:`, 130, 60);
        doc.text(`Date Paid:`, 130, 68);
        doc.setFont("helvetica", "normal");
        doc.text(`#REC-${refID}-${new Date().getFullYear()}`, 160, 60);
        doc.text(date, 160, 68);

        // Table Header
        doc.setFillColor(245, 245, 245);
        doc.rect(20, 90, 170, 10, "F");
        doc.setFont("helvetica", "bold");
        doc.text("Description", 25, 97);
        doc.text("Vehicle", 100, 97);
        doc.text("Amount (KES)", 150, 97);

        // Table Content
        doc.setFont("helvetica", "normal");
        doc.text(service, 25, 115);
        doc.text(vehicle, 100, 115);
        doc.text(`${amount.toLocaleString()}`, 150, 115);

        // Line
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 125, 190, 125);

        // Totals
        doc.setFont("helvetica", "bold");
        doc.text("Subtotal:", 120, 140);
        doc.text("Tax (16% VAT):", 120, 150);
        doc.setFontSize(14);
        doc.setTextColor(204, 0, 0);
        doc.text("TOTAL PAID:", 120, 165);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(`KES ${(amount * 0.84).toFixed(0).toLocaleString()}`, 160, 140);
        doc.text(`KES ${(amount * 0.16).toFixed(0).toLocaleString()}`, 160, 150);
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`KES ${amount.toLocaleString()}`, 160, 165);

        // Paid Stamp
        doc.setTextColor(34, 197, 94); 
        doc.setFontSize(20);
        // doc.text("✔ PAID IN FULL", 20, 165);

        // Footer
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("Thank you for trusting AutoCare Pro with your vehicle.", 105, 270, null, null, "center");
        doc.text("If you have any questions about this receipt, please contact support@autocarepro.com", 105, 276, null, null, "center");

        // Trigger Download
        doc.save(`AutoCare_Receipt_${refID}.pdf`);
        toast.success("Receipt downloaded successfully!");
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 my-8 px-4 font-sans">
            
            <div className="border-b border-gray-200 pb-5 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Archive className="text-[#CC0000] w-8 h-8" /> Service History
                    </h2>
                    <p className="text-gray-500 mt-1 text-sm">
                        Review your completed services and download official reports and receipts.
                    </p>
                </div>
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm">
                    <CheckCircle size={16} /> All Records Verified
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-[#CC0000]" />
                </div>
            ) : (
                <>
                    {/* ADVANCED FILTER BAR */}
                    {history.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                            
                            <div className="flex flex-wrap items-end gap-4 flex-1">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">From Date</label>
                                    <input 
                                        type="date" 
                                        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-[#CC0000] focus:border-[#CC0000] block p-2 outline-none"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">To Date</label>
                                    <input 
                                        type="date" 
                                        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-[#CC0000] focus:border-[#CC0000] block p-2 outline-none"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Vehicle</label>
                                    <select 
                                        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-[#CC0000] focus:border-[#CC0000] block p-2 outline-none min-w-[150px]"
                                        value={selectedVehicle}
                                        onChange={(e) => setSelectedVehicle(e.target.value)}
                                    >
                                        <option value="">All Vehicles</option>
                                        {uniqueVehicles.map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Service</label>
                                    <select 
                                        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-[#CC0000] focus:border-[#CC0000] block p-2 outline-none min-w-[150px]"
                                        value={selectedService}
                                        onChange={(e) => setSelectedService(e.target.value)}
                                    >
                                        <option value="">All Services</option>
                                        {uniqueServices.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                
                                {(startDate || endDate || selectedVehicle || selectedService) && (
                                    <button 
                                        onClick={() => {
                                            setStartDate(""); setEndDate(""); setSelectedVehicle(""); setSelectedService("");
                                        }}
                                        className="text-sm text-gray-500 hover:text-[#CC0000] font-medium p-2 underline"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>

                            <button 
                                onClick={generateReportPDF}
                                className="inline-flex items-center justify-center gap-2 bg-[#CC0000] hover:bg-red-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wide shadow-sm transition-all active:scale-95 whitespace-nowrap"
                            >
                                <Download size={16} /> Download Report
                            </button>
                        </div>
                    )}

                    <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px] font-black tracking-widest">
                                    <tr>
                                        <th className="px-6 py-5">Date / Ref</th>
                                        <th className="px-6 py-5">Vehicle</th>
                                        <th className="px-6 py-5">Service Performed</th>
                                        <th className="px-6 py-5 text-right">Amount Paid</th>
                                        <th className="px-6 py-5 text-center">Receipt</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {history.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-24 text-center">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                                    <FileText className="text-gray-300 w-8 h-8" />
                                                </div>
                                                <h3 className="text-gray-900 font-bold text-lg mb-1">No Service History</h3>
                                                <p className="text-gray-500 text-sm">
                                                    Once a vehicle service is completed and paid, your records will appear here.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : filteredHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-16 text-center">
                                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-100">
                                                    <Filter className="text-gray-300 w-5 h-5" />
                                                </div>
                                                <span className="text-gray-500 font-medium block">
                                                    No records match your current filters.
                                                </span>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredHistory.map((record, index) => (
                                            <tr key={record.id || record.bookingID || index} className="hover:bg-gray-50 transition-colors">
                                                
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 font-bold text-gray-900 mb-1">
                                                        <Calendar size={14} className="text-gray-400" />
                                                        {record.appointment_date || record.bookingDate || record.date}
                                                    </div>
                                                    <div className="text-xs text-gray-400 font-mono">
                                                        REF #{record.id || record.bookingID}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <span className="bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm">
                                                        {record.license_plate || record.vehicle}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="font-bold text-gray-900 text-base">
                                                        {record.service_type || record.serviceType || record.service}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5 text-right whitespace-nowrap">
                                                    <div className="font-black text-gray-900 text-lg">
                                                        KES {record.amount?.toLocaleString() || 0}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5 text-center">
                                                    <button 
                                                        onClick={() => generateReceiptPDF(record)}
                                                        className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:border-[#CC0000] text-gray-700 hover:text-[#CC0000] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm transition-all active:scale-95"
                                                        title="Download Receipt PDF"
                                                    >
                                                        <Download size={14} /> Receipt
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default History;