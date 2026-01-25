from flask import Flask, request, jsonify, session
from flask_cors import CORS
from datetime import datetime, timedelta
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
import os
import random
import math
import string
import requests 
from threading import Thread
import hashlib
import json
from time import time
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")
CORS(app, supports_credentials=True)
app.config.update(
    SESSION_COOKIE_SAMESITE='None',
    SESSION_COOKIE_SECURE=False # Production-la True-ah mathanum
)

Talisman(app, content_security_policy=None, force_https=False)

BREVO_API_KEY = os.getenv("BREVO_API_KEY") 
SENDER_EMAIL = "lifedrop108@gmail.com"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Gemini 1.5 Flash use panroam (Idhu fast-ah irukkum)
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"

# Database
db_url = os.getenv("DATABASE_URL")

if db_url:
    # Render logic: postgres:// -> postgresql:// conversion
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
else:
    # Local-la run panna fallback (SQLite for testing)
    db_url = "sqlite:///lifedrop.db"

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Donor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    blood_group = db.Column(db.String(10))
    dob = db.Column(db.String(20))
    lat = db.Column(db.Float)
    lng = db.Column(db.Float)
    health_score = db.Column(db.Integer)
    unique_id = db.Column(db.String(4), unique=True)
    last_donation_date = db.Column(db.DateTime, nullable=True) 
    donation_count = db.Column(db.Integer, default=0) 
    cooldown_email_sent = db.Column(db.Boolean, default=False)
    is_available = db.Column(db.Boolean, default=True)

class Requester(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    unique_id = db.Column(db.String(4), unique=True)

class BloodRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    requester_id = db.Column(db.String(4), nullable=False)
    patient_name = db.Column(db.String(100), nullable=False)
    contact_number = db.Column(db.String(15), nullable=False)
    blood_group = db.Column(db.String(10), nullable=False)
    units = db.Column(db.Integer, nullable=False)
    urgency = db.Column(db.Integer, nullable=False) 
    hospital = db.Column(db.String(100), nullable=False)
    lat = db.Column(db.Float, nullable=False)
    lng = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='Pending')
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp())

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    donor_id = db.Column(db.String(4), nullable=False)
    request_id = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='Pending') 
    blood_bag_id = db.Column(db.String(50), nullable=True)

class Broadcast(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String(500), nullable=False)
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp())

# 1. Blood Camp Table
class BloodCamp(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    date = db.Column(db.String(50), nullable=False)
    time = db.Column(db.String(50), nullable=False)
    organizer = db.Column(db.String(100), default="LifeDrop Official")

class BloodInventory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    blood_group = db.Column(db.String(10), unique=True, nullable=False)
    units = db.Column(db.Integer, default=0)
    last_updated = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

class BlockchainLedger(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, nullable=False)
    event = db.Column(db.String(200), nullable=False) 
    data = db.Column(db.Text, nullable=False) 
    previous_hash = db.Column(db.String(64), nullable=False)
    current_hash = db.Column(db.String(64), nullable=False)
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp())
    
class OTPVerification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), nullable=False)
    otp = db.Column(db.String(4), nullable=False)
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp())  
    
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"], # General limits
    storage_uri="memory://"
)

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        "success": False,
        "message": "Too many attempts! You are blocked for 10 minutes for security reasons."
    }), 429
    
def send_brevo_otp(email, otp):
    url = "https://api.brevo.com/v3/smtp/email"
    
    payload = {
        "sender": {"name": "LifeDrop AI", "email": SENDER_EMAIL},
        "to": [{"email": email}],
        "subject": "LifeDrop Verification Code",
        "htmlContent": f"""
            <div style="font-family: sans-serif; padding: 30px; border-radius: 20px; background-color: #f8fafc; text-align: center;">
                <h2 style="color: #ef4444; font-size: 24px; font-weight: 900;">LifeDrop 💧</h2>
                <p style="color: #64748b; font-weight: bold;">Verify your account to start saving lives.</p>
                <div style="margin: 30px 0; padding: 20px; background: white; border-radius: 15px; display: inline-block; border: 1px solid #e2e8f0;">
                    <h1 style="letter-spacing: 15px; font-size: 40px; color: #1e293b; margin: 0;">{otp}</h1>
                </div>
                <p style="color: #94a3b8; font-size: 12px;">This code will expire in 10 minutes.</p>
            </div>
        """
    }
    
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code <= 202:
            print(f"✅ OTP Sent  Successfully")
        else:
            print(f"❌ Brevo Error: {response.text}")
    except Exception as e:
        print(f"❌ Email Thread Error: {e}")    
