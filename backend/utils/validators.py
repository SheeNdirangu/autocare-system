import re

def validate_email(email):
    """Checks if the email is in a valid format."""
    if not email:
        return False, "Email is required."
    
    # Standard email regex pattern
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    if not re.match(pattern, email):
        return False, "Invalid email address format."
    
    return True, "Valid email"

def validate_password(password):
    """Checks if the password meets minimum security requirements."""
    if not password:
        return False, "Password is required."
    
    if len(password) < 6:
        return False, "Password must be at least 6 characters long."
    
    # Optional: You can uncomment these if you want stricter passwords
    # if not re.search(r"[A-Z]", password):
    #     return False, "Password must contain at least one uppercase letter."
    # if not re.search(r"\d", password):
    #     return False, "Password must contain at least one number."
        
    return True, "Valid password"

def validate_phone(phone_number):
    """
    Validates Kenyan phone numbers.
    Accepts formats: 07XX..., 01XX..., 2547XX..., +2547XX...
    """
    if not phone_number:
        return False, "Phone number is required."
    
    # Cleans all spaces and dashes
    clean_phone = re.sub(r'[\s\-]', '', str(phone_number))
    
    # Regex to match standard Kenyan prefixes
    pattern = r'^(?:254|\+254|0)?([71]\d{8})$'
    
    if not re.match(pattern, clean_phone):
        return False, "Invalid Kenyan phone number. Use format 07XX... or 01XX..."
        
    return True, "Valid phone number"

def validate_license_plate(plate):
    """
    Validates standard Kenyan license plates.
    Accepts formats like: KCA 123A, KCA123A
    """
    if not plate:
        return False, "License plate is required."
    
    clean_plate = str(plate).strip().upper()
    
    # Regex for standard Kenyan plates: Starts with K, 2 letters, optional space, 3 numbers, 1 letter
    pattern = r'^K[A-Z]{2}\s?\d{3}[A-Z]$'
    
    if not re.match(pattern, clean_plate):
        return False, "Invalid license plate. Expected format: KCA 123A"
        
    return True, "Valid license plate"

def validate_customer_registration(data):
    """Master validator for the customer registration endpoint."""
    if not data:
        return False, "No data provided."
        
    # Check for required fields
    required_fields = ['FullName', 'Email', 'PhoneNumber', 'Password']
    for field in required_fields:
        if field not in data or not str(data[field]).strip():
            return False, f"Missing required field: {field}"
            
    # Run individual validators
    is_valid_email, email_msg = validate_email(data['Email'])
    if not is_valid_email:
        return False, email_msg
        
    is_valid_phone, phone_msg = validate_phone(data['PhoneNumber'])
    if not is_valid_phone:
        return False, phone_msg
        
    is_valid_pass, pass_msg = validate_password(data['Password'])
    if not is_valid_pass:
        return False, pass_msg
        
    return True, "All fields are valid"