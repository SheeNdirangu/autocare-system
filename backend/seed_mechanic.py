from app import app, db
from models import Mechanic
from werkzeug.security import generate_password_hash

def initialize_mechanic_logins():
    with app.app_context():
        # Find all mechanics currently registered in the database
        mechanics_list = Mechanic.query.filter_by(is_active=True).all()
        
        if not mechanics_list:
            print("No mechanics found in your database. Add them through your Admin Panel first.")
            return

        print(f"Syncing login configurations for {len(mechanics_list)} mechanics...")
        
        # We loop through each mechanic and assign a uniform base password for testing
        # Default credentials will be: Their saved email + "MechanicPro123!"
        default_password = "Mech.123"
        hashed_password = generate_password_hash(default_password)

        for mechanic in mechanics_list:
            if not mechanic.Email:
                # Fallback generator if the mechanic is missing an email field
                clean_name = mechanic.FullName.lower().replace(" ", "")
                mechanic.Email = f"{clean_name}@autocarepro.com"
            
            # Map the secure encrypted hash to the column layer
            mechanic.PasswordHash = hashed_password
            
        db.session.commit()
        print("\n✅ Success! Mechanic portals are live.")
        print(f"Universal Test Password: {default_password}")
        print("--------------------------------------------------")
        for m in mechanics_list:
            print(f"Name: {m.FullName} -> Login Email: {m.Email}")

if __name__ == "__main__":
    initialize_mechanic_logins()