def send_request_alert_email(donor_email, donor_name, req_details):
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {"accept": "application/json", "api-key": BREVO_API_KEY, "content-type": "application/json"}
    
    payload = {
        "sender": {"name": "LifeDrop Urgent 🚨", "email": SENDER_EMAIL},
        "to": [{"email": donor_email}],
        "subject": f"URGENT: Blood Needed for {req_details['patient']}",
        "htmlContent": f"""
            <div style="font-family: sans-serif; padding: 20px; border: 2px solid #ef4444; border-radius: 15px;">
                <h2 style="color: #ef4444;">Emergency Help Request! 🩸</h2>
                <p>Hello <b>{donor_name}</b>, a requester needs your help immediately.</p>
                <hr/>
                <p><b>Patient Name:</b> {req_details['patient']}</p>
                <p><b>Blood Group:</b> {req_details['blood']}</p>
                <p><b>Hospital:</b> {req_details['hospital']}</p>
                <p><b>Requester Name:</b> {req_details['requester']}</p>
                <p><b>Contact Phone:</b> <a href="tel:{req_details['phone']}">{req_details['phone']}</a></p>
                <hr/>
                <p style="font-size: 12px; color: #666;">Please login to your dashboard to Accept/Decline this request.</p>
            </div>
        """
    }
    requests.post(url, json=payload, headers=headers)

# 2. Function: Send Cooldown Completion Reminder
def send_cooldown_completion_email(donor_email, donor_name):
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {"accept": "application/json", "api-key": BREVO_API_KEY, "content-type": "application/json"}
    
    payload = {
        "sender": {"name": "LifeDrop AI", "email": SENDER_EMAIL},
        "to": [{"email": donor_email}],
        "subject": "Hero, You are Eligible to Donate Again! 🎖️",
        "htmlContent": f"""
            <div style="font-family: sans-serif; padding: 20px; text-align: center; background: #f0fdf4; border-radius: 20px;">
                <h2 style="color: #16a34a;">Welcome Back, Hero!</h2>
                <p>Hello <b>{donor_name}</b>, your 90-day recovery period is officially complete.</p>
                <div style="font-size: 50px;">🩸</div>
                <p>Your body is ready to save another life. Your status is now <b>ACTIVE</b> on the LifeDrop map.</p>
                <p>Thank you for being a part of this mission.</p>
            </div>
        """
    }
    requests.post(url, json=payload, headers=headers)

def init_inventory():
    groups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
    for g in groups:
        exists = BloodInventory.query.filter_by(blood_group=g).first()
        if not exists:
            db.session.add(BloodInventory(blood_group=g, units=0))
    db.session.commit()

