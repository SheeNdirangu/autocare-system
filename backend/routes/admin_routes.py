from datetime import datetime
import requests
from requests.auth import HTTPBasicAuth
from pathlib import Path
import base64
import os
from dotenv import load_dotenv
from sqlalchemy import func, extract
from utils.validators import validate_phone
from flask import jsonify, request, Blueprint, current_app
from models import db, Customer, Vehicle, ServiceBooking, Mechanic, Invoice
import jwt

# Add this line right here!
from werkzeug.security import generate_password_hash

import os
import io
import jwt
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash
from models import db, Customer, Vehicle, ServiceBooking, Mechanic, Invoice, Admin
from flask_mail import Message

admin_bp = Blueprint('admin', __name__)

# --- ADMIN BOUNCER ---
@admin_bp.before_request
def require_admin_token():
    if request.method == 'OPTIONS':
        return
        
    token = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(" ")[1]

    if not token:
        return jsonify({"error": "Access Denied. Token missing."}), 401

    try:
        decoded = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
        if decoded.get('role') != 'admin':
            return jsonify({"error": "Access Denied. Admins only."}), 403
    except Exception:
        return jsonify({"error": "Invalid or expired token."}), 401

# --- DASHBOARD & ANALYTICS ---
@admin_bp.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    try:
        return jsonify({
            "customers": Customer.query.count(),
            "vehicles": Vehicle.query.filter_by(is_active=True).count(),
            "activeBookings": ServiceBooking.query.filter(ServiceBooking.statusID < 4).count(),
            "mechanics": Mechanic.query.filter_by(is_active=True).count()
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/api/admin/bookings', methods=['GET'])
def get_all_bookings():
    bookings = ServiceBooking.query.order_by(ServiceBooking.bookingDate.desc()).all()
    result = []
    for b in bookings:
        vehicle = Vehicle.query.filter_by(license_plate=b.license_plate).first()
        customer = Customer.query.filter_by(customerID=vehicle.customerID).first() if vehicle else None
        mechanic = Mechanic.query.filter_by(MechanicID=b.mechanicID).first() if b.mechanicID else None

        result.append({
            "bookingID": b.bookingID,
            "customer": customer.FullName if customer else "Guest",
            "license_plate": b.license_plate,
            "serviceType": b.serviceType,
            "bookingDate": b.bookingDate.strftime('%d %b %Y') if b.bookingDate else "N/A",
            "statusID": b.statusID,
            "mechanicID": b.mechanicID,
            "mechanicName": mechanic.FullName if mechanic else "Unassigned",
            "paymentStatus": b.paymentStatus,
            "paymentMethod": b.paymentMethod,
            "cancellation_reason": getattr(b, 'cancellation_reason', "No reason provided")
        })
    return jsonify(result), 200






@admin_bp.route('/api/admin/analytics', methods=['GET'])
def get_analytics():
    try:
        from sqlalchemy import extract, func
        from datetime import datetime

        time_filter = request.args.get('filter', 'all')
        now = datetime.now()

        # BASE QUERY
        query = ServiceBooking.query

        # FILTERS
        if time_filter == 'today':
            query = query.filter(
                func.date(ServiceBooking.bookingDate) == now.date()
            )

        elif time_filter == 'week':
            query = query.filter(
                extract('week', ServiceBooking.bookingDate) == now.isocalendar()[1],
                extract('year', ServiceBooking.bookingDate) == now.year
            )

        elif time_filter == 'month':
            query = query.filter(
                extract('month', ServiceBooking.bookingDate) == now.month,
                extract('year', ServiceBooking.bookingDate) == now.year
            )

        elif time_filter == 'year':
            query = query.filter(
                extract('year', ServiceBooking.bookingDate) == now.year
            )

        filtered_bookings = query.all()

        # =========================
        # KPI CARDS
        # =========================

        total_revenue = sum(
            float(b.amount or 0)
            for b in filtered_bookings
            if b.paymentStatus == "Paid"
        )

        completed_services = sum(
            1 for b in filtered_bookings
            if b.statusID == 4
        )

        active_mechanics = Mechanic.query.count()

        # =========================
        # PIE CHART DATA
        # =========================

        status_map = {
            1: "Pending",
            2: "In Service",
            3: "Ready / Unpaid",
            4: "Completed",
            5: "Cancelled"
        }

        status_counts = {}

        for booking in filtered_bookings:
            label = status_map.get(
                booking.statusID,
                "Unknown"
            )

            status_counts[label] = (
                status_counts.get(label, 0) + 1
            )

        booking_status_data = [
            {
                "name": status,
                "value": count
            }
            for status, count in status_counts.items()
        ]

        # =========================
        # BAR CHART DATA
        # =========================

        service_counts = {}

        for booking in filtered_bookings:
            service = booking.serviceType or "General Service"

            service_counts[service] = (
                service_counts.get(service, 0) + 1
            )

        sorted_services = sorted(
            service_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]

        services_data = [
            {
                "service": service,
                "count": count
            }
            for service, count in sorted_services
        ]

        # =========================
        # LINE CHART DATA
        # =========================

        months = [
            "Jan", "Feb", "Mar", "Apr",
            "May", "Jun", "Jul", "Aug",
            "Sep", "Oct", "Nov", "Dec"
        ]

        monthly_map = {month: 0 for month in months}

        year_bookings = ServiceBooking.query.filter(
            extract('year', ServiceBooking.bookingDate) == now.year
        ).all()

        for booking in year_bookings:
            if booking.bookingDate:
                month_index = booking.bookingDate.month - 1
                monthly_map[months[month_index]] += 1

        monthly_bookings = [
            {
                "month": month,
                "bookings": monthly_map[month]
            }
            for month in months
        ]

        # =========================
        # FINAL RESPONSE
        # =========================

        return jsonify({
            "totalRevenue": total_revenue,
            "completedServices": completed_services,
            "activeMechanics": active_mechanics,

            "bookingStatusData": booking_status_data,

            "servicesData": services_data,

            "monthlyBookings": monthly_bookings
        }), 200

    except Exception as e:
        print("Analytics Endpoint Error:", str(e))

        return jsonify({
            "error": str(e)
        }), 500


# --- MECHANIC DIRECTORY ---
@admin_bp.route('/api/admin/mechanics', methods=['GET'])
def get_mechanics():
    mechanics = Mechanic.query.filter_by(is_active=True).all()
    return jsonify([{
        "id": m.MechanicID,
        "name": m.FullName,
        "phone": m.PhoneNumber,
        "email": m.Email,
        "specialization": m.Specialization,
        "availability": m.Availability
    } for m in mechanics]), 200

@admin_bp.route('/api/admin/mechanics', methods=['POST'])
def add_mechanic():
    try:
        data = request.get_json()
        raw_password = data.get("Password")
        if not raw_password:
            return jsonify({"error": "Password is required for new mechanics"}), 400

        mechanic = Mechanic(
            FullName=data.get("FullName"),
            PhoneNumber=data.get("PhoneNumber"),
            Specialization=data.get("Specialization"),
            Availability=data.get("Availability", "Available"),
            Email=data.get("Email"),
            PasswordHash=generate_password_hash(raw_password),
            is_active=True
        )
        db.session.add(mechanic)
        db.session.commit()
        return jsonify({"message": "Mechanic added successfully"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/api/admin/mechanics/<int:id>', methods=['PUT'])
def update_mechanic(id):
    mechanic = Mechanic.query.get(id)
    if not mechanic:
        return jsonify({"message": "Mechanic not found"}), 404

    data = request.get_json()
    mechanic.FullName = data.get("FullName", mechanic.FullName)
    mechanic.PhoneNumber = data.get("PhoneNumber", mechanic.PhoneNumber)
    mechanic.Email = data.get("Email", mechanic.Email)
    mechanic.Specialization = data.get("Specialization", mechanic.Specialization)
    mechanic.Availability = data.get("Availability", mechanic.Availability)

    raw_password = data.get("Password")
    if raw_password and str(raw_password).strip() != "":
        mechanic.PasswordHash = generate_password_hash(str(raw_password))

    db.session.commit()
    return jsonify({"message": "Updated successfully"}), 200

@admin_bp.route('/api/admin/mechanics/<int:mechanic_id>', methods=['DELETE'])
def delete_mechanic(mechanic_id):
    try:
        mechanic = Mechanic.query.get(mechanic_id)
        if not mechanic:
            return jsonify({"error": "Mechanic not found"}), 404

        mechanic.is_active = False
        mechanic.Availability = "Archived"
        ServiceBooking.query.filter(ServiceBooking.mechanicID == mechanic_id, ServiceBooking.statusID < 3).update({"mechanicID": None})
        db.session.commit()
        return jsonify({"message": "Mechanic safely archived"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route('/api/admin/recent-bookings', methods=['GET'])
def recent_bookings():
    bookings = ServiceBooking.query.order_by(ServiceBooking.bookingDate.desc()).limit(5).all()
    return jsonify([{
        "id": b.bookingID, "vehicle": b.license_plate, "service": b.serviceType, 
        "status": b.statusID, "date": b.bookingDate.strftime('%Y-%m-%d') if b.bookingDate else "N/A"
    } for b in bookings]), 200

@admin_bp.route('/api/admin/assignments', methods=['GET'])
def get_assignments():
    return get_all_bookings() # Returns the same robust array used above

@admin_bp.route('/api/admin/reassign/<int:booking_id>', methods=['PUT'])
def assign_mechanic(booking_id):
    try:
        data = request.get_json()
        mechanic_id = data.get("mechanicID")
        booking = ServiceBooking.query.get(booking_id)

        if not booking:
            return jsonify({"error": "Booking not found"}), 404

        if mechanic_id is None:
            booking.mechanicID = None
        else:
            mechanic = Mechanic.query.get(int(mechanic_id))
            if not mechanic:
                return jsonify({"error": "Mechanic not found"}), 404
            booking.mechanicID = int(mechanic_id)
            if booking.statusID == 1:
                booking.statusID = 2

        db.session.commit()
        return jsonify({"message": "Assignment updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/api/admin/bookings/<int:booking_id>/status', methods=['PUT'])
def update_booking_status(booking_id):
    try:
        data = request.json
        new_status = data.get('statusID')
        booking = ServiceBooking.query.get(booking_id)

        if not booking:
            return jsonify({"error": "Booking not found"}), 404

        booking.statusID = new_status
        db.session.commit()

        if new_status == 3: 
            vehicle = Vehicle.query.filter_by(license_plate=booking.license_plate).first()
            customer = Customer.query.get(vehicle.customerID) if vehicle else None

            if customer and customer.Email:
                buffer = io.BytesIO()
                pdf = canvas.Canvas(buffer, pagesize=A4)
                pdf.setTitle("Service Invoice")
                pdf.setFillColorRGB(0.8, 0, 0)
                pdf.rect(0, 750, 600, 100, fill=1, stroke=0)
                pdf.setFillColorRGB(1, 1, 1)
                pdf.setFont("Helvetica-Bold", 24)
                pdf.drawString(50, 790, "AUTOCARE PRO")
                pdf.setFont("Helvetica", 12)
                pdf.drawString(50, 770, "Official Service Invoice")
                pdf.setFillColorRGB(0, 0, 0)
                pdf.setFont("Helvetica-Bold", 14)
                pdf.drawString(50, 700, "Invoice Details")
                pdf.line(50, 690, 500, 690)
                pdf.setFont("Helvetica", 12)
                pdf.drawString(50, 660, f"Customer Name: {customer.FullName}")
                pdf.drawString(50, 640, f"Vehicle Plate: {booking.license_plate}")
                pdf.drawString(50, 620, f"Service Package: {booking.serviceType}")
                pdf.drawString(50, 600, f"Date Issued: {datetime.now().strftime('%Y-%m-%d')}")
                pdf.setFont("Helvetica-Bold", 14)
                pdf.drawString(50, 550, f"TOTAL AMOUNT DUE: KES {booking.amount}")
                pdf.setFont("Helvetica-Oblique", 10)
                pdf.setFillColorRGB(0.4, 0.4, 0.4)
                pdf.drawString(50, 100, "Please process payment via M-Pesa or Cash at the garage upon pickup.")
                pdf.showPage()
                pdf.save()
                buffer.seek(0)

                mail = current_app.extensions.get('mail')
                if mail:
                    msg = Message(f"Invoice for Vehicle Service: {booking.license_plate}", recipients=[customer.Email])
                    msg.body = f"Hello {customer.FullName},\n\nYour vehicle ({booking.license_plate}) service is complete and ready for pickup!\n\nPlease find your official invoice attached.\n\nThank you,\nAUTOCARE PRO"
                    msg.attach(f"Invoice_BK{booking.bookingID}.pdf", "application/pdf", buffer.read())
                    mail.send(msg)

        return jsonify({"message": "Status updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/api/admin/confirm-payment/<int:booking_id>', methods=['POST', 'OPTIONS'])
def confirm_payment(booking_id):
    # 1. Handle the browser's CORS preflight check
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS allowed'}), 200

    try:
        data = request.json
        booking = ServiceBooking.query.get(booking_id)
        
        if not booking:
            return jsonify({"error": "Booking not found"}), 404

        # 2. Update the database fields
        booking.paymentStatus = "Paid"
        booking.statusID = 4  # Mark as Completed
        
        # 3. Save the payment method (Cash or M-Pesa)
        if data and data.get("method"):
            booking.paymentMethod = data.get("method")
            
        # Optional: Set the paidAt timestamp if your model has it
        from datetime import datetime
        if hasattr(booking, 'paidAt'):
            booking.paidAt = datetime.now()

        db.session.commit()
        return jsonify({"message": "Payment confirmed and booking archived."}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# --- REPORTS ---
# --- REPORTS ---
@admin_bp.route('/api/admin/reports', methods=['GET'])
def admin_reports():
    db.session.expire_all()
    report_type = request.args.get("type")
    
    if report_type == "financial":
        bookings = db.session.query(ServiceBooking, Vehicle, Customer).join(
            Vehicle, ServiceBooking.license_plate == Vehicle.license_plate
        ).join(
            Customer, Vehicle.customerID == Customer.customerID
        ).filter(ServiceBooking.statusID == 4).all()
        
        return jsonify([{"bookingID": b.bookingID, "customer": c.FullName, "service": b.serviceType, "amount": b.amount, "payment": b.paymentStatus, "date": b.bookingDate.strftime("%Y-%m-%d")} for b, v, c in bookings])
    
    # ADD THIS MISSING BLOCK FOR MECHANICS
    elif report_type == "mechanics":
        mechanics = Mechanic.query.filter_by(is_active=True).all()
        result = []
        for m in mechanics:
            # Count jobs where mechanicID matches
            job_count = ServiceBooking.query.filter_by(mechanicID=m.MechanicID).count()
            result.append({
                "fullName": m.FullName,
                "specialization": m.Specialization,
                "jobsDone": job_count,
                "rating": 95 # Assuming a default or static value for now
            })
        return jsonify(result)
    
    return jsonify({"error": "Invalid report type"}), 400

@admin_bp.route('/api/admin/customers', methods=['GET'])
def get_all_customers():
    try:
        customers = Customer.query.all()
        result = []
        for c in customers:
            # Fetch all vehicles for this customer
           # THE FIX: Only fetch vehicles where is_active is True!
            vehicles = Vehicle.query.filter_by(customerID=c.customerID, is_active=True).all()
            vehicle_list = [{
                "license_plate": v.license_plate,
                "make": v.make,
                "model": v.model,
                "year": v.year,
                "color": v.color
            } for v in vehicles]

            result.append({
                "customerID": c.customerID,
                "FullName": c.FullName,
                "Email": c.Email,
                "PhoneNumber": c.PhoneNumber,
                # Use current date as fallback if your model doesn't have a created_at column yet
                "DateJoined": getattr(c, 'created_at', datetime.now()).isoformat(), 
                "is_verified": getattr(c, 'is_verified', True),
                "vehicles": vehicle_list
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@admin_bp.route('/api/admin/bookings/<int:booking_id>/archive-cancel', methods=['PUT'])
def archive_cancelled_booking(booking_id):
    try:
        booking = ServiceBooking.query.get(booking_id)
        if not booking:
            return jsonify({"error": "Booking not found"}), 404
            
        # Status 6 represents "Acknowledged and Archived Cancelled Booking"
        booking.statusID = 6 
        db.session.commit()
        
        return jsonify({"message": "Cancellation acknowledged and moved to Cancelled tab."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
@admin_bp.route('/api/admin/shift-report', methods=['GET'])
def shift_report():
    try:
        today = datetime.now().date()
        # Fetch all paid bookings
        paid_bookings = ServiceBooking.query.filter_by(paymentStatus="Paid").all()
        
        # In a production app, you would filter by today's date: 
        # filter(func.date(ServiceBooking.paidAt) == today)
        
        cash_total = sum(b.amount for b in paid_bookings if b.paymentMethod == "Cash" and b.amount)
        mpesa_total = sum(b.amount for b in paid_bookings if b.paymentMethod == "M-Pesa" and b.amount)
        
        transactions = [{
            "vehicle": b.license_plate,
            "time": getattr(b, 'paidAt', datetime.now()).strftime('%H:%M'),
            "method": b.paymentMethod,
            "amount": b.amount
        } for b in paid_bookings]

        return jsonify({
            "date": today.strftime('%A, %d %B %Y'),
            "cashTotal": cash_total,
            "mpesaTotal": mpesa_total,
            "grandTotal": cash_total + mpesa_total,
            "transactions": transactions
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500