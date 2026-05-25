from app import app
from models import db, Mechanic
from werkzeug.security import generate_password_hash

def force_reset_passwords():
    with app.app_context():
        mechanics = Mechanic.query.all()
        
        if not mechanics:
            print("No mechanics found in the database.")
            return

        print(f"Found {len(mechanics)} mechanics. Overriding passwords...")
        
        # We are setting everyone's password to this exact string
        universal_password = "Password123!"
        hashed_password = generate_password_hash(universal_password)

        for m in mechanics:
            m.PasswordHash = hashed_password
            print(f"✅ Reset login for: {m.Email}")
            
        db.session.commit()
        print("\nSUCCESS! All database ghost records have been fixed.")
        print(f"You can now log in using the password: {universal_password}")

if __name__ == "__main__":
    force_reset_passwords()