with app.app_context():
    db.create_all()
    init_inventory()

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2) * math.sin(dLat/2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon/2) * math.sin(dLon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def generate_unique_id(model):
    while True:
        new_id = ''.join(random.choices(string.digits, k=4))
        exists = model.query.filter_by(unique_id=new_id).first()
        if not exists:
            return new_id

def calculate_hash(index, prev_hash, timestamp, data):
    value = str(index) + str(prev_hash) + str(timestamp) + str(data)
    return hashlib.sha256(value.encode()).hexdigest()

def add_blockchain_block(request_id, event, data_dict):
    last_block = BlockchainLedger.query.order_by(BlockchainLedger.id.desc()).first()
    prev_hash = last_block.current_hash if last_block else "0"
    
    timestamp = datetime.utcnow()
    data_json = json.dumps(data_dict)
    
    # Generate new hash
    new_index = (last_block.id + 1) if last_block else 1
    new_hash = calculate_hash(new_index, prev_hash, timestamp, data_json)
    
    new_block = BlockchainLedger(
        request_id=request_id,
        event=event,
        data=data_json,
        previous_hash=prev_hash,
        current_hash=new_hash,
        timestamp=timestamp
    )
    db.session.add(new_block)
    db.session.commit()

@app.route('/')
def home():
    return jsonify({
        "status": "online",
        "message": "LifeDrop Backend is running 🚀",
        "version": "1.0.0"
    }), 200
            
@app.route('/register/donor', methods=['POST'])
@limiter.limit("10 per 10 minutes")
def register_donor():
    data = request.json
    u_id = generate_unique_id(Donor)
    hashed_pw = generate_password_hash(data['password'], method='pbkdf2:sha256')
    new_donor = Donor(
        unique_id=u_id,
        full_name=data['fullName'],
        phone=data['phone'],
        email=data['email'],
        password=hashed_pw,
        blood_group=data['bloodGroup'],
        dob=data['dob'],
        lat=data['lat'],
        lng=data['lng'],
        health_score=data['healthScore'] 
    )
    db.session.add(new_donor)
    db.session.commit()
    return jsonify({"message": "Donor Registered Successfully", "unique_id": u_id}), 201

@app.route('/register/requester', methods=['POST'])
@limiter.limit("10 per 10 minutes")
def register_requester():
    data = request.json
    # UNIQUE ID GENERATION MUKKIYAM
    u_id = generate_unique_id(Requester) 
    
    hashed_pw = generate_password_hash(data['password'], method='pbkdf2:sha256')
    
    new_req = Requester(
        unique_id=u_id, # ID inga save aaganum
        full_name=data['fullName'],
        phone=data['phone'],
        email=data['email'],
        password=hashed_pw
    )
    db.session.add(new_req)
    db.session.commit()
    return jsonify({"message": "Success", "unique_id": u_id}), 201

# 1. API to Generate & Send OTP (Database logic)
@app.route('/api/verify/send-otp', methods=['POST'])
@limiter.limit("10 per 10 minutes")
def send_otp_request():
    data = request.json
    email = data.get('email')
    otp_code = str(random.randint(1000, 9999)) # 4 Digit OTP

    try:
        # DB-la intha email-ku already OTP irundha delete pannuvom (Clean up)
        OTPVerification.query.filter_by(email=email).delete()
        
        # Pudhusa OTP-ah database-la save panroam
        new_entry = OTPVerification(email=email, otp=otp_code)
        db.session.add(new_entry)
        db.session.commit()

        # Email anuppuvom
        Thread(target=send_brevo_otp, args=(email, otp_code)).start()
        
        return jsonify({"message": "OTP sent to your email!"}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "Internal Server Error"}), 500

# 2. API to Verify OTP (Database logic)
@app.route('/api/check-otp', methods=['POST'])
@limiter.limit("10 per 10 minutes")
def check_otp_request():
    data = request.json
    email = data.get('email')
    user_otp = data.get('otp')

    # Session-ah check pannaama direct-ah DATABASE-la check panroam
    record = OTPVerification.query.filter_by(email=email, otp=user_otp).first()

    print(f"Checking DB for Email: {email} | User Input: {user_otp}")

    if record:
        # OTP correct! Register panna allow pannuvom. 
        # Safety-ku verify aana OTP-ah DB-lendhu thookidalam
        db.session.delete(record)
        db.session.commit()
        return jsonify({"success": True}), 200
    else:
        # Database-la match aagalana...
        return jsonify({"success": False, "message": "Invalid or Expired OTP!"}), 400

@app.route('/login', methods=['POST'])
@limiter.limit("10 per 10 minutes")
def login():
    data = request.json
    email = data['email']
    password = data['password']
    if email == "lifedrop108@gmail.com" and password == "lifedrop123":
        return jsonify({
            "message": "Admin Login Success",
            "user": {
                "name": "Super Admin",
                "email": email,
                "role": "admin",
                "unique_id": "ADMIN"
            }
        }), 200    
    role = data['role']
    user = None
    if role == 'donor':
        user = Donor.query.filter_by(email=email).first()
    else:
        user = Requester.query.filter_by(email=email).first()
    if user and check_password_hash(user.password, password):
        return jsonify({
            "message": "Login Success",
            "user": {
                "name": user.full_name,
                "email": user.email,
                "role": role,
                "unique_id": user.unique_id,  
                "bloodGroup": user.blood_group if role == 'donor' else "" 
            }
        }), 200
    
    return jsonify({"message": "Invalid Credentials"}), 401

@app.route('/api/donor/<u_id>', methods=['GET'])
def get_donor_by_id(u_id):
    donor = Donor.query.filter_by(unique_id=u_id).first()
    if donor:
        return jsonify({
            "id": donor.unique_id,
            "name": donor.full_name,
            "bloodGroup": donor.blood_group,
            "healthScore": donor.health_score,
            "phone": donor.phone,
            "dob": donor.dob,
            "email": donor.email,
            "status": "Verified",
            "location": {"lat": donor.lat, "lng": donor.lng}
        })
    return jsonify({"message": "Not Found"}), 404

