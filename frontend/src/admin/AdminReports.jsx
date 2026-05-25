import React, { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Printer, Download } from 'lucide-react';

const AdminReports = () => {
    const [reportData, setReportData] = useState({ header: null, data: [], footer: null });
    const [activeTab, setActiveTab] = useState("financial");
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [serviceFilter, setServiceFilter] = useState("");
    
    // EXPORT STATES
    const [isExporting, setIsExporting] = useState(false);
    const reportRef = useRef();
    const exportRef = useRef(); 

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem("authToken") || localStorage.getItem("token");
            const res = await fetch(`http://127.0.0.1:5000/api/admin/reports?type=${activeTab}`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
            const raw = await res.json();
            setReportData({ header: raw?.header || null, data: Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [], footer: raw?.footer || null });
        } catch (err) { 
            console.error("Error fetching reports:", err);
            setReportData({ header: null, data: [], footer: null }); 
        }
    };

    useEffect(() => { fetchReports(); }, [activeTab]);

    const filteredData = (reportData.data || []).filter((item) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch = activeTab === "financial" ? (item.customer?.toLowerCase().includes(search) || item.service?.toLowerCase().includes(search) || String(item.bookingID).includes(search)) : (item.fullName?.toLowerCase().includes(search) || item.specialization?.toLowerCase().includes(search));
        const matchesDate = (!startDate || new Date(item.date) >= startDate) && (!endDate || new Date(item.date) <= endDate);
        const matchesService = !serviceFilter || item.service === serviceFilter;
        return matchesSearch && matchesDate && matchesService;
    });

    const totalRevenue = filteredData.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    // ==========================================
    // EXPORT & PRINT LOGIC
    // ==========================================
    const handlePrint = () => {
        setIsExporting(true);
        setTimeout(() => {
            const printContents = exportRef.current.innerHTML; 
            const win = window.open("", "", "width=1200,height=900");
            win.document.write(`
                <html>
                    <head>
                        <title>AUTOCARE PRO - ${activeTab} Report</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
                            body { font-family: 'Inter', sans-serif; padding: 0; margin: 0; background: white; color: #111827; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border-bottom: 1px solid #e5e7eb; padding: 12px; text-align: left; }
                            th { background-color: #f9fafb; color: #6b7280; text-transform: uppercase; font-size: 12px; font-weight: bold; }
                            tfoot td { font-weight: 900; border-top: 2px solid #111827; }
                        </style>
                    </head>
                    <body>
                        <div class="flex flex-col min-h-screen p-12">
                            ${printContents}
                        </div>
                    </body>
                </html>
            `);
            win.document.close();
            win.focus();
            setTimeout(() => { win.print(); win.close(); setIsExporting(false); }, 1000);
        }, 500);
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        
        const exportElement = exportRef.current;
        exportElement.style.display = 'flex'; // MUST be flex so mt-auto pushes footer to bottom

        setTimeout(async () => {
            const canvas = await html2canvas(exportElement, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
            const pdf = new jsPDF("p", "mm", "a4");
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight);
            pdf.save(`AUTOCARE_PRO_${activeTab}_Report_${new Date().getTime()}.pdf`);
            
            exportElement.style.display = 'none'; 
            setIsExporting(false);
        }, 500);
    };

    const downloadSingleResult = async (item) => {
        const doc = new jsPDF();
        
        // --- NEW LETTERHEAD ---
        // Red Logo Box
        doc.setFillColor(204, 0, 0); // #CC0000
        doc.roundedRect(20, 20, 16, 16, 2, 2, 'F');
        
        // AC Text inside logo
        doc.setTextColor(255, 255, 255); 
        doc.setFontSize(14); 
        doc.setFont("helvetica", "bold"); 
        doc.text("AC", 28, 31, null, null, "center");

        // Company Name & Subtitle
        doc.setTextColor(17, 24, 39); 
        doc.setFontSize(22); 
        doc.setFont("helvetica", "bold"); 
        doc.text("AUTOCARE PRO", 42, 28);
        
        doc.setTextColor(107, 114, 128); 
        doc.setFontSize(8); 
        doc.setFont("helvetica", "bold"); 
        doc.text("AUTOMOTIVE SERVICE MANAGEMENT", 42, 34);

        // Right side info (Ref ID & Date)
        doc.setTextColor(17, 24, 39); 
        doc.setFontSize(12); 
        doc.text(item.bookingID ? `Ref ID: #${item.bookingID}` : "Mechanic Record", 190, 28, null, null, "right");
        
        doc.setTextColor(107, 114, 128); 
        doc.setFontSize(10); 
        doc.setFont("helvetica", "normal");
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 190, 34, null, null, "right");

        // Letterhead Bottom Divider
        doc.setDrawColor(17, 24, 39); 
        doc.setLineWidth(0.5); 
        doc.line(20, 42, 190, 42);

        // --- RECORD DETAILS SECTION ---
        doc.setTextColor(39, 39, 42); 
        doc.setFontSize(16); 
        doc.setFont("helvetica", "bold"); 
        doc.text("Record Details", 20, 58);
        
        doc.setDrawColor(228, 228, 231); 
        doc.setLineWidth(0.5); 
        doc.line(20, 63, 190, 63);
        
        let yPos = 78;
        Object.entries(item).forEach(([key, value]) => {
            if (key === 'amount') return; 
            doc.setTextColor(113, 113, 122); 
            doc.setFontSize(11); 
            doc.setFont("helvetica", "normal"); 
            doc.text(`${key.charAt(0).toUpperCase() + key.slice(1)}`, 20, yPos);
            
            doc.setTextColor(24, 24, 27); 
            doc.setFontSize(12); 
            doc.setFont("helvetica", "bold"); 
            doc.text(String(value), 190, yPos, null, null, "right");
            
            yPos += 14; 
        });

        if (item.amount !== undefined) {
            yPos += 5;
            doc.setFillColor(244, 244, 245); 
            doc.setDrawColor(228, 228, 231); 
            doc.roundedRect(20, yPos, 170, 20, 3, 3, 'FD'); 
            
            doc.setTextColor(39, 39, 42); 
            doc.setFontSize(12); 
            doc.setFont("helvetica", "bold"); 
            doc.text("Total Paid:", 25, yPos + 13);
            
            doc.setTextColor(22, 163, 74); 
            doc.setFontSize(14); 
            doc.text(`KES ${item.amount}`, 185, yPos + 13, null, null, "right");
        }
        
        // Footer
        doc.setTextColor(161, 161, 170); 
        doc.setFontSize(10); 
        doc.setFont("helvetica", "italic"); 
        doc.text("Thank you for choosing AUTOCARE PRO.", 105, 275, null, null, "center");
        
        doc.save(`Record-${item.bookingID || Date.now()}.pdf`);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            
            {/* ========================================== */}
            {/* HIDDEN EXPORT TEMPLATE - A4 Proportions */}
            {/* ========================================== */}
            <div ref={exportRef} style={{ display: 'none' }} className="bg-white p-12 text-black w-[800px] min-h-[1131px] flex-col">
                
                {/* LETTERHEAD */}
                <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#CC0000] w-14 h-14 flex items-center justify-center font-black text-white text-2xl">AC</div>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter">AutoCare Pro</h1>
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Automotive Service Management</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-lg font-bold uppercase">{activeTab} Report</h2>
                        <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                {/* TABLE STRUCTURE - flex-grow ensures it takes up available space */}
                <div className="flex-grow">
                    <table className="w-full text-left text-sm mb-12">
                        <thead className="bg-gray-100 uppercase text-xs font-bold border-b-2 border-black">
                            <tr>
                                {activeTab === "financial" && (<><th className="p-3">Booking ID</th><th className="p-3">Customer</th><th className="p-3">Service</th><th className="p-3">Date</th><th className="p-3 text-right">Amount</th></>)}
                                {activeTab === "mechanics" && (<><th className="p-3">Mechanic</th><th className="p-3">Specialization</th><th className="p-3 text-center">Jobs</th><th className="p-3 text-center">Rating</th></>)}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item, index) => (
                                <tr key={index} className="border-b border-gray-200">
                                    {activeTab === "financial" && (<><td className="p-3">#{item.bookingID}</td><td className="p-3 font-bold">{item.customer}</td><td className="p-3">{item.service}</td><td className="p-3">{item.date}</td><td className="p-3 font-bold text-right">KES {item.amount}</td></>)}
                                    {activeTab === "mechanics" && (<><td className="p-3 font-bold">{item.fullName}</td><td className="p-3">{item.specialization}</td><td className="p-3 text-center">{item.jobsDone}</td><td className="p-3 text-center">{item.rating}%</td></>)}
                                </tr>
                            ))}
                        </tbody>
                        {activeTab === "financial" && (
                            <tfoot className="border-t-2 border-black">
                                <tr>
                                    <td colSpan={4} className="p-3 font-bold uppercase text-right">TOTAL REVENUE:</td>
                                    <td className="p-3 font-black text-lg text-right">KES {totalRevenue}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                {/* FOOTER - mt-auto pushes it to the bottom of the min-h-[1131px] page container */}
                <div className="mt-auto pt-6 border-t-2 border-black text-center shrink-0 w-full">
                    <p className="font-bold uppercase text-xs">AutoCare Pro Systems</p>
                    <p className="text-gray-500 text-[10px] mt-1">This is a system-generated report. © {new Date().getFullYear()} AutoCare.</p>
                </div>
            </div>


            {/* TOP ACTIONS */}
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-100 bg-gray-50/50 p-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Reports</h1>
                        <p className="text-gray-500 mt-1 text-sm mb-4"> Review garage operational data</p>

                        <div className="flex space-x-2 bg-gray-200/50 p-1 rounded-xl w-fit">
                            {["financial", "mechanics"].map((tab) => (
                                <button 
                                    key={tab} 
                                    onClick={() => setActiveTab(tab)} 
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize ${activeTab === tab ? "bg-white text-[#CC0000] shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                                >
                                    {tab} Reports
                                </button>
                            ))}
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

                {/* FILTERS */}
                <div className="p-6 border-b border-gray-100 bg-white flex flex-col md:flex-row gap-4">
                    <input type="text" placeholder="Search reports..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#CC0000] w-full md:w-64" />
                    <DatePicker selectsRange startDate={startDate} endDate={endDate} onChange={(update) => { setStartDate(update[0]); setEndDate(update[1]); }} isClearable placeholderText="Select date range" className="bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#CC0000] text-gray-900 w-full md:w-64 cursor-pointer" />
                    {activeTab === "financial" && (
                        <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#CC0000] w-full md:w-48 cursor-pointer font-medium text-gray-700">
                            <option value="">All Services</option>
                            {[...new Set((reportData.data || []).map(item => item.service))].map((service, index) => <option key={index} value={service}>{service}</option>)}
                        </select>
                    )}
                </div>

                {/* THE ACTUAL REPORT WRAPPER */}
                <div ref={reportRef} className="bg-white overflow-x-auto p-8">
                    
                    {/* ON-SCREEN HEADER */}
                    <div className="mb-8 flex justify-between items-center border-b border-gray-100 pb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 capitalize">{activeTab} Summary</h2>
                            <p className="text-gray-500 text-sm mt-1">Generated on: {new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="bg-gray-50 px-5 py-3 rounded-xl border border-gray-100 text-center">
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Results</p>
                            <h3 className="text-xl font-black text-gray-900 leading-none mt-1">{filteredData.length}</h3>
                        </div>
                    </div>

                    {/* TABLE DATA */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider border-b border-gray-200">
                                <tr>
                                    {activeTab === "financial" && (<><th className="p-4">Booking ID</th><th className="p-4">Customer</th><th className="p-4">Service</th><th className="p-4">Date</th><th className="p-4 text-right">Amount</th><th className="p-4 text-center">Action</th></>)}
                                    {activeTab === "mechanics" && (<><th className="p-4">Mechanic</th><th className="p-4">Specialization</th><th className="p-4 text-center">Jobs</th><th className="p-4 text-center">Rating</th><th className="p-4 text-center">Action</th></>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredData.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        {activeTab === "financial" && (<><td className="p-4 font-mono text-gray-500 text-xs">#{item.bookingID}</td><td className="p-4 font-bold text-gray-900">{item.customer}</td><td className="p-4 text-gray-600">{item.service}</td><td className="p-4 text-gray-600">{item.date}</td><td className="p-4 text-green-600 font-bold text-right">KES {item.amount}</td><td className="p-4 text-center"><button onClick={() => downloadSingleResult(item)} className="bg-white border border-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 shadow-sm transition">Download</button></td></>)}
                                        {activeTab === "mechanics" && (<><td className="p-4 font-bold text-gray-900">{item.fullName}</td><td className="p-4 text-gray-600">{item.specialization}</td><td className="p-4 font-bold text-gray-900 text-center">{item.jobsDone}</td><td className="p-4 text-green-600 font-bold text-center">{item.rating}%</td><td className="p-4 text-center"><button onClick={() => downloadSingleResult(item)} className="bg-white border border-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 shadow-sm transition">Download</button></td></>)}
                                    </tr>
                                ))}
                            </tbody>
                            
                            {activeTab === "financial" && (
                                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                    <tr>
                                        <td colSpan={4} className="p-5 font-bold text-gray-900 uppercase text-xs tracking-wider">TOTAL REVENUE</td>
                                        <td className="p-5 text-[#CC0000] font-black text-lg text-right">KES {totalRevenue}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReports;