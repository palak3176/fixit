import re
from flask import Flask, render_template, jsonify, request
from admin import admin_bp
from data import all_services  # <--- FIX: Import from data.py, NOT database

# Initialize Flask App
app = Flask(__name__)

# --- REGISTER BLUEPRINTS ---
app.register_blueprint(admin_bp)


# --- CUSTOMER ROUTES ---

@app.route('/')
def home():
    """Renders the main customer-facing website."""
    return render_template('index.html')


@app.route('/api/services')
def get_services():
    """
    API Endpoint used by the customer frontend.
    Fetches from the static list in data.py
    """
    # Filter to show only 'Active' providers from your mock data
    visible_services = [s for s in all_services if s.get('status') == 'Active']
    return jsonify(visible_services)


@app.route('/api/diagnose', methods=['POST'])
def ai_diagnose():
    """Mock AI Endpoint for the video diagnosis feature."""
    return jsonify({
        "issue": "Worn Washer / Pipe Joint",
        "confidence": "94%",
        "part_cost": "₹40 - ₹80",
        "labor_cost": "₹250 - ₹350",
        "total_estimate": "₹350 - ₹450"
    })


# --- 5. AI PROBLEM ANALYSIS & MATCHING ENGINE ---
@app.route('/api/analyze-problem', methods=['POST'])
def analyze_problem():
    data = request.json
    problem_text = data.get('text', '').lower()
    user_location = data.get('location', 'Thane West')

    # A. SIMULATE AI CATEGORY DETECTION (Heuristic Rule-Based)
    detected_category = "General"
    keywords = {
        'Plumber': ['leak', 'pipe', 'water', 'tap', 'drain', 'clog', 'sink', 'washroom'],
        'Electrician': ['spark', 'shock', 'light', 'fan', 'switch', 'current', 'wire', 'mcb'],
        'AC Repair': ['cooling', 'ac ', 'warm air', 'gas', 'compressor', 'service'],
        'Carpenter': ['wood', 'door', 'furniture', 'cupboard', 'lock', 'hinge'],
        'Painters': ['wall', 'paint', 'color', 'whitewash'],
        'Pest Control': ['cockroach', 'ant', 'termite', 'rat', 'bug'],
    }

    for cat, words in keywords.items():
        if any(word in problem_text for word in words):
            detected_category = cat
            break

    # B. FETCH CANDIDATES (From data.py List)
    candidates = [s for s in all_services if s.get('status') == 'Active']

    if detected_category != "General":
        candidates = [s for s in candidates if s.get('category') == detected_category]

    # C. RANKING LOGIC
    scored_results = []

    for provider in candidates:
        score = 0

        # 1. Rating (Weight: 4.0)
        try:
            score += float(provider.get('rating', 0)) * 20
        except:
            pass

        # 2. Experience (Weight: 3.0 per year, max 30)
        exp_str = provider.get('experience', '0')
        try:
            years = int(re.search(r'\d+', exp_str).group()) if re.search(r'\d+', exp_str) else 0
            score += min(years * 5, 30)
        except:
            pass

        # 3. Bio Matching (Bonus 20 points)
        if provider.get('bio') and any(word in provider['bio'].lower() for word in problem_text.split()):
            score += 20

        # 4. Location Match (Bonus 10 points)
        if provider.get('location') == user_location:
            score += 10

        provider['match_score'] = int(score)
        scored_results.append(provider)

    # Sort by Score (High to Low)
    scored_results.sort(key=lambda x: x['match_score'], reverse=True)

    return jsonify({
        "diagnosis": f"Based on your input, this seems to be a {detected_category} issue.",
        "category": detected_category,
        "providers": scored_results[:5]
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)