@app.route('/api/requester/history/<u_id>', methods=['GET'])
def get_request_history(u_id):
    requests = BloodRequest.query.filter_by(requester_id=u_id).order_by(BloodRequest.timestamp.desc()).all()
    output = []
    for r in requests:
        # Intha request-ah accept panna donor details-ah edukuroam
        donor_info = None
        # Check if any donor accepted this request
        accepted_notif = Notification.query.filter_by(request_id=r.id).filter(Notification.status.in_(['Accepted', 'Donated', 'Completed'])).first()
        
        if accepted_notif:
            donor = Donor.query.filter_by(unique_id=accepted_notif.donor_id).first()
            if donor:
                donor_info = {
                    "name": donor.full_name,
                    "phone": donor.phone, # Reveal the full number here!
                    "status": accepted_notif.status
                }

        output.append({
            "id": r.id,
            "bloodGroup": r.blood_group,
            "status": r.status,
            "patient": r.patient_name,
            "hospital": r.hospital,
            "date": r.timestamp.strftime("%d %b, %Y"),
            "accepted_donor": donor_info # Intha data-va sethu anupuroam
        })
    return jsonify(output)
    
@app.route('/api/donor/notifications/<blood_group>', methods=['GET'])
def get_donor_notifications(blood_group):
    requests = BloodRequest.query.filter_by(blood_group=blood_group, status='Pending').all()
    output = []
    for r in requests:
        req_user = Requester.query.filter_by(unique_id=r.requester_id).first()
        output.append({
            "id": r.id,
            "patient": r.patient_name,
            "hospital": r.hospital,
            "phone": req_user.phone if req_user else "N/A",
            "date": r.timestamp.strftime("%I:%M %p")
        })
    return jsonify(output)    

@app.route('/api/request/create', methods=['POST'])
def create_request():
    data = request.json
    new_req = BloodRequest(
        requester_id=data['requester_id'],
        patient_name=data['patientName'],
        contact_number=data['contactNumber'],
        blood_group=data['bloodGroup'],
        units=data['units'],
        urgency=data['urgency'],
        hospital=data['hospital'],
        lat=data['lat'],
        lng=data['lng']
    )
    db.session.add(new_req)
    db.session.commit()
    add_blockchain_block(new_req.id, "Request Initialized", {"patient": data['patientName'], "group": data['bloodGroup'], "hospital": data['hospital']})
    return jsonify({"message": "Request Created Successfully", "id": new_req.id}), 201

BLOOD_COMPATIBILITY = {
    "A+": ["A+", "A-", "O+", "O-"],
    "A-": ["A-", "O-"],
    "B+": ["B+", "B-", "O+", "O-"],
    "B-": ["B-", "O-"],
    "AB+": ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"], # Universal Receiver
    "AB-": ["A-", "B-", "O-", "AB-"],
    "O+": ["O+", "O-"],
    "O-": ["O-"]
}

@app.route('/api/match-donors/<int:request_id>', methods=['GET'])
def match_donors(request_id):
    req = BloodRequest.query.get(request_id)
    if not req: 
        return jsonify({"message": "Not Found"}), 404
    
    # 1. Fetch allowed donor groups (Science logic)
    # Global BLOOD_COMPATIBILITY dictionary use aagum
    allowed_donor_groups = BLOOD_COMPATIBILITY.get(req.blood_group, [req.blood_group])

    # 2. 90-Days Cooldown Limit
    cooldown_limit = datetime.utcnow() - timedelta(days=90)
    
    # 3. Filter Query (Compatible + Active)
    donors = Donor.query.filter(
        Donor.blood_group.in_(allowed_donor_groups),
        Donor.blood_group.in_(allowed_donor_groups),
        Donor.is_available == True,
        (Donor.last_donation_date == None) | (Donor.last_donation_date <= cooldown_limit)
    ).all()

    matches = []
    for d in donors:
        # --- DATA MASKING (Privacy Logic) ---
        raw_phone = d.phone
        # Example: 98******21
        masked_phone = raw_phone[:2] + "******" + raw_phone[-2:] if len(raw_phone) > 4 else raw_phone

        # Distance calculation
        dist = calculate_distance(req.lat, req.lng, d.lat, d.lng)
        dist_score = max(0, 100 - (dist * 2)) 
        
        # Match percentage logic
        is_exact = (d.blood_group == req.blood_group)
        match_percent = (dist_score * 0.6) + (d.health_score * 0.4)
        if is_exact: 
            match_percent += 5 # Bonus for exact match
        
        # Final Score Cap to 100
        final_match = min(round(match_percent), 100)

        matches.append({
            "unique_id": d.unique_id,
            "name": d.full_name,
            "distance": round(dist, 1),
            "healthScore": d.health_score,
            "match": final_match,
            "phone": masked_phone, # FIX: Added missing quote
            "blood": d.blood_group, 
            "lat": d.lat,
            "lng": d.lng,
            "isExact": is_exact
        })

    # Sort: Best match on top
    matches = sorted(matches, key=lambda x: x['match'], reverse=True)
    return jsonify({
        "request": {"lat": req.lat, "lng": req.lng, "blood": req.blood_group}, 
        "matches": matches
    })

