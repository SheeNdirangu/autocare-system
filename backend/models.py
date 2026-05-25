from flask_sqlalchemy import SQLAlchemy
import uuid 
from datetime import datetime, timezone

def generate_unique_id():
    """Generates a short, unique string for customer or vehicle tracking"""
    return str(uuid.uuid4().hex[:8].upper()) 

db = SQLAlchemy()

# 1. The Customer Model
class Customer(db.Model):
    __tablename__ = 'Customer'
    customerID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    FullName = db.Column(db.String(100), nullable=False)
    PhoneNumber = db.Column(db.String(15), unique=True, nullable=False)
    Email = db.Column(db.String(100), unique=True) 
    PasswordHash = db.Column(db.String(255), nullable=False)
    DateJoined = db.Column(db.DateTime, default=db.func.current_timestamp())
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    vehicles = db.relationship('Vehicle', backref='owner', lazy=True)
    verification_token = db.Column(db.String(255), nullable=True)
    is_verified = db.Column(db.Boolean, default=False)

# 2. The Vehicle Model
class Vehicle(db.Model):
    __tablename__ = 'Vehicle'

    license_plate = db.Column(db.String(20), primary_key=True)
    make = db.Column(db.String(50))
    model = db.Column(db.String(50))
    year = db.Column(db.Integer)
    vin = db.Column(db.String(20), unique=True)
    customerID = db.Column(db.Integer, db.ForeignKey('Customer.customerID'))
    color = db.Column(db.String(30))
    is_active = db.Column(db.Boolean, default=True)
    

class Mechanic(db.Model):
    __tablename__ = 'Mechanic'

    MechanicID = db.Column(db.Integer, primary_key=True)
    FullName = db.Column(db.String(100), nullable=False)
    PhoneNumber = db.Column(db.String(20))
    Specialization = db.Column(db.String(100))
    Availability = db.Column(db.String(20), default="Available")
    Email = db.Column(db.String(255),unique=True)
    PasswordHash = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    
class ServiceBooking(db.Model):
    __tablename__ = 'ServiceBooking'

    bookingID = db.Column(db.Integer, primary_key=True)
    bookingDate = db.Column(db.Date)
    statusID = db.Column(db.Integer, default=1)  # 1 = Pending
    paymentStatus = db.Column(db.String(20), default="Unpaid")
    license_plate = db.Column(db.String(20), db.ForeignKey('Vehicle.license_plate'))
    serviceType = db.Column(db.String(50))
    mechanicID = db.Column(db.Integer, db.ForeignKey('Mechanic.MechanicID'), nullable=True)
    mpesaCheckoutRequestID = db.Column(db.String(100), nullable=True)
    mpesaReceiptNumber = db.Column(db.String(100), nullable=True)
    amount = db.Column(db.Float, default=0.0)
    paidAt = db.Column(db.DateTime, nullable=True)
    customerNotification = db.Column(db.String(255), nullable=True)
    paymentMethod = db.Column(db.String(20))

class Transaction(db.Model):
    __tablename__ = 'Transaction'
    transactionID = db.Column(db.Integer, primary_key=True)
    bookingID = db.Column(db.Integer, db.ForeignKey('ServiceBooking.bookingID'))
    mpesa_receipt = db.Column(db.String(50), unique=True) # Received from Safaricom
    checkout_id = db.Column(db.String(100)) # The ID from the STK Push
    amount = db.Column(db.Float)
    status = db.Column(db.String(20), default='Pending') # 'Completed' or 'Failed'
    timestamp = db.Column(db.DateTime, default=db.func.now())

    
class Service(db.Model):
    __tablename__ = "services"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    category = db.Column(db.String(100))
    price = db.Column(db.Integer)

class Admin(db.Model):
    __tablename__ = 'Admin'
    admin_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), default='admin')
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

class MechanicAssignment(db.Model):
    __tablename__ = 'MechanicAssignment'

    assignmentID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('ServiceBooking.bookingID'))
    mechanic_id = db.Column(db.Integer, db.ForeignKey('Mechanic.MechanicID'))
    assigned_date = db.Column(db.DateTime, default=db.func.current_timestamp())

    booking = db.relationship('ServiceBooking', backref='assignments')
    mechanic = db.relationship('Mechanic', backref='assignments')

class Invoice(db.Model):
      invoiceID = db.Column(db.Integer, primary_key=True)
      bookingID = db.Column(db.Integer, db.ForeignKey('ServiceBooking.bookingID')) # FIXED TYPO IN YOUR ORIGINAL CODE HERE
      amount = db.Column(db.Float)
      created_at = db.Column(db.DateTime, default=datetime.utcnow)