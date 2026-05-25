import random
from faker import Faker
from werkzeug.security import generate_password_hash
from app import app, db
from models import Customer, Vehicle, ServiceBooking, Mechanic, Admin

fake = Faker()

# Sample data arrays for realistic garage data
KENYAN_PREFIXES = ['071', '072', '079', '070', '011']
VEHICLE_BRANDS = [
    ('Toyota', ['Corolla', 'Vitz', 'Fielder', 'Prado', 'Axio']),
    ('Nissan', ['Note', 'X-Trail', 'Juke', 'Navara']),
    ('Honda', ['Fit', 'CR-V', 'Civic']),
    ('Subaru', ['Forester', 'Outback', 'Impreza']),
    ('Mazda', ['Demio', 'CX-5', 'Axela'])
]
SERVICES = [
    ("Full Engine Service", 5500), 
    ("Oil & Filter Change", 3500), 
    ("Brake Pad Replacement", 4500), 
    ("Suspension Repair", 8500), 
    ("Wheel Alignment & Balancing", 2500)
]
COLORS = ['White', 'Silver', 'Black', 'Blue', 'Red']

def generate_kenyan_phone():
    return random.choice(KENYAN_PREFIXES) + str(random.randint(1000000, 9999999))

def generate_kenyan_plate():
    letters = fake.lexify(text='KC?').upper()
    numbers = fake.numerify(text='###')
    last_letter = fake.lexify(text='?').upper()
    return f"{letters} {numbers}{last_letter}"

def seed_database():
    with app.app_context():
        print("Starting Database Seeding...")

        # 1. Create 1 Admin
        print("Seeding 1 Admin...")
        admin_exists = Admin.query.filter_by(username="admin").first()
        if not admin_exists:
            admin = Admin(
                username="admin", 
                email="admin@autocare.com", 
                password=generate_password_hash("Admin@123") 
            )
            db.session.add(admin)
            db.session.commit()
        else:
            print("Admin already exists, skipping...")

        # # 2. Create 5 Mechanics
        # print("Seeding 5 Mechanics...")
        # specialties = ["Engine Specialist", "Transmission", "General Maintenance", "Auto Electrician", "Suspension"]
        # for i in range(5):
        #     mechanic = Mechanic(
        #         FullName=fake.name(),
        #         Email=fake.email(),
        #         PhoneNumber=generate_kenyan_phone(),       # MATCHES: models.py
        #         Specialization=specialties[i],             # MATCHES: models.py
        #         PasswordHash=generate_password_hash("Mech@123") # MATCHES: models.py
        #     )
        #     db.session.add(mechanic)
        # db.session.commit()

        # # 3. Create 50 Customers
        # print("Seeding 50 Customers...")
        # customers = []
        # for _ in range(50):
        #     customer = Customer(
        #         FullName=fake.name(),
        #         Email=fake.email(),
        #         PhoneNumber=generate_kenyan_phone(),       # MATCHES: models.py
        #         PasswordHash=generate_password_hash("1234") # MATCHES: models.py
        #     )
        #     db.session.add(customer)
        #     customers.append(customer)
        # db.session.commit()

        # # 4. Pick 20 random customers to have vehicles
        # print("Seeding 20 Vehicles...")
        # selected_customers = random.sample(customers, 20)
        # vehicles = []
        
        # for customer in selected_customers:
        #     make, models = random.choice(VEHICLE_BRANDS)
        #     vehicle = Vehicle(
        #         license_plate=generate_kenyan_plate(),
        #         make=make,
        #         model=random.choice(models),
        #         year=random.randint(2010, 2024),           # MATCHES: models.py (Integer)
        #         vin=f"V-{fake.random_number(digits=10, fix_len=True)}",
        #         color=random.choice(COLORS),               # MATCHES: models.py (lowercase)
        #         customerID=customer.customerID
        #     )
        #     db.session.add(vehicle)
        #     vehicles.append(vehicle)
        # db.session.commit()

        # # 5. Create 20 Bookings for those 20 vehicles
        # print("Seeding 20 Bookings...")
        # mechanics = Mechanic.query.all()
        # for vehicle in vehicles:
        #     service_name, amount = random.choice(SERVICES)
        #     status = random.randint(1, 4) # 1: Pending, 2: In Service, 3: Ready, 4: Paid
            
        #     # Logic to make payments look realistic
        #     payment_status = "Paid" if status == 4 else "Unpaid"
        #     payment_method = random.choice(["M-Pesa", "Cash"]) if status == 4 else None

        #     booking = ServiceBooking(
        #         bookingDate=fake.date_between(start_date='-30d', end_date='today'),
        #         statusID=status,
        #         license_plate=vehicle.license_plate,
        #         serviceType=service_name,
        #         amount=amount,
        #         paymentStatus=payment_status,
        #         paymentMethod=payment_method,
        #         mechanicID=random.choice(mechanics).MechanicID # Link to a random mechanic
        #     )
        #     db.session.add(booking)
        # db.session.commit()

        # print("✅ Database successfully populated!")
        # print("Admin Login Username: admin | Password: Admin@123")

if __name__ == "__main__":
    seed_database()