@app.route('/api/send-request', methods=['POST'])
def send_notification():
    data = request.json
    exists = Notification.query.filter_by(donor_id=data['donor_id'], request_id=data['request_id']).first()
    if not exists:
        new_notif = Notification(donor_id=data['donor_id'], request_id=data['request_id'])
        db.session.add(new_notif)
        donor = Donor.query.filter_by(unique_id=data['donor_id']).first()
        req = BloodRequest.query.get(data['request_id'])
        requester = Requester.query.filter_by(unique_id=req.requester_id).first()
        
        req_details = {
            "patient": req.patient_name,
            "blood": req.blood_group,
            "hospital": req.hospital,
            "requester": requester.full_name,
            "phone": req.contact_number
        }
        
        # Async-ah mail anupuvom
        Thread(target=send_request_alert_email, args=(donor.email, donor.full_name, req_details)).start()
        db.session.commit()
        return jsonify({"message": "Request sent successfully!"}), 201
    return jsonify({"message": "Request already sent to this donor"}), 200

@app.route('/api/donor/profile-stats/<u_id>', methods=['GET'])
def get_donor_stats(u_id):
    donor = Donor.query.filter_by(unique_id=u_id).first()
    if not donor:
        return jsonify({"message": "Donor not found"}), 404

    days_remaining = 0
    is_resting = False # Medical Rest

    # 1. Medical Cooldown Calculation
    if donor.last_donation_date:
        # Time difference calculate panroam
        delta = datetime.utcnow() - donor.last_donation_date
        days_passed = delta.days
        
        if days_passed < 90:
            days_remaining = 90 - days_passed
            is_resting = True

    # 2. Final Response
    return jsonify({
        "donation_count": donor.donation_count,
        "is_available": donor.is_available, # Manual Toggle (DB-la irunthu)
        "days_remaining": days_remaining,    # Cooldown days
        "is_resting": is_resting            # True if donor is in 90-days rest
    })

@app.route('/api/donor/toggle-status/<u_id>', methods=['POST'])
def toggle_donor_status(u_id):
    donor = Donor.query.filter_by(unique_id=u_id).first()
    if donor:
        # Toggle current status
        donor.is_available = not donor.is_available
        db.session.commit()
        return jsonify({
            "message": "Status Updated", 
            "is_available": donor.is_available
        }), 200
    return jsonify({"message": "Donor not found"}), 404

@app.route('/api/donor/targeted-alerts/<u_id>', methods=['GET'])
def get_targeted_alerts(u_id):
    # Logged-in donor-ku vandha notifications mattum edukkurom
    notifs = Notification.query.filter_by(donor_id=u_id).all()
    output = []
    
    for n in notifs:
        r = BloodRequest.query.get(n.request_id)
        if r:
            output.append({
                "notif_id": n.id,
                "request_id": r.id,
                "patient": r.patient_name,
                "hospital": r.hospital,
                "blood": r.blood_group,
                "urgency": r.urgency,
                "phone": r.contact_number, # Dashboard-la call panna idhu venum
                "status": n.status,
                "date": r.timestamp.strftime("%d %b %Y") 
            })
    return jsonify(output)

# 1. API to Accept/Decline Request
@app.route('/api/notif/respond', methods=['POST'])
def respond_to_request():
    data = request.json
    notif = Notification.query.get(data['notif_id'])
    if notif:
        notif.status = data['status'] # 'Accepted' or 'Declined'
        # Update main blood request status too
        req = BloodRequest.query.get(notif.request_id)
        if data['status'] == 'Accepted':
            req.status = 'Accepted'
        elif data['status'] == 'Declined':
            req.status = 'Rejected'
        add_blockchain_block(notif.request_id, "Donor Accepted Request", {"donor_id": notif.donor_id, "time": str(datetime.utcnow())})    
        db.session.commit()
        return jsonify({"message": f"Request {data['status']}"})
    return jsonify({"message": "Not found"}), 404
    
