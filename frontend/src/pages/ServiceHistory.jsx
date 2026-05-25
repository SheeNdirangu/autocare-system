import React, { useEffect, useState } from 'react';
import { Download, FileText, CheckCircle, Loader2, Archive } from 'lucide-react';
import jsPDF from 'jspdf';

const ServiceHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Defensive check covers both camelCase and snake_case stored session variables safely
    const customerId = localStorage.getItem('customer_id') || localStorage.getItem('customerID');

    const fetchHistory = async () => {
        if (!customerId || customerId === 'null') {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            
            // Replaced old route with the active universal data stream endpoint
            const res = await fetch(`http://127.0.0.1:5000/api/my-bookings/${customerId}`, {
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            const data = await res.json();
            
            if (Array.isArray(data)) {
                // Filter logs cleanly for vehicles that are fully Completed & Paid (Status 4) or marked Paid
                const completedRecords = data.filter(b => 
                    b.statusID === 4 || 
                    b.paymentStatus?.toLowerCase() === "paid" ||
                    b.status === 4
                );
                setHistory(completedRecords);
            } else {
                setHistory([]);
            }
        } catch (err) {
            console.error("Error fetching history:", err);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [customerId]);

    // ==========================================
    // FRONTEND PDF GENERATOR (Invoice & Receipt)
    // ==========================================
    const downloadDocument = (item, docType) => {
        const doc = new jsPDF();

        // 1. HEADER (AUTOCARE PRO Red Brand Background)
        doc.setFillColor(204, 0, 0); // #CC0000
        doc.rect(0, 0, 210, 45, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont("helvetica", "bold");
        doc.text("AUTOCARE PRO", 20, 25);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Professional Vehicle Service System", 20, 33);

        // Document Type Header Switch (TAX INVOICE or PAYMENT RECEIPT)
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        const headerTitle = docType === "Receipt" ? "PAYMENT RECEIPT" : "TAX INVOICE";
        doc.text(headerTitle, 190, 25, null, null, "right");

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const docId = item.bookingID || item.id || "0000";
        doc.text(`Ref No: #BK-${docId}`, 190, 33, null, null, "right");

        // 2. BODY / CONTENT
        doc.setTextColor(39, 39, 42); 
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(docType === "Receipt" ? "Transaction Details" : "Billing Details", 20, 65);

        doc.setDrawColor(228, 228, 231);
        doc.setLineWidth(0.5);
        doc.line(20, 70, 190, 70);

        let yPos = 85;
        
        // Dynamically parsed properties protect rendering against both camelCase or snake_case payloads
        const vehiclePlate = item.license_plate || item.licensePlate || item.vehicle || "N/A";
        const servicePackage = item.service_type || item.serviceType || item.service || "General Maintenance";
        const appointmentDate = item.bookingDate || item.appointment_date || item.date || "N/A";
        const transactionRef = item.mpesaReceiptNumber || item.receiptNumber || `CASH-TXN-${docId}`;

        const details = docType === "Receipt" ? [
            { label: "Date Paid:", value: appointmentDate },
            { label: "Vehicle Plate:", value: vehiclePlate },
            { label: "Service Package:", value: servicePackage },
            { label: "Payment Method:", value: item.paymentMethod || "M-Pesa" },
            { label: "Transaction ID:", value: transactionRef }
        ] : [
            { label: "Date of Service:", value: appointmentDate },
            { label: "Vehicle Plate:", value: vehiclePlate },
            { label: "Service Package:", value: servicePackage },
            // { label: "Billing Status:", value: "Paid in Full" } 
        ];

        details.forEach(detail => {
            doc.setTextColor(113, 113, 122); 
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            doc.text(detail.label, 20, yPos);

            doc.setTextColor(24, 24, 27); 
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(String(detail.value), 190, yPos, null, null, "right");
            yPos += 14;
        });

        // 3. TOTAL BOX
        yPos += 10;
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(228, 228, 231);
        doc.roundedRect(20, yPos, 170, 25, 3, 3, 'FD');

        doc.setTextColor(39, 39, 42);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(docType === "Receipt" ? "Total Amount Paid:" : "Total Amount Paid:", 25, yPos + 16);

        doc.setTextColor(204, 0, 0); 
        doc.setFontSize(16);
        doc.text(`KES ${Number(item.amount || 0).toLocaleString()}`, 185, yPos + 16, null, null, "right");

        // 4. FOOTER
        doc.setTextColor(161, 161, 170);
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("Thank you for choosing AUTOCARE PRO.", 105, 270, null, null, "center");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("This is a system-generated document and does not require a physical signature.", 105, 275, null, null, "center");
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 280, null, null, "center");

        doc.save(`AutoCare_${docType}_${docId}.pdf`);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 my-8 px-4">
            {/* HEADER */}
            <div className="border-b border-gray-200 pb-5">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <Archive className="text-[#CC0000] w-8 h-8" /> Service History
                </h2>
                <p className="text-gray-500 mt-1 text-sm">
                    Review your past services and receipts.
                </p>
            </div>

            {/* LOADING STATE UI */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-[#CC0000]" />
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto p-2">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="p-5 text-gray-400 text-[10px] uppercase font-bold tracking-widest whitespace-nowrap">Date</th>
                                    <th className="p-5 text-gray-400 text-[10px] uppercase font-bold tracking-widest">Vehicle</th>
                                    <th className="p-5 text-gray-400 text-[10px] uppercase font-bold tracking-widest">Service</th>
                                    <th className="p-5 text-gray-400 text-[10px] uppercase font-bold tracking-widest">Status</th>
                                    <th className="p-5 text-gray-400 text-[10px] uppercase font-bold tracking-widest text-center">Receipt</th>
                                    <th className="p-5 text-gray-400 text-[10px] uppercase font-bold tracking-widest text-right">Invoice</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-50">
                                {history.length > 0 ? (
                                    history.map((item, index) => (
                                        <tr key={item.bookingID || index} className="hover:bg-gray-50/50 transition-colors">
                                            {/* DATE */}
                                            <td className="p-5 text-gray-600 text-sm whitespace-nowrap font-medium">
                                                {item.bookingDate || item.appointment_date || item.date}
                                            </td>

                                            {/* VEHICLE */}
                                            <td className="p-5 text-gray-900 font-bold whitespace-nowrap">
                                                {item.license_plate || item.licensePlate || item.vehicle}
                                            </td>

                                            {/* SERVICE */}
                                            <td className="p-5 text-gray-600 text-sm font-medium">
                                                {item.service_type || item.serviceType || item.service}
                                            </td>

                                            {/* STATUS BADGE */}
                                            <td className="p-5">
                                                <span className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-green-200 flex w-fit items-center gap-1">
                                                    <CheckCircle size={12} /> Paid
                                                </span>
                                            </td>

                                            {/* RECEIPT BUTTON */}
                                            <td className="p-5 text-center">
                                                <button
                                                    onClick={() => downloadDocument(item, 'Receipt')}
                                                    className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-gray-50 transition-all hover:-translate-y-0.5"
                                                >
                                                    <FileText size={14} /> Receipt
                                                </button>
                                            </td>

                                            {/* INVOICE BUTTON */}
                                            <td className="p-5 text-right">
                                                <button
                                                    onClick={() => downloadDocument(item, 'Invoice')}
                                                    className="inline-flex items-center gap-1.5 text-white bg-[#CC0000] shadow-md shadow-red-500/20 hover:bg-red-700 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
                                                >
                                                    <Download size={14} /> Invoice
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="p-24 text-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                                <FileText className="text-gray-300 w-8 h-8" />
                                            </div>
                                            <h3 className="text-gray-900 font-bold text-lg mb-1">No Service History</h3>
                                            <p className="text-gray-500 text-sm">
                                                You have no booking history with us.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceHistory;