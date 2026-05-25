import os
import io
import jwt
import base64
import secrets
import requests
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from flask_mail import Mail, Message
from werkzeug.security import check_password_hash, generate_password_hash
from requests.auth import HTTPBasicAuth
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from config import Config
from models import db, Customer, Mechanic, ServiceBooking, Vehicle, Admin, Invoice, Service
from routes.admin_routes import admin_bp
import re



load_dotenv()

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
mail = Mail(app)

CORS(app, supports_credentials=True, origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173"
])

app.secret_key = os.environ.get('SECRET_KEY', 'dev_key_for_autocare')
app.register_blueprint(admin_bp)

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'AutoCare API is running'}), 200

    # ==========================================
# STRICT DATA VALIDATORS
# ==========================================

def is_valid_name(name):
    # Allows only letters, spaces, hyphens, and apostrophes. Rejects numbers.
    if not name: return False
    return bool(re.match(r"^[A-Za-z\s\-']+$", str(name).strip()))

def is_valid_email(email):
    # Enforces standard email structure (e.g., user@domain.com)
    if not email: return False
    return bool(re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", str(email).strip()))

def is_valid_kenyan_phone(phone):
    # Enforces Kenyan formats: 07..., 01..., 2547..., 2541..., +2547..., +2541... (exactly 9 digits after the prefix)
    if not phone: return False
    cleaned_phone = str(phone).replace(" ", "").strip()
    return bool(re.match(r"^(?:(?:\+254)|(?:254)|0)[17]\d{8}$", cleaned_phone))

# ---------------- AUTHENTICATION ----------------
@app.route('/api/login', methods=['POST'])
def unified_login():
    data = request.json
    identifier = data.get('Email') 
    password = data.get('Password')

    if not identifier or not password:
        return jsonify({"message": "Missing credentials"}), 400

    admin = Admin.query.filter((Admin.email == identifier) | (Admin.username == identifier)).first()
    if admin and check_password_hash(admin.password, password):
        token = jwt.encode({'admin_id': admin.admin_id, 'role': 'admin', 'exp': datetime.utcnow() + timedelta(hours=12)}, app.config['SECRET_KEY'], algorithm="HS256")
        return jsonify({"message": "Admin login successful", "token": token, "role": "admin", "name": admin.username}), 200

    customer = Customer.query.filter_by(Email=identifier).first()
    if customer and check_password_hash(customer.PasswordHash, password):
        token = jwt.encode({'customer_id': customer.customerID, 'role': 'customer', 'exp': datetime.utcnow() + timedelta(days=7)}, app.config['SECRET_KEY'], algorithm="HS256")
        return jsonify({"message": "Customer login successful", "token": token, "role": "customer", "customerID": customer.customerID, "name": customer.FullName, "PhoneNumber": customer.PhoneNumber}), 200

    return jsonify({"message": "Invalid credentials. Access Denied."}), 401

@app.route('/api/mechanic/login', methods=['POST'])
def mechanic_login():
    data = request.json
    email = data.get('Email')
    password = data.get('Password')

    # Fixed: Only grabs active mechanics, safely bypassing null constraints
    mechanic = Mechanic.query.filter_by(Email=email).first()

    if mechanic and getattr(mechanic, 'is_active', True) is False:
        return jsonify({"message": "Account archived. Access denied."}), 401

    if mechanic and mechanic.PasswordHash and check_password_hash(mechanic.PasswordHash, password):
        token = jwt.encode({'mechanic_id': mechanic.MechanicID, 'role': 'mechanic', 'exp': datetime.utcnow() + timedelta(days=7)}, app.config['SECRET_KEY'], algorithm="HS256")
        return jsonify({"message": "Mechanic login successful", "token": token, "role": "mechanic", "mechanicID": mechanic.MechanicID, "name": mechanic.FullName}), 200
    
    return jsonify({"message": "Invalid email or password. Access denied."}), 401

@app.route('/api/register-customer', methods=['POST'])
def register():
    data = request.json
    
    # 1. Check for missing fields
    if not all([data.get('FullName'), data.get('PhoneNumber'), data.get('Email'), data.get('Password')]):
        return jsonify({"error": "Missing required fields"}), 400

    # 2. APPLY STRICT VALIDATION RULES
    if not is_valid_name(data.get('FullName')):
        return jsonify({"error": "Invalid name. Names cannot contain numbers or special characters."}), 400
        
    if not is_valid_email(data.get('Email')):
        return jsonify({"error": "Invalid email address format."}), 400
        
    if not is_valid_kenyan_phone(data.get('PhoneNumber')):
        return jsonify({"error": "Invalid phone number. Must be a valid Kenyan number (e.g., 07XX, 01XX, +254XX)."}), 400

    # 3. Check for duplicates in the database
    if Customer.query.filter_by(Email=data.get('Email').strip().lower()).first() or Customer.query.filter_by(PhoneNumber=data.get('PhoneNumber').replace(" ", "").strip()).first():
        return jsonify({"error": "Email or Phone already registered"}), 400

    token = secrets.token_hex(16)
    new_customer = Customer(
        FullName=data.get('FullName').strip(), 
        PhoneNumber=data.get('PhoneNumber').replace(" ", "").strip(), 
        Email=data.get('Email').strip().lower(),
        PasswordHash=generate_password_hash(data.get('Password')), 
        verification_token=token, 
        is_verified=False
    )
    db.session.add(new_customer)
    db.session.commit()
    db.session.refresh(new_customer)

    try:
        msg = Message("Verify your AutoCare Pro Account", recipients=[data.get('Email')])
        msg.body = f"Welcome to AutoCare Pro! Click here to verify: http://localhost:5173/verify?token={token}"
        mail.send(msg)
    except Exception:
        pass

    return jsonify({"message": "Registration successful.", "customerID": new_customer.customerID}), 201

@app.route('/api/verify-email/<token>')
def verify_email(token):
    customer = Customer.query.filter_by(verification_token=token).first()
    if not customer:
        return jsonify({"message": "Invalid verification token"}), 400
    customer.is_verified = True
    customer.verification_token = None
    db.session.commit()
    return jsonify({"message": "Email verified successfully"})

# # ---------------- CUSTOMER PROFILE ----------------
# @app.route('/api/customer/profile/<int:customer_id>', methods=['GET', 'PUT'])
# def customer_profile(customer_id):
#     customer = Customer.query.get(customer_id)
#     if not customer:
#         return jsonify({"error": "Customer not found"}), 404

#     if request.method == 'GET':
#         return jsonify({"customerID": customer.customerID, "FullName": customer.FullName, "Email": customer.Email, "PhoneNumber": customer.PhoneNumber}), 200

#     data = request.json
#     if "Email" in data:
#         ex_email = Customer.query.filter_by(Email=data["Email"]).first()
#         if ex_email and ex_email.customerID != customer_id: return jsonify({"error": "Email in use"}), 400
#         customer.Email = data["Email"]
#     if "PhoneNumber" in data:
#         ex_phone = Customer.query.filter_by(PhoneNumber=data["PhoneNumber"]).first()
#         if ex_phone and ex_phone.customerID != customer_id: return jsonify({"error": "Phone in use"}), 400
#         customer.PhoneNumber = data["PhoneNumber"]
#     if "FullName" in data:
#         customer.FullName = data["FullName"]

#     db.session.commit()
#     return jsonify({"message": "Profile updated successfully"})

# ---------------- VEHICLES ----------------
@app.route('/api/vehicle', methods=['POST', 'OPTIONS', 'GET'])
def vehicle_ops():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS allowed'}), 200
    
    if request.method == 'GET':
        c_id = request.args.get('customerID')
        if not c_id: return jsonify([]), 200
        vehicles = Vehicle.query.filter_by(customerID=c_id, is_active=True).all()
        return jsonify([{'license_plate': v.license_plate, 'make': v.make, 'model': v.model, 'year': v.year, 'color': v.color} for v in vehicles]), 200

    data = request.get_json()
    try:
        new_vehicle = Vehicle(
            license_plate=data.get('license_plate', '').strip().upper(), make=data.get('make'),
            model=data.get('model'), year=data.get('year'), vin=data.get('vin'), color=data.get('color'), customerID=data.get('customerID')
        )
        db.session.add(new_vehicle)
        db.session.commit()
        return jsonify({"message": "Vehicle registered successfully!"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500

@app.route('/api/vehicle/<string:license_plate>', methods=['DELETE'])
# @jwt_required()  <-- Keep your authentication decorator if you are using it!
def remove_vehicle(license_plate):
    # 1. Find the vehicle in the database
    vehicle = Vehicle.query.get(license_plate)
    
    if not vehicle:
        return {"error": "Vehicle not found"}, 404

    try:
        # 2. THE SOFT DELETE: Don't delete the row, just hide it!
        # This keeps all your past booking history perfectly intact.
        vehicle.is_active = False
        db.session.commit()
        
        return {"message": "Vehicle removed successfully"}, 200
        
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 500
    
@app.route('/api/vehicle', methods=['GET'])
# @jwt_required()
def get_customer_vehicles():
    customer_id = request.args.get('customerID')
    
    # Notice the is_active=True filter!
    vehicles = Vehicle.query.filter_by(customerID=customer_id, is_active=True).all()
    
    vehicle_list = [{
        "license_plate": v.license_plate,
        "make": v.make,
        "model": v.model,
        "year": v.year,
        "color": v.color
    } for v in vehicles]
    
    return vehicle_list, 200

# ---------------- MECHANIC SPECIFIC ENDPOINTS ----------------
@app.route('/api/mechanic/jobs/<int:mechanic_id>', methods=['GET', 'OPTIONS'])
def get_mechanic_jobs(mechanic_id):
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS allowed'}), 200
    try:
        bookings = ServiceBooking.query.filter(ServiceBooking.mechanicID == mechanic_id, ServiceBooking.statusID < 3).all()
        return jsonify([{"bookingID": b.bookingID, "license_plate": b.license_plate, "serviceType": b.serviceType, "statusID": b.statusID} for b in bookings]), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch jobs"}), 500

@app.route('/api/mechanic/job/<int:booking_id>/status', methods=['PUT', 'OPTIONS'])
def mechanic_update_status(booking_id):
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS allowed'}), 200
    try:
        booking = ServiceBooking.query.get(booking_id)
        if not booking:
            return jsonify({"error": "Booking not found"}), 404
        booking.statusID = request.json.get('statusID')
        db.session.commit()
        return jsonify({"message": "Job status updated successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------- CUSTOMER BOOKINGS & TRACKING ----------------
@app.route('/api/services', methods=['GET'])
def get_services():
    return jsonify([{"id": s.id, "name": s.name, "category": s.category, "price": s.price} for s in Service.query.all()])

@app.route('/api/book-service', methods=['POST', 'OPTIONS'])
def book_service():
    # FIX: Add preflight handler
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS allowed'}), 200
        
    try:
        data = request.json
        service = Service.query.filter_by(name=data['serviceType']).first()
        if not service: return jsonify({"message": "Invalid service type"}), 400

        new_booking = ServiceBooking(
            bookingDate=datetime.strptime(data['date'], '%Y-%m-%d').date(), statusID=1,
            license_plate=data['license_plate'], serviceType=data['serviceType'], amount=service.price
        )
        db.session.add(new_booking)
        db.session.commit()
        return jsonify({"message": "Booking successful!", "amount": service.price}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500

@app.route('/api/my-bookings/<int:customer_id>')
def get_active_bookings(customer_id):
    bookings = db.session.query(ServiceBooking).join(Vehicle, ServiceBooking.license_plate == Vehicle.license_plate).filter(Vehicle.customerID == customer_id, ServiceBooking.statusID.in_([1, 2])).all()
    return jsonify([{"id": b.bookingID, "appointment_date": b.bookingDate.strftime('%d %b %Y'), "statusID": b.statusID, "service_type": b.serviceType, "license_plate": b.license_plate} for b in bookings])

@app.route('/api/bookings/<int:booking_id>/reschedule', methods=['PUT', 'OPTIONS'])
def reschedule_booking(booking_id):
    if request.method == 'OPTIONS': return jsonify({'message': 'CORS allowed'}), 200
    try:
        booking = ServiceBooking.query.get(booking_id)
        if booking.statusID > 1: return jsonify({"error": "Cannot reschedule a vehicle already in service."}), 400
        booking.bookingDate = datetime.strptime(request.json.get('newDate'), '%Y-%m-%d').date()
        db.session.commit()
        return jsonify({"message": "Rescheduled!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/bookings/<int:booking_id>/cancel', methods=['PUT']) 
def cancel_booking(booking_id):
    booking = ServiceBooking.query.get(booking_id)

    if not booking:
        return {"error": "Booking not found or already deleted."}, 404

    if booking.statusID != 1:  
        return {"error": "Only pending bookings can be cancelled."}, 400

    try:
        # Extract the JSON payload sent from React
        data = request.get_json() or {}
        
        # Change status to 5 (Cancelled)
        booking.statusID = 5 
        
        # Save the reason to the database (fallback if empty)
        booking.cancellation_reason = data.get('reason', 'No reason provided')
        
        db.session.commit()
        
        return {"message": "Booking cancelled successfully!"}, 200
    except Exception as e:
        db.session.rollback()
        return {"error": "Failed to cancel booking due to a database error."}, 500

@app.route('/api/customer-stats/<int:customer_id>', methods=['GET', 'OPTIONS'])
def get_customer_stats(customer_id):
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS allowed'}), 200
        
    try:
        # THE FIX: Added is_active=True so it ignores deleted vehicles!
        total_vehicles = Vehicle.query.filter_by(customerID=customer_id, is_active=True).count()
        
        active_bookings = ServiceBooking.query.join(Vehicle, ServiceBooking.license_plate == Vehicle.license_plate)\
            .filter(Vehicle.customerID == customer_id, ServiceBooking.statusID < 3).count()
            
        completed_services = ServiceBooking.query.join(Vehicle, ServiceBooking.license_plate == Vehicle.license_plate)\
            .filter(Vehicle.customerID == customer_id, ServiceBooking.statusID >= 3).count()

        return jsonify({
            "total_vehicles": total_vehicles,
            "active_bookings": active_bookings,
            "completed_services": completed_services
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# @app.route('/api/customer/tracking/<int:customer_id>', methods=['GET'])
# def get_tracking(customer_id):
#     bookings = db.session.query(ServiceBooking, Vehicle).join(Vehicle, ServiceBooking.license_plate == Vehicle.license_plate).filter(Vehicle.customerID == customer_id, ServiceBooking.paymentStatus != "Paid").all()
#     return jsonify([{"bookingID": b.bookingID, "license_plate": b.license_plate, "vehicle": f"{v.make} {v.model}", "serviceType": b.serviceType, "statusID": b.statusID, "paymentStatus": b.paymentStatus, "bookingDate": b.bookingDate.strftime("%Y-%m-%d"), "amount": b.amount or 0} for b, v in bookings]), 200

# @app.route('/api/service-history/<int:customer_id>')
# def service_history(customer_id):
#     bookings = db.session.query(ServiceBooking).join(Vehicle, ServiceBooking.license_plate == Vehicle.license_plate).filter(Vehicle.customerID == customer_id, ServiceBooking.paymentStatus == "Paid").all()
#     return jsonify([{"id": b.bookingID, "date": b.bookingDate.strftime('%d %b %Y'), "vehicle": b.license_plate, "service": b.serviceType, "paymentStatus": b.paymentStatus, "amount": b.amount, "paymentMethod": getattr(b, 'paymentMethod', 'Cash'), "receiptNumber": getattr(b, 'mpesaReceiptNumber', 'N/A')} for b in bookings])

@app.route('/api/customer/tracking/<int:customer_id>', methods=['GET'])
def get_tracking(customer_id):
    # Exclude "Paid" bookings AND exclude "Cancelled" bookings (status 5 and 6)
    bookings = db.session.query(ServiceBooking, Vehicle).join(
        Vehicle, ServiceBooking.license_plate == Vehicle.license_plate
    ).filter(
        Vehicle.customerID == customer_id, 
        ServiceBooking.paymentStatus != "Paid",
        ServiceBooking.statusID.notin_([5, 6]) 
    ).all()
    
    return jsonify([{
        "bookingID": b.bookingID, 
        "license_plate": b.license_plate, 
        "vehicle": f"{v.make} {v.model}", 
        "serviceType": b.serviceType, 
        "statusID": b.statusID, 
        "paymentStatus": b.paymentStatus, 
        "bookingDate": b.bookingDate.strftime("%Y-%m-%d"), 
        "amount": b.amount or 0
    } for b, v in bookings]), 200

@app.route('/api/service-history/<int:customer_id>')
def service_history(customer_id):
    # Strictly fetch ONLY "Paid" bookings
    bookings = db.session.query(ServiceBooking).join(
        Vehicle, ServiceBooking.license_plate == Vehicle.license_plate
    ).filter(
        Vehicle.customerID == customer_id, 
        ServiceBooking.paymentStatus == "Paid"
    ).all()
    
    return jsonify([{
        "id": b.bookingID, 
        "date": b.bookingDate.strftime('%d %b %Y'), 
        "vehicle": b.license_plate, 
        "service": b.serviceType, 
        "paymentStatus": b.paymentStatus, 
        "amount": b.amount, 
        "paymentMethod": getattr(b, 'paymentMethod', 'Cash'), 
        "receiptNumber": getattr(b, 'mpesaReceiptNumber', 'N/A')
    } for b in bookings])

# ---------------- M-PESA ----------------
@app.route('/api/mpesa/stkpush', methods=['POST', 'OPTIONS'])
def mpesa_stk_push():
    if request.method == 'OPTIONS': return jsonify({'message': 'CORS allowed'}), 200
    try:
        data = request.json
        phone_number = data.get('phone') 
        amount = data.get('amount')
        booking_id = data.get('bookingID') or data.get('booking_id')

        if not phone_number or not amount or not booking_id: return jsonify({"error": "Missing inputs"}), 400

        consumer_key = os.environ.get('MPESA_CONSUMER_KEY', 'sandbox_key')
        consumer_secret = os.environ.get('MPESA_CONSUMER_SECRET', 'sandbox_secret')
        shortcode = os.environ.get('SHORTCODE', '174379')

        r = requests.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", auth=HTTPBasicAuth(consumer_key, consumer_secret))
        if r.status_code != 200:
            return jsonify({"message": "Prompt sent (Simulated)", "CheckoutRequestID": f"ws_CO_{datetime.now().strftime('%Y%m%d%H%M%S')}"}), 200

        access_token = r.json().get('access_token')
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password = base64.b64encode((shortcode + os.environ.get('MPESA_PASSKEY', 'pass') + timestamp).encode()).decode('utf-8')

        headers = { "Authorization": f"Bearer {access_token}" }
        payload = {
            "BusinessShortCode": shortcode, "Password": password, "Timestamp": timestamp, "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount), "PartyA": phone_number, "PartyB": shortcode, "PhoneNumber": phone_number,
            "CallBackURL": os.environ.get("MPESA_CALLBACK_URL", "https://your-ngrok.com/api/mpesa/callback"), "AccountReference": f"BK-{booking_id}", "TransactionDesc": "Vehicle Service"
        }

        response = requests.post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", json=payload, headers=headers)
        if response.status_code == 200:
            booking = ServiceBooking.query.get(booking_id)
            if booking:
                booking.mpesaCheckoutRequestID = response.json().get("CheckoutRequestID")
                db.session.commit()
            return jsonify({"message": "Prompt sent.", "CheckoutRequestID": response.json().get("CheckoutRequestID")}), 200
        return jsonify({"error": "M-Pesa request failed"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mpesa/callback', methods=['POST'])
def mpesa_callback():
    try:
        callback_data = request.json.get('Body', {}).get('stkCallback', {})
        booking = ServiceBooking.query.filter_by(mpesaCheckoutRequestID=callback_data.get('CheckoutRequestID')).first()

        if booking and callback_data.get('ResultCode') == 0:
            items = callback_data.get('CallbackMetadata', {}).get('Item', [])
            booking.paymentStatus = "Paid"
            booking.mpesaReceiptNumber = next((item.get('Value') for item in items if item.get('Name') == 'MpesaReceiptNumber'), "UNKNOWN")
            booking.statusID = 4 
            booking.paidAt = datetime.now()
            booking.paymentMethod = "M-Pesa"
            db.session.commit()

        return jsonify({"ResultCode": 0, "ResultDesc": "Accepted"}), 200
    except Exception as e:
        return jsonify({"ResultCode": 1, "ResultDesc": "Error"}), 500
    
@app.route('/api/customer/job/<int:booking_id>/select-cash', methods=['PUT', 'OPTIONS'])
def select_cash_payment(booking_id):
    # 1. Handle the browser's preflight CORS check
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight allowed'}), 200
        
    try:
        # 2. Find the booking in the database
        booking = ServiceBooking.query.get(booking_id)
        if not booking:
            return jsonify({"error": "Booking not found"}), 404
            
        # 3. Update the payment method and keep paymentStatus as "Unpaid" 
        # until the admin processes the physical cash at the desk
        booking.paymentMethod = "Cash"
        db.session.commit()
        
        return jsonify({"message": "Cash payment selected successfully. Please proceed to the desk."}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500



# ---------------- PASSWORD RESET FLOW ----------------
@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('Email')

    if not email:
        return jsonify({"error": "Email is required"}), 400

    customer = Customer.query.filter_by(Email=email).first()
    
    # We always return a success message even if the email doesn't exist 
    # to prevent hackers from "guessing" which emails are registered.
    if not customer:
        return jsonify({"message": "If an account exists, a reset link has been sent."}), 200

    # Generate a secure, 15-minute token
    reset_token = jwt.encode(
        {
            'reset_id': customer.customerID, 
            'exp': datetime.now(timezone.utc) + timedelta(minutes=15)
        }, 
        app.config['SECRET_KEY'], 
        algorithm="HS256"
    )

    # Send the email
    try:
        reset_link = f"http://localhost:5173/reset-password/{reset_token}"
        msg = Message("AutoCare Pro - Password Reset", recipients=[email])
        msg.body = f"Hello {customer.FullName},\n\nYou requested a password reset. Click the link below to create a new password. This link will expire in 15 minutes.\n\n{reset_link}\n\nIf you did not request this, please ignore this email."
        mail.send(msg)
    except Exception as e:
        print(f"❌ EMAIL SENDING FAILED: {e}")
        return jsonify({"error": "Failed to send email. Check server logs."}), 500

    return jsonify({"message": "If an account exists, a reset link has been sent."}), 200


@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    token = data.get('token')
    new_password = data.get('password')

    if not token or not new_password:
        return jsonify({"error": "Token and new password are required"}), 400

    try:
        # Decode the token to get the user ID
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        customer_id = decoded.get('reset_id')

        customer = Customer.query.get(customer_id)
        if not customer:
            return jsonify({"error": "User not found"}), 404

        # Hash and save the new password
        customer.PasswordHash = generate_password_hash(new_password)
        db.session.commit()

        return jsonify({"message": "Password has been successfully reset!"}), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Reset link has expired. Please request a new one."}), 400
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid reset link."}), 400
    
    # ---------------- CUSTOMER PROFILE ----------------
@app.route('/api/customer/profile/<int:customer_id>', methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
def customer_profile(customer_id):
    # Handle preflight
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS allowed'}), 200
        
    # FETCH THE RECORD
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer account not found"}), 404
            
    # GET Request: Return the data
    if request.method == 'GET':
        # Ensure we return exact keys
        return jsonify({
            "FullName": customer.FullName,
            "Email": customer.Email,
            "PhoneNumber": customer.PhoneNumber
        }), 200
            
    # PUT Request: Process updates
    if request.method == 'PUT':
        data = request.json
        
        # Validate and apply updates
        if "FullName" in data:
            if not is_valid_name(data["FullName"]):
                return jsonify({"error": "Invalid name. Cannot contain numbers."}), 400
            customer.FullName = data["FullName"].strip()
            
        if "Email" in data:
            if not is_valid_email(data["Email"]):
                return jsonify({"error": "Invalid email address format."}), 400
            
            # Ensure they aren't taking someone else's email
            existing = Customer.query.filter_by(Email=data["Email"].strip().lower()).first()
            if existing and existing.customerID != customer_id:
                return jsonify({"error": "Email is already in use by another account."}), 400
            customer.Email = data["Email"].strip().lower()
            
        if "PhoneNumber" in data:
            if not is_valid_kenyan_phone(data["PhoneNumber"]):
                return jsonify({"error": "Invalid phone number. Must be a valid Kenyan format."}), 400
            customer.PhoneNumber = data["PhoneNumber"].replace(" ", "").strip()
        
        # Security: Handle password separately
        if data.get("newPassword"):
            customer.PasswordHash = generate_password_hash(data["newPassword"])
                
        db.session.commit()
        return jsonify({"message": "Profile updated successfully"}), 200

    # DELETE Request: Remove the account
    if request.method == 'DELETE':
        try:
            db.session.delete(customer)
            db.session.commit()
            return jsonify({"message": "Account successfully deleted."}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Cannot delete account due to existing service history constraints."}), 500
            
    # PUT Request: Process updates
    if request.method == 'PUT':
        data = request.json
        # Only update if the key exists in the request
        if "FullName" in data: customer.FullName = data["FullName"]
        if "Email" in data: customer.Email = data["Email"]
        if "PhoneNumber" in data: customer.PhoneNumber = data["PhoneNumber"]
        
        # Security: Handle password separately
        if data.get("newPassword"):
            customer.Password = generate_password_hash(data["newPassword"])
                
        db.session.commit()
        return jsonify({"message": "Profile updated successfully"}), 200

@app.route('/api/customer/notifications/<int:customer_id>', methods=['GET', 'OPTIONS'])
def get_customer_notifications(customer_id):
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS allowed'}), 200
        
    try:
        # Find active bookings that need the customer's attention
        bookings = db.session.query(ServiceBooking, Vehicle).join(
            Vehicle, ServiceBooking.license_plate == Vehicle.license_plate
        ).filter(
            Vehicle.customerID == customer_id,
            ServiceBooking.statusID.in_([2, 3]) # Status 2 = In Service, 3 = Ready
        ).all()

        notifications = []
        for booking, vehicle in bookings:
            if booking.statusID == 2:
                notifications.append({
                    "bookingID": booking.bookingID,
                    "message": f"Your {vehicle.make} ({vehicle.license_plate}) is currently in the bay being serviced by our mechanics."
                })
            elif booking.statusID == 3:
                notifications.append({
                    "bookingID": booking.bookingID,
                    "message": f"Service complete! Your {vehicle.make} ({vehicle.license_plate}) is ready. Please check the tracking tab to process your payment."
                })

        return jsonify(notifications), 200
        
    except Exception as e:
        print("Notification Error:", e)
        return jsonify({"error": "Failed to fetch notifications"}), 500
    
#     # ---------------- MECHANIC SPECIFIC ENDPOINTS ----------------
# @app.route('/api/mechanic/jobs/<int:mechanic_id>', methods=['GET', 'OPTIONS'])
# def get_mechanic_jobs(mechanic_id):
#     if request.method == 'OPTIONS':
#         return jsonify({'message': 'CORS allowed'}), 200
#     try:
#         bookings = ServiceBooking.query.filter(ServiceBooking.mechanicID == mechanic_id, ServiceBooking.statusID < 3).all()
#         return jsonify([{"bookingID": b.bookingID, "license_plate": b.license_plate, "serviceType": b.serviceType, "statusID": b.statusID} for b in bookings]), 200
#     except Exception as e:
#         return jsonify({"error": "Failed to fetch jobs"}), 500


def send_system_email(email_type, recipient_email, **kwargs):
    """
    Centralized function for sending all system emails.
    email_type options: 'registration', 'password_reset', 'service_complete'
    """
    try:
        from app import mail # Adjust import based on your setup
        
        if email_type == 'registration':
            token = kwargs.get('token')
            msg = Message("Verify your AutoCare Pro Account", recipients=[recipient_email])
            msg.body = f"Welcome to AutoCare Pro!\n\nClick the link below to verify your account:\nhttp://localhost:5173/verify?token={token}\n\nThank you for joining us!"
            mail.send(msg)
            return True

        elif email_type == 'password_reset':
            reset_token = kwargs.get('reset_token')
            customer_name = kwargs.get('customer_name', 'Customer')
            reset_link = f"http://localhost:5173/reset-password/{reset_token}"
            
            msg = Message("AutoCare Pro - Password Reset", recipients=[recipient_email])
            msg.body = f"Hello {customer_name},\n\nYou requested a password reset. Click the link below to create a new password. This link will expire in 15 minutes.\n\n{reset_link}\n\nIf you did not request this, please ignore this email."
            mail.send(msg)
            return True

        elif email_type == 'service_complete':
            customer_name = kwargs.get('customer_name')
            vehicle_plate = kwargs.get('vehicle_plate')
            invoice_buffer = kwargs.get('invoice_buffer')
            booking_id = kwargs.get('booking_id')
            
            msg = Message(f"Invoice for Vehicle Service: {vehicle_plate}", recipients=[recipient_email])
            msg.body = f"Hello {customer_name},\n\nYour vehicle ({vehicle_plate}) service is complete and ready for pickup!\n\nPlease find your official invoice attached.\n\nThank you,\nAUTOCARE PRO"
            
            # Attach the PDF invoice if provided
            if invoice_buffer:
                msg.attach(f"Invoice_BK{booking_id}.pdf", "application/pdf", invoice_buffer.read())
            
            mail.send(msg)
            return True

        return False
        
    except Exception as e:
        print(f"❌ EMAIL SENDING FAILED ({email_type}): {e}")
        return False

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        if not Service.query.first():
            services = [
                Service(name="Oil Change", category="Basic Maintenance", price=3500), Service(name="Car Wash", category="Basic Maintenance", price=1000),
                Service(name="Engine Check", category="Diagnostics", price=5000), Service(name="Full Service", category="Major Repairs", price=12000),
                Service(name="Brake Service", category="Tyres & Brakes", price=7000), Service(name="AC Service", category="Cooling & AC", price=6500)
            ]
            db.session.add_all(services)
            db.session.commit()
    app.run(debug=False, use_reloader=False, host="0.0.0.0", port=5000)