@app.route('/api/notif/donate', methods=['POST'])
def submit_donation():
    data = request.json
    notif = Notification.query.get(data['notif_id'])
    if notif:
        notif.status = 'Donated'
        notif.blood_bag_id = data['bag_id']
        
        # DONOR COOL DOWN STARTS HERE
        donor = Donor.query.filter_by(unique_id=notif.donor_id).first()
        donor.last_donation_date = datetime.utcnow()
        donor.donation_count += 1
        
        req = BloodRequest.query.get(notif.request_id)
        req.status = 'On the way'
        add_blockchain_block(notif.request_id, "Blood Bag Dispatched", {"bag_id": data['bag_id'], "donor": donor.full_name})
        db.session.commit()
        return jsonify({"message": "Donation Success!"})

@app.route('/api/request/complete/<int:req_id>', methods=['POST'])
def complete_request(req_id):
    req = BloodRequest.query.get(req_id)
    if req:
        # 1. Update main request status
        req.status = 'Completed'
        notifs = Notification.query.filter_by(request_id=req_id).all()
        for n in notifs:
            n.status = 'Completed'
        add_blockchain_block(req_id, "Blood Received & Process Completed", {"status": "Life Saved ✅"})
        db.session.commit()
        return jsonify({"message": "Process Completed!"})
    return jsonify({"message": "Error"}), 404
    
@app.route('/api/admin/stats', methods=['GET'])
def get_admin_stats():
    # Real-time monitoring data
    total_donors = Donor.query.count()
    total_requesters = Requester.query.count()
    total_requests = BloodRequest.query.count()
    pending_requests = BloodRequest.query.filter_by(status='Pending').count()
    completed_requests = BloodRequest.query.filter_by(status='Completed').count()
    
    # Recent requests monitoring
    recent_reqs = BloodRequest.query.order_by(BloodRequest.timestamp.desc()).limit(10).all()
    recent_data = []
    for r in recent_reqs:
        recent_data.append({
            "id": r.id,
            "patient": r.patient_name,
            "blood": r.blood_group,
            "status": r.status,
            "hospital": r.hospital
        })
        
    return jsonify({
        "stats": {
            "donors": total_donors,
            "requesters": total_requesters,
            "total_reqs": total_requests,
            "pending": pending_requests,
            "completed": completed_requests
        },
        "recent": recent_data
    })    

# 1. Total Users (Donors + Requesters Combined)
@app.route('/api/admin/all-users', methods=['GET'])
def get_all_users():
    donors = Donor.query.all()
    requesters = Requester.query.all()
    
    users = []
    for d in donors:
        users.append({"name": d.full_name, "email": d.email, "role": "Donor", "phone": d.phone})
    for r in requesters:
        users.append({"name": r.full_name, "email": r.email, "role": "Requester", "phone": r.phone})
        
    return jsonify(users)

# 2. Detailed Donors
@app.route('/api/admin/donors-detailed', methods=['GET'])
def get_donors_detailed():
    donors = Donor.query.all()
    output = []
    cooldown_limit = datetime.utcnow() - timedelta(days=90)
    
    for d in donors:
        is_active = True if (d.last_donation_date == None or d.last_donation_date <= cooldown_limit) else False
        output.append({
            "id": d.id, "u_id": d.unique_id, "name": d.full_name, "email": d.email,
            "blood": d.blood_group, "donations": d.donation_count, "health": d.health_score,
            "phone": d.phone, "location": f"{d.lat:.2f}, {d.lng:.2f}",
            "status": "Active" if is_active else "Inactive"
        })
    return jsonify(output)

@app.route('/api/admin/requests-detailed', methods=['GET'])
def get_requests_detailed():
    req_type = request.args.get('type')
    
    if req_type == 'active':
        requests = BloodRequest.query.filter(BloodRequest.status != 'Completed').all()
    else:
        requests = BloodRequest.query.filter_by(status='Completed').all()
        
    output = []
    for r in requests:
        req_user = Requester.query.filter_by(unique_id=r.requester_id).first()
        
        # --- DONOR NAME LOGIC FOR COMPLETED REQUESTS ---
        donor_name = "N/A"
        if req_type == 'completed':
            # Intha request-ah accept panni complete panna donor-ah find panroam
            success_notif = Notification.query.filter_by(request_id=r.id, status='Completed').first()
            if success_notif:
                donor_user = Donor.query.filter_by(unique_id=success_notif.donor_id).first()
                if donor_user:
                    donor_name = donor_user.full_name
        
        output.append({
            "id": r.id, 
            "patient": r.patient_name, 
            "blood": r.blood_group,
            "requester": req_user.full_name if req_user else "N/A",
            "donor": donor_name, # INTHA LINE ADD AAGUDHU
            "hospital": r.hospital, 
            "phone": r.contact_number, 
            "status": r.status
        })
    return jsonify(output)

