from app import app
from models import db, Service

# This is the exact list extracted from your React frontend
full_service_list = [
    # Basic Maintenance
    Service(name="Oil Change", category="Basic Maintenance", price=3500), # Note: Updated from 1 to 3500 KSh for realistic pricing
    Service(name="Car Wash", category="Basic Maintenance", price=1000),
    Service(name="Tire Rotation", category="Basic Maintenance", price=2000),
    Service(name="Spark Plug Replacement", category="Basic Maintenance", price=3000),
    
    # Diagnostics
    Service(name="Engine Check", category="Diagnostics", price=5000),
    Service(name="Computer Diagnostics", category="Diagnostics", price=4000),
    Service(name="Electrical Diagnosis", category="Diagnostics", price=4500),
    
    # Major Repairs
    Service(name="Full Service", category="Major Repairs", price=12000),
    Service(name="Major Service", category="Major Repairs", price=18000),
    Service(name="Suspension Repair", category="Major Repairs", price=14000),
    
    # Tyres & Brakes
    Service(name="Brake Service", category="Tyres & Brakes", price=7000),
    Service(name="Wheel Alignment", category="Tyres & Brakes", price=2500),
    Service(name="Tire Replacement", category="Tyres & Brakes", price=15000),
    
    # Cooling & AC
    Service(name="AC Service", category="Cooling & AC", price=6500),
    Service(name="Radiator Service", category="Cooling & AC", price=7000),
    Service(name="Coolant Flush", category="Cooling & AC", price=3000),
    
    # Battery
    Service(name="Battery Check", category="Battery", price=1500),
    Service(name="Battery Replacement", category="Battery", price=8500),
]

with app.app_context():
    print("Clearing old services...")
    Service.query.delete()  # Wipes the old incomplete list
    
    print("Injecting full React service list...")
    db.session.add_all(full_service_list)
    db.session.commit()
    
    print("✅ Success! All 18 services have been added to the database.")