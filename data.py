import random

# --- CONFIGURATION ---
LOCATIONS = ['Thane West', 'Thane East', 'Dadar', 'Bandra', 'Kandivali', 'Andheri', 'Ghatkopar', 'Mulund', 'Airoli',
             'Vashi', 'Powai', 'Kurla']
CATEGORIES = ['Plumber', 'Electrician', 'AC Repair', 'Tiffin Service', 'Home Nursing', 'Carpenter', 'Painters',
              'Pest Control', 'Movers & Packers']
NAMES = {
    'Plumber': ['Raju Pipes', 'LeakFix Pro', 'Ganesh Plumbing', 'City Plumbers', 'A1 Water Works', 'Thane Taps'],
    'Electrician': ['Current Shock', 'LightHouse', 'PowerFix', 'Circuit Breakers', 'Voltage Kings', 'Bright Sparks'],
    'AC Repair': ['Cool Breeze', 'Frostbite AC', 'Chillex Services', 'Snowfall Repair', 'Air Master', 'Zero Degree'],
    'Tiffin Service': ['Annapurna Dabba', 'Maa ki Rasoi', 'SpiceBox', 'Dadar Delights', 'Healthy Tiffins', 'Yummy Box'],
    'Home Nursing': ['Care+ Nurses', 'Seva Home Care', 'ElderHelp', 'LifeLine Nursing', 'Angel Care', 'Happy Seniors'],
    'Carpenter': ['WoodWorks', 'Furniture Fix', 'Hammer & Nail', 'Teak Masters', 'Modern Carpentry', 'Woody'],
    'Painters': ['Color Home', 'Asian Paints Pro', 'Wall Masters', 'Dream Walls', 'Rainbow Painters', 'Shine On'],
    'Pest Control': ['Bug Busters', 'NoRoach', 'Termite Terminators', 'CleanHome', 'PestFree', 'SafeSpray'],
    'Movers & Packers': ['Shift Easy', 'Safe Move', 'Speedy Packers', 'Mumbai Movers', 'Box It Up', 'Relocate Now']
}

# --- SHARED DATA STORE ---
# This list persists in memory while the app runs
all_services = []


def init_data():
    """Generates mock data accessible by both Admin and User routes"""
    global all_services
    if all_services: return

    service_id = 1
    for cat in CATEGORIES:
        for _ in range(15):  # 15 providers per category
            name_base = random.choice(NAMES[cat])
            location = random.choice(LOCATIONS)

            # Randomize status to simulate a real database
            status = random.choice(["Active", "Active", "Active", "Pending", "Rejected"])

            all_services.append({
                "id": service_id,
                "name": f"{name_base} {location}",
                "category": cat,
                "location": location,
                "rating": round(3.5 + random.random() * 1.5, 1),
                "reviews": random.randint(10, 500),
                "price": random.randint(200, 700),
                "isVerified": status == "Active",
                "status": status,  # Critical for Admin filtering
                "isBusy": random.random() > 0.85,
                "lat": 19.0 + (random.random() * 0.25),
                "lng": 72.8 + (random.random() * 0.25),
                "image": f"https://api.dicebear.com/7.x/avataaars/svg?seed={name_base}{service_id}",
                "doc_image": "https://api.dicebear.com/7.x/identicon/svg?seed=doc_" + str(service_id),
                "phone": f"+91 {random.randint(7000000000, 9999999999)}",
                "experience": f"{random.randint(2, 20)} Years"
            })
            service_id += 1


# Initialize data immediately
init_data()