@app.route('/api/admin/broadcast', methods=['POST'])
def create_broadcast():
    data = request.json
    new_msg = Broadcast(message=data['message'])
    db.session.add(new_msg)
    db.session.commit()
    return jsonify({"message": "Broadcast sent successfully!"}), 201
    
@app.route('/api/broadcasts', methods=['GET'])
def get_broadcasts():
    msgs = Broadcast.query.order_by(Broadcast.timestamp.desc()).all()
    return jsonify([{"id": m.id, "message": m.message} for m in msgs])

# 4. API to Delete Broadcast
@app.route('/api/broadcast/delete/<int:id>', methods=['DELETE'])
def delete_broadcast(id):
    msg = Broadcast.query.get(id)
    if msg:
        db.session.delete(msg)
        db.session.commit()
        return jsonify({"message": "Broadcast deleted!"})
    return jsonify({"message": "Not found"}), 404    

@app.route('/api/admin/inventory', methods=['GET'])
def get_inventory():
    inventory = BloodInventory.query.all()
    return jsonify([{"group": i.blood_group, "units": i.units, "updated": i.last_updated.strftime("%d %b, %H:%M")} for i in inventory])

@app.route('/api/admin/inventory/update', methods=['POST'])
def update_inventory():
    data = request.json 
    item = BloodInventory.query.filter_by(blood_group=data['group']).first()
    if item:
        if data['action'] == 'add':
            item.units += 1
        elif data['action'] == 'sub' and item.units > 0:
            item.units -= 1
        db.session.commit()
        return jsonify({"message": "Inventory updated!"})
    return jsonify({"message": "Group not found"}), 404
    
@app.route('/api/admin/analytics', methods=['GET'])
def get_analytics():
    groups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
    
    # Donor Distribution
    donor_stats = db.session.query(Donor.blood_group, db.func.count(Donor.id)).group_by(Donor.blood_group).all()
    donor_map = {g: 0 for g in groups}
    for g, count in donor_stats: donor_map[g] = count

    # Request Distribution
    req_stats = db.session.query(BloodRequest.blood_group, db.func.count(BloodRequest.id)).group_by(BloodRequest.blood_group).all()
    req_map = {g: 0 for g in groups}
    for g, count in req_stats: req_map[g] = count

    # Success (Saves) Distribution
    save_stats = db.session.query(BloodRequest.blood_group, db.func.count(BloodRequest.id)).filter_by(status='Completed').group_by(BloodRequest.blood_group).all()
    save_map = {g: 0 for g in groups}
    for g, count in save_stats: save_map[g] = count

    return jsonify({
        "labels": groups,
        "donors": [donor_map[g] for g in groups],
        "requests": [req_map[g] for g in groups],
        "saves": [save_map[g] for g in groups],
        "total_donors": Donor.query.count(),
        "total_requests": BloodRequest.query.count(),
        "total_saves": BloodRequest.query.filter_by(status='Completed').count()
    })

# 2. Create Camp API
@app.route('/api/admin/camps/create', methods=['POST'])
def create_camp():
    data = request.json
    new_camp = BloodCamp(
        title=data['title'],
        location=data['location'],
        city=data['city'],
        date=data['date'],
        time=data['time']
    )
    db.session.add(new_camp)
    
    # Optional: Automatically create a broadcast message too!
    broadcast_msg = f"New Donation Camp: {data['title']} at {data['city']} on {data['date']}"
    db.session.add(Broadcast(message=broadcast_msg))
    
    db.session.commit()
    return jsonify({"message": "Donation Camp Scheduled Successfully!"}), 201

# 3. Get All Camps API
@app.route('/api/camps/all', methods=['GET'])
def get_all_camps():
    camps = BloodCamp.query.order_by(BloodCamp.date.asc()).all()
    return jsonify([{
        "id": c.id, "title": c.title, "location": c.location,
        "city": c.city, "date": c.date, "time": c.time, "organizer": c.organizer
    } for c in camps])

# 4. Delete Camp API
@app.route('/api/admin/camps/delete/<int:id>', methods=['DELETE'])
def delete_camp(id):
    camp = BloodCamp.query.get(id)
    if camp:
        db.session.delete(camp)
        db.session.commit()
        return jsonify({"message": "Camp deleted!"})
    return jsonify({"message": "Not found"}), 404

@app.route('/api/chat', methods=['POST'])
def chat_with_ai():
    user_msg = request.json.get("message", "")
    
    # 1. Fetch Inventory Context
    inventory = BloodInventory.query.all()
    stock_info = ", ".join([f"{i.blood_group}: {i.units} units" for i in inventory])

    # 2. Advanced System Instructions
    prompt_context = f"""
    System: You are 'LifeDrop AI Assistant'.
    Inventory Data: {stock_info}.
    
    Strict Rules:
    - Only answer health, blood donation, or LifeDrop app related queries.
    - If user asks about blood stock, use the provided Inventory Data.
    - For non-medical/off-topic questions, say: 'I am a specialized Blood Donation Assistant. I only handle health-related queries.'
    - Support Tamil and English. Answer in the user's language.
    - Guidance for donation: Tell them to go to 'Become a Donor'.
    - Guidance for requesting: Tell them to use 'New Request'.
    """

    # 3. Payload for Gemini API
    payload = {
        "contents": [{
            "parts": [{"text": f"{prompt_context}\n\nUser Question: {user_msg}"}]
        }]
    }

    try:
        # Direct REST API Call (No heavy libraries needed)
        response = requests.post(GEMINI_URL, json=payload)
        res_data = response.json()
        
        # Gemini logic to extract text
        bot_reply = res_data['candidates'][0]['content']['parts'][0]['text']
        return jsonify({"reply": bot_reply})
        
    except Exception as e:
        print(f"AI Error: {e}")
        return jsonify({"reply": "Sorry nanba, I'm having trouble connecting to AI. Please try again."}), 500

@app.route('/api/blockchain/view/<int:req_id>', methods=['GET'])
def get_chain(req_id):
    # Specific Request-oda full history (Blockchain view)
    blocks = BlockchainLedger.query.filter_by(request_id=req_id).all()
    output = []
    for b in blocks:
        output.append({
            "event": b.event,
            "data": json.loads(b.data),
            "prev_hash": b.previous_hash[:16] + "...",
            "curr_hash": b.current_hash[:16] + "...",
            "time": b.timestamp.strftime("%d %b %Y, %I:%M %p")
        })
    return jsonify(output)

@app.route('/api/admin/check-cooldowns', methods=['GET'])
def check_donor_cooldowns():
    cooldown_limit = datetime.utcnow() - timedelta(days=90)
    # 90 days mudinju, aana innum reminder mail anupatha donors
    eligible_donors = Donor.query.filter(
        Donor.last_donation_date <= cooldown_limit,
        Donor.cooldown_email_sent == False
    ).all()

    for d in eligible_donors:
        Thread(target=send_cooldown_completion_email, args=(d.email, d.full_name)).start()
        d.cooldown_email_sent = True # Mail anupiyaachu nu mark panroam
    
    db.session.commit()
    return jsonify({"message": f"Sent {len(eligible_donors)} reminders!"})

# --- API to Handle User Contact/Suggestions ---
@app.route('/api/contact', methods=['POST'])
def handle_contact_form():
    data = request.json
    user_name = data.get('name')
    user_email = data.get('email')
    user_msg = data.get('message')

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }
    
    # Admin-ku anuppa pora content
    payload = {
        "sender": {"name": "LifeDrop System", "email": SENDER_EMAIL},
        "to": [{"email": "lifedrop108@gmail.com"}], # Admin Mail
        "subject": f"New User Suggestion from {user_name}",
        "htmlContent": f"""
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #dc2626;">New Message Received 📩</h2>
                <p><b>User Name:</b> {user_name}</p>
                <p><b>User Email:</b> {user_email}</p>
                <hr/>
                <p><b>Message/Suggestion:</b></p>
                <p style="background: #f9fafb; padding: 15px; border-radius: 8px;">{user_msg}</p>
            </div>
        """
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code <= 202:
            return jsonify({"message": "Message sent to Admin!"}), 200
        else:
            return jsonify({"message": "Error sending mail"}), 500
    except Exception as e:
        return jsonify({"message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)