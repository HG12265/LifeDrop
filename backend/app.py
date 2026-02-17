from flask import Flask, request, jsonify, session
from flask_cors import CORS
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from flask_pymongo import PyMongo
from bson import ObjectId, json_util
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
import re
import dns.resolver

if os.path.exists('/data/data/com.termux'):
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
    dns.resolver.default_resolver.nameservers = ['8.8.8.8']
    print("📱 Termux DNS Fix Applied")
else:
    print("🌐 Running on Production Server (Render)")

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")
CORS(app, supports_credentials=True)
app.config.update(
    SESSION_COOKIE_SAMESITE='None',
    SESSION_COOKIE_SECURE=False
)

Talisman(app, content_security_policy=None, force_https=False)

BREVO_API_KEY = os.getenv("BREVO_API_KEY") 
SENDER_EMAIL = "lifedrop108@gmail.com"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"

# MongoDB Configuration
MONGO_URI = os.getenv("MONGODB_URI")

if not MONGO_URI:
    print("❌ ERROR: MONGODB_URI is not set in environment variables!")
else:
    print("🌐 Attempting to connect to MongoDB Atlas...")

app.config["MONGO_URI"] = MONGO_URI
mongo = PyMongo(app)

def jsonify_mongo(data):
    return json.loads(json_util.dumps(data))

# MongoDB Collections
def get_collection(name):
    return mongo.db[name]

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        "success": False,
        "message": "Too many attempts! You are blocked for 10 minutes for security reasons."
    }), 429

def check_login_block(ip_address):
    attempts_col = get_collection('login_attempts')
    now = datetime.utcnow()

    # 1. Check if user is currently blocked
    record = attempts_col.find_one({"ip": ip_address})
    
    if record and record.get('blocked_until'):
        if now < record['blocked_until']:
            remaining_time = int((record['blocked_until'] - now).total_seconds() / 60)
            return False, f"Too many attempts! You are blocked. Try again after {remaining_time} minutes."
        else:
            # Block time mudinjiduchi, so reset panroam
            attempts_col.delete_one({"ip": ip_address})

    return True, None

def log_failed_attempt(ip_address):
    attempts_col = get_collection('login_attempts')
    now = datetime.utcnow()
    three_mins_ago = now - timedelta(minutes=3)

    record = attempts_col.find_one({"ip": ip_address})

    if not record:
        # First time attempt
        attempts_col.insert_one({
            "ip": ip_address,
            "count": 1,
            "first_attempt": now,
            "blocked_until": None
        })
    else:
        # Check if the attempts are within 3 minutes
        if record['first_attempt'] > three_mins_ago:
            new_count = record['count'] + 1
            if new_count >= 3:
                # 3 attempts mudinjiduchi! 10 mins block panroam
                attempts_col.update_one(
                    {"ip": ip_address},
                    {"$set": {"count": new_count, "blocked_until": now + timedelta(minutes=10)}}
                )
            else:
                attempts_col.update_one(
                    {"ip": ip_address},
                    {"$inc": {"count": 1}}
                )
        else:
            # 3 mins mela aayiduchi, so fresh-ah start panroam
            attempts_col.update_one(
                {"ip": ip_address},
                {"$set": {"count": 1, "first_attempt": now, "blocked_until": None}}
            )

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
            print(f"✅ OTP Sent Successfully")
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
    inventory_collection = get_collection('blood_inventory')
    for g in groups:
        exists = inventory_collection.find_one({"blood_group": g})
        if not exists:
            inventory_collection.insert_one({
                "blood_group": g,
                "units": 0,
                "last_updated": datetime.utcnow()
            })

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2) * math.sin(dLat/2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon/2) * math.sin(dLon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def generate_unique_id(collection_name):
    while True:
        new_id = ''.join(random.choices(string.digits, k=4))
        collection = get_collection(collection_name)
        exists = collection.find_one({"unique_id": new_id})
        if not exists:
            return new_id

def calculate_hash(index, prev_hash, timestamp, data):
    value = str(index) + str(prev_hash) + str(timestamp) + str(data)
    return hashlib.sha256(value.encode()).hexdigest()

def add_blockchain_block(request_id, event, data_dict):
    blockchain_collection = get_collection('blockchain_ledger')
    last_block = blockchain_collection.find_one(sort=[("_id", -1)])
    
    prev_hash = last_block["current_hash"] if last_block else "0"
    
    timestamp = datetime.utcnow()
    data_json = json.dumps(data_dict)
    
    new_index = (last_block["index"] + 1) if last_block else 1
    new_hash = calculate_hash(new_index, prev_hash, timestamp, data_json)
    
    new_block = {
        "index": new_index,
        "request_id": str(request_id),  # ✅ Always store as string
        "event": event,
        "data": data_json,
        "previous_hash": prev_hash,
        "current_hash": new_hash,
        "timestamp": timestamp
    }
    
    blockchain_collection.insert_one(new_block)

@app.route('/')
def home():
    return jsonify({
        "status": "online",
        "message": "LifeDrop Backend is running 🚀",
        "version": "1.0.0",
        "database": "MongoDB"
    }), 200

@app.route('/register/donor', methods=['POST'])
@limiter.limit("10 per 10 minutes")
def register_donor():
    data = request.json
    donor_collection = get_collection('donors')
    requester_collection = get_collection('requesters')
    
    if donor_collection.find_one({"email": data['email']}) or requester_collection.find_one({"email": data['email']}):
        return jsonify({"message": "This email is already registered, you may login or use different email"}), 400
    
    u_id = generate_unique_id('donors')
    hashed_pw = generate_password_hash(data['password'], method='pbkdf2:sha256')
    
    new_donor = {
        "unique_id": u_id,
        "full_name": data['fullName'],
        "phone": data['phone'],
        "email": data['email'],
        "password": hashed_pw,
        "blood_group": data['bloodGroup'],
        "dob": data['dob'],
        "lat": data['lat'],
        "lng": data['lng'],
        "health_score": data['healthScore'],
        "last_donation_date": None,
        "donation_count": 0,
        "cooldown_email_sent": False,  # ✅ Initial value
        "is_available": True,
        "created_at": datetime.utcnow()
    }
    
    donor_collection.insert_one(new_donor)
    get_collection('otp_verification').delete_many({"email": data['email']})
    return jsonify({"message": "Donor Registered Successfully", "unique_id": u_id}), 201

@app.route('/register/requester', methods=['POST'])
@limiter.limit("10 per 10 minutes")
def register_requester():
    data = request.json
    requester_collection = get_collection('requesters')
    donor_collection = get_collection('donors')
    
    # Check if email exists
    if requester_collection.find_one({"email": data['email']}) or donor_collection.find_one({"email": data['email']}):
        return jsonify({"message": "This email is already registered, you may login or use different email"}), 400
    
    u_id = generate_unique_id('requesters')
    hashed_pw = generate_password_hash(data['password'], method='pbkdf2:sha256')
    
    new_requester = {
        "unique_id": u_id,
        "full_name": data['fullName'],
        "phone": data['phone'],
        "email": data['email'],
        "password": hashed_pw,
        "created_at": datetime.utcnow()
    }
    
    requester_collection.insert_one(new_requester)
    get_collection('otp_verification').delete_many({"email": data['email']})
    return jsonify({"message": "Success", "unique_id": u_id}), 201

@app.route('/api/verify/send-otp', methods=['POST'])
@limiter.limit("10 per 10 minutes")
def send_otp_request():
    data = request.json
    email = data.get('email')
    
    donor_collection = get_collection('donors')
    requester_collection = get_collection('requesters')
    
    user_exists = donor_collection.find_one({"email": email}) or requester_collection.find_one({"email": email})
    
    if user_exists:
        return jsonify({
            "success": False, 
            "message": "This email is already registered, you may login or use different email"
        }), 400
    
    otp_collection = get_collection('otp_verification')
    otp_code = str(random.randint(1000, 9999))
    
    try:
        otp_collection.delete_many({"email": email})
        otp_collection.insert_one({
            "email": email,
            "otp": otp_code,
            "timestamp": datetime.utcnow()
        })
        Thread(target=send_brevo_otp, args=(email, otp_code)).start()
        return jsonify({"message": "OTP sent to your email!"}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "Internal Server Error"}), 500

@app.route('/api/check-otp', methods=['POST'])
@limiter.limit("10 per 10 minutes")
def check_otp_request():
    data = request.json
    email = data.get('email')
    user_otp = data.get('otp')

    otp_collection = get_collection('otp_verification')
    record = otp_collection.find_one({"email": email, "otp": user_otp})

    print(f"Checking DB for Email: {email} | User Input: {user_otp}")

    if record:
        
        return jsonify({"success": True}), 200
    else:
        return jsonify({"success": False, "message": "Invalid or Expired OTP!"}), 400

@app.route('/login', methods=['POST'])
def login():
    ip_addr = get_remote_address() # User IP address
    
    # 1. Check if blocked
    is_allowed, block_msg = check_login_block(ip_addr)
    if not is_allowed:
        return jsonify({"success": False, "message": block_msg}), 429

    data = request.json
    email = data['email']
    password = data['password']
    
    # Admin Check
    if email == "lifedrop108@gmail.com" and password == "lifedrop123":
        return jsonify({"message": "Admin Login Success", "user": {"name": "Super Admin", "role": "admin", "unique_id": "ADMIN"}}), 200

    # User Check
    role = data['role']
    user_col = get_collection('donors' if role == 'donor' else 'requesters')
    user = user_col.find_one({"email": email})

    if user and check_password_hash(user['password'], password):
        # Login Success: Clear attempts
        get_collection('login_attempts').delete_one({"ip": ip_addr})
        
        response_data = {
            "message": "Login Success",
            "user": {"name": user['full_name'], "email": user['email'], "role": role, "unique_id": user['unique_id']}
        }
        if role == 'donor': response_data['user']['bloodGroup'] = user.get('blood_group', '')
        return jsonify(response_data), 200
    else:
        # Login Failed: Log the attempt
        log_failed_attempt(ip_addr)
        return jsonify({"message": "Invalid Credentials"}), 401

@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password_request():
    data = request.json
    email = data.get('email')

    donor_collection = get_collection('donors')
    requester_collection = get_collection('requesters')
    
    user = donor_collection.find_one({"email": email}) or requester_collection.find_one({"email": email})
    
    if not user:
        return jsonify({"message": "User with this email does not exist!"}), 404

    otp_code = str(random.randint(1000, 9999))
    otp_collection = get_collection('otp_verification')
    
    otp_collection.delete_many({"email": email})
    otp_collection.insert_one({
        "email": email,
        "otp": otp_code,
        "timestamp": datetime.utcnow()
    })

    Thread(target=send_brevo_otp, args=(email, otp_code)).start()
    
    return jsonify({"message": "Reset OTP sent to your email!"}), 200

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password_final():
    data = request.json
    email = data.get('email')
    otp = data.get('otp')
    new_password = data.get('new_password')

    # 1. OTP Verification (Database check)
    otp_collection = get_collection('otp_verification')
    record = otp_collection.find_one({"email": email, "otp": otp})
    
    if not record:
        return jsonify({"success": False, "message": "Invalid or Expired OTP!"}), 400

    # 2. Hash the new password
    hashed_password = generate_password_hash(new_password, method='pbkdf2:sha256')

    # 3. Try updating in Donors collection first
    donor_collection = get_collection('donors')
    # update_one returns a result object
    donor_result = donor_collection.update_one(
        {"email": email},
        {"$set": {"password": hashed_password}}
    ) 

    update_done = False

    # matched_count > 0 na donor table-la user irukaaru nu artham
    if donor_result.matched_count > 0:
        update_done = True
    else:
        # 4. Donor-la illana, Requester collection-la update panna try pannuvom
        requester_collection = get_collection('requesters')
        req_result = requester_collection.update_one(
            {"email": email},
            {"$set": {"password": hashed_password}}
        )
        if req_result.matched_count > 0:
            update_done = True

    # 5. Final Response logic
    if update_done:
        # Success: OTP-ah delete pannittu success message anupuvom
        otp_collection.delete_one({"_id": record["_id"]})
        return jsonify({"success": True, "message": "Password updated successfully!"}), 200
    else:
        # User rendu table-laiyume illana...
        return jsonify({"success": False, "message": "User account not found!"}), 404

@app.route('/api/donor/<u_id>', methods=['GET'])
def get_donor_by_id(u_id):
    donor_collection = get_collection('donors')
    donor = donor_collection.find_one({"unique_id": u_id})
    
    if donor:
        return jsonify({
            "id": donor['unique_id'],
            "name": donor['full_name'],
            "bloodGroup": donor['blood_group'],
            "healthScore": donor['health_score'],
            "phone": donor['phone'],
            "dob": donor['dob'],
            "email": donor['email'],
            "status": "Verified",
            "location": {"lat": donor['lat'], "lng": donor['lng']}
        })
    return jsonify({"message": "Not Found"}), 404

@app.route('/api/requester/history/<u_id>', methods=['GET'])
def get_request_history(u_id):
    blood_request_collection = get_collection('blood_requests')
    notification_collection = get_collection('notifications')
    donor_collection = get_collection('donors')
    
    requests = list(blood_request_collection.find(
        {"requester_id": u_id}
    ).sort("timestamp", -1))
    
    output = []
    for r in requests:
        donor_info = None
        
        # Check if any donor accepted this request
        accepted_notif = notification_collection.find_one({
            "request_id": r['_id'],
            "status": {"$in": ['Accepted', 'Donated', 'Completed']}
        })
        
        if accepted_notif:
            donor = donor_collection.find_one({"unique_id": accepted_notif['donor_id']})
            if donor:
                donor_info = {
                    "name": donor['full_name'],
                    "phone": donor['phone'],
                    "status": accepted_notif['status']
                }

        output.append({
            "id": str(r['_id']),
            "bloodGroup": r['blood_group'],
            "status": r['status'],
            "patient": r['patient_name'],
            "hospital": r['hospital'],
            "date": r['timestamp'].strftime("%d %b, %Y"),
            "accepted_donor": donor_info
        })
    
    return jsonify(output)

@app.route('/api/request/create', methods=['POST'])
def create_request():
    data = request.json
    blood_request_collection = get_collection('blood_requests')
    
    new_req = {
        "requester_id": data['requester_id'],
        "patient_name": data['patientName'],
        "contact_number": data['contactNumber'],
        "blood_group": data['bloodGroup'],
        "units": data['units'],
        "urgency": data['urgency'],
        "hospital": data['hospital'],
        "lat": data['lat'],
        "lng": data['lng'],
        "status": 'Pending',
        "timestamp": datetime.utcnow()
    }
    
    result = blood_request_collection.insert_one(new_req)
    request_id = str(result.inserted_id)
    
    add_blockchain_block(request_id, "Request Initialized", {
        "patient": data['patientName'],
        "group": data['bloodGroup'],
        "hospital": data['hospital']
    })
    
    return jsonify({"message": "Request Created Successfully", "id": request_id}), 201

BLOOD_COMPATIBILITY = {
    "A+": ["A+", "A-", "O+", "O-"],
    "A-": ["A-", "O-"],
    "B+": ["B+", "B-", "O+", "O-"],
    "B-": ["B-", "O-"],
    "AB+": ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    "AB-": ["A-", "B-", "O-", "AB-"],
    "O+": ["O+", "O-"],
    "O-": ["O-"]
}

@app.route('/api/match-donors/<request_id>', methods=['GET'])
def match_donors(request_id):
    blood_request_collection = get_collection('blood_requests')
    donor_collection = get_collection('donors')
    
    try:
        req = blood_request_collection.find_one({"_id": ObjectId(request_id)})
    except:
        return jsonify({"message": "Not Found"}), 404
    
    if not req:
        return jsonify({"message": "Not Found"}), 404
    
    allowed_donor_groups = BLOOD_COMPATIBILITY.get(req['blood_group'], [req['blood_group']])
    cooldown_limit = datetime.utcnow() - timedelta(days=90)
    
    # Build query for MongoDB 
    query = {
        "blood_group": {"$in": allowed_donor_groups},
        "is_available": True,
        "$or": [
            {"last_donation_date": None},
            {"last_donation_date": {"$lte": cooldown_limit}}
        ]
    }
    
    donors = list(donor_collection.find(query))
    
    matches = []
    for d in donors:
        raw_phone = d['phone']
        masked_phone = raw_phone[:2] + "******" + raw_phone[-2:] if len(raw_phone) > 4 else raw_phone

        dist = calculate_distance(req['lat'], req['lng'], d['lat'], d['lng'])
        dist_score = max(0, 100 - (dist * 2))
        
        is_exact = (d['blood_group'] == req['blood_group'])
        match_percent = (dist_score * 0.6) + (d['health_score'] * 0.4)
        if is_exact:
            match_percent += 5
        
        final_match = min(round(match_percent), 100)

        matches.append({
            "unique_id": d['unique_id'],
            "name": d['full_name'],
            "distance": round(dist, 1),
            "healthScore": d['health_score'],
            "match": final_match,
            "phone": masked_phone,
            "blood": d['blood_group'],
            "lat": d['lat'],
            "lng": d['lng'],
            "isExact": is_exact
        }) 

    matches = sorted(matches, key=lambda x: x['match'], reverse=True)
    return jsonify({
        "request": {"lat": req['lat'], "lng": req['lng'], "blood": req['blood_group']},
        "matches": matches
    })

@app.route('/api/send-request', methods=['POST'])
def send_notification():
    data = request.json
    notification_collection = get_collection('notifications')
    donor_collection = get_collection('donors')
    blood_request_collection = get_collection('blood_requests')
    requester_collection = get_collection('requesters')
    
    exists = notification_collection.find_one({
        "donor_id": data['donor_id'],
        "request_id": ObjectId(data['request_id'])
    })
    
    if not exists:
        new_notif = {
            "donor_id": data['donor_id'],
            "request_id": ObjectId(data['request_id']),
            "status": "Pending",
            "blood_bag_id": None,
            "created_at": datetime.utcnow()
        }
        
        notification_collection.insert_one(new_notif)
        
        donor = donor_collection.find_one({"unique_id": data['donor_id']})
        req = blood_request_collection.find_one({"_id": ObjectId(data['request_id'])})
        requester = requester_collection.find_one({"unique_id": req['requester_id']})
        
        req_details = {
            "patient": req['patient_name'],
            "blood": req['blood_group'],
            "hospital": req['hospital'],
            "requester": requester['full_name'] if requester else "N/A",
            "phone": req['contact_number']
        }
        
        Thread(target=send_request_alert_email, args=(donor['email'], donor['full_name'], req_details)).start()
        return jsonify({"message": "Request sent successfully!"}), 201
    
    return jsonify({"message": "Request already sent to this donor"}), 200

@app.route('/api/donor/profile-stats/<u_id>', methods=['GET'])
def get_donor_stats(u_id):
    donor_collection = get_collection('donors')
    donor = donor_collection.find_one({"unique_id": u_id})
    
    if not donor:
        return jsonify({"message": "Donor not found"}), 404

    days_remaining = 0
    is_resting = False

    if donor.get('last_donation_date'):
        delta = datetime.utcnow() - donor['last_donation_date']
        days_passed = delta.days
        
        if days_passed < 90:
            days_remaining = 90 - days_passed
            is_resting = True

    return jsonify({
        "donation_count": donor.get('donation_count', 0),
        "is_available": donor.get('is_available', True),
        "days_remaining": days_remaining,
        "is_resting": is_resting
    })

@app.route('/api/donor/toggle-status/<u_id>', methods=['POST'])
def toggle_donor_status(u_id):
    donor_collection = get_collection('donors')
    donor = donor_collection.find_one({"unique_id": u_id})
    
    if donor:
        new_status = not donor.get('is_available', True)
        donor_collection.update_one(
            {"unique_id": u_id},
            {"$set": {"is_available": new_status}}
        )
        
        return jsonify({
            "message": "Status Updated",
            "is_available": new_status
        }), 200
    
    return jsonify({"message": "Donor not found"}), 404

@app.route('/api/donor/targeted-alerts/<u_id>', methods=['GET'])
def get_targeted_alerts(u_id):
    notification_collection = get_collection('notifications')
    blood_request_collection = get_collection('blood_requests')
    
    notifs = list(notification_collection.find({"donor_id": u_id}))
    output = []
    
    for n in notifs:
        r = blood_request_collection.find_one({"_id": n['request_id']})
        if r:
            output.append({
                "notif_id": str(n['_id']),
                "request_id": str(r['_id']),
                "patient": r['patient_name'],
                "hospital": r['hospital'],
                "blood": r['blood_group'],
                "urgency": r['urgency'],
                "phone": r['contact_number'],
                "status": n['status'],
                "date": r['timestamp'].strftime("%d %b %Y")
            })
    
    return jsonify(output)

@app.route('/api/notif/respond', methods=['POST'])
def respond_to_request():
    data = request.json
    notification_collection = get_collection('notifications')
    blood_request_collection = get_collection('blood_requests')
    
    try:
        notif = notification_collection.find_one({"_id": ObjectId(data['notif_id'])})
    except:
        return jsonify({"message": "Not found"}), 404
    
    if notif:
        notification_collection.update_one(
            {"_id": notif['_id']},
            {"$set": {"status": data['status']}}
        )
        
        req = blood_request_collection.find_one({"_id": notif['request_id']})
        if req:
            if data['status'] == 'Accepted':
                new_status = 'Accepted'
            elif data['status'] == 'Declined':
                new_status = 'Rejected'
            else:
                new_status = req['status']
            
            blood_request_collection.update_one(
                {"_id": req['_id']},
                {"$set": {"status": new_status}}
            )
        
        add_blockchain_block(str(notif['request_id']), "Donor Accepted Request", {
            "donor_id": notif['donor_id'],
            "time": str(datetime.utcnow())
        })
        
        return jsonify({"message": f"Request {data['status']}"})
    
    return jsonify({"message": "Not found"}), 404

@app.route('/api/notif/donate', methods=['POST'])
def submit_donation():
    data = request.json
    notification_collection = get_collection('notifications')
    donor_collection = get_collection('donors')
    blood_request_collection = get_collection('blood_requests')
    
    try:
        notif = notification_collection.find_one({"_id": ObjectId(data['notif_id'])})
    except:
        return jsonify({"message": "Not found"}), 404
    
    if notif:
        notification_collection.update_one(
            {"_id": notif['_id']},
            {"$set": {
                "status": 'Donated',
                "blood_bag_id": data['bag_id']
            }}
        )
        
        donor = donor_collection.find_one({"unique_id": notif['donor_id']})
        if donor:
            donor_collection.update_one(
                {"unique_id": notif['donor_id']},
                {"$set": {
                    "last_donation_date": datetime.utcnow(),
                    "cooldown_email_sent": False  # ✅ RESET THE EMAIL FLAG HERE!
                },
                "$inc": {"donation_count": 1}}
            )
        
        blood_request_collection.update_one(
            {"_id": notif['request_id']},
            {"$set": {"status": 'On the way'}}
        )
        
        add_blockchain_block(str(notif['request_id']), "Blood Bag Dispatched", {
            "bag_id": data['bag_id'],
            "donor": donor['full_name'] if donor else "Unknown"
        })
        
        return jsonify({"message": "Donation Success!"})
    
    return jsonify({"message": "Not found"}), 404

@app.route('/api/request/complete/<req_id>', methods=['POST'])
def complete_request(req_id):
    blood_request_collection = get_collection('blood_requests')
    notification_collection = get_collection('notifications')
    
    try:
        req = blood_request_collection.find_one({"_id": ObjectId(req_id)})
    except:
        return jsonify({"message": "Error"}), 404
    
    if req:
        blood_request_collection.update_one(
            {"_id": req['_id']},
            {"$set": {"status": 'Completed'}}
        )
        
        notification_collection.update_many(
            {"request_id": req['_id']},
            {"$set": {"status": 'Completed'}}
        )
        
        add_blockchain_block(req_id, "Blood Received & Process Completed", {
            "status": "Life Saved ✅"
        })
        
        return jsonify({"message": "Process Completed!"})
    
    return jsonify({"message": "Error"}), 404

@app.route('/api/admin/stats', methods=['GET'])
def get_admin_stats():
    donor_collection = get_collection('donors')
    requester_collection = get_collection('requesters')
    blood_request_collection = get_collection('blood_requests')
    
    total_donors = donor_collection.count_documents({})
    total_requesters = requester_collection.count_documents({})
    total_requests = blood_request_collection.count_documents({})
    pending_requests = blood_request_collection.count_documents({"status": 'Pending'})
    completed_requests = blood_request_collection.count_documents({"status": 'Completed'})
    
    recent_reqs = list(blood_request_collection.find().sort("timestamp", -1).limit(10))
    recent_data = []
    
    for r in recent_reqs:
        recent_data.append({
            "id": str(r['_id']),
            "patient": r['patient_name'],
            "blood": r['blood_group'],
            "status": r['status'],
            "hospital": r['hospital']
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

@app.route('/api/admin/all-users', methods=['GET'])
def get_all_users():
    donor_collection = get_collection('donors')
    requester_collection = get_collection('requesters')
    
    users = []
    
    donors = list(donor_collection.find({}))
    for d in donors:
        users.append({
            "name": d['full_name'],
            "email": d['email'],
            "role": "Donor",
            "phone": d['phone']
        })
    
    requesters = list(requester_collection.find({}))
    for r in requesters:
        users.append({
            "name": r['full_name'],
            "email": r['email'],
            "role": "Requester",
            "phone": r['phone']
        })
        
    return jsonify(users)

@app.route('/api/admin/donors-detailed', methods=['GET'])
def get_donors_detailed():
    donor_collection = get_collection('donors')
    donors = list(donor_collection.find({}))
    output = []
    cooldown_limit = datetime.utcnow() - timedelta(days=90)
    
    for d in donors:
        is_active = True if (not d.get('last_donation_date') or d['last_donation_date'] <= cooldown_limit) else False
        output.append({
            "id": str(d['_id']),
            "u_id": d['unique_id'],
            "name": d['full_name'],
            "email": d['email'],
            "blood": d['blood_group'],
            "donations": d.get('donation_count', 0),
            "health": d['health_score'],
            "phone": d['phone'],
            "location": f"{d['lat']:.2f}, {d['lng']:.2f}",
            "status": "Active" if is_active else "Inactive"
        })
    
    return jsonify(output)

@app.route('/api/admin/requests-detailed', methods=['GET'])
def get_requests_detailed():
    req_type = request.args.get('type')
    blood_request_collection = get_collection('blood_requests')
    requester_collection = get_collection('requesters')
    notification_collection = get_collection('notifications')
    donor_collection = get_collection('donors')
    
    if req_type == 'active':
        requests = list(blood_request_collection.find({"status": {"$ne": 'Completed'}}))
    else:
        requests = list(blood_request_collection.find({"status": 'Completed'}))
        
    output = []
    
    for r in requests:
        req_user = requester_collection.find_one({"unique_id": r['requester_id']})
        
        donor_name = "N/A"
        if req_type == 'completed':
            success_notif = notification_collection.find_one({
                "request_id": r['_id'],
                "status": 'Completed'
            })
            if success_notif:
                donor_user = donor_collection.find_one({"unique_id": success_notif['donor_id']})
                if donor_user:
                    donor_name = donor_user['full_name']
        
        output.append({
            "id": str(r['_id']),
            "patient": r['patient_name'],
            "blood": r['blood_group'],
            "requester": req_user['full_name'] if req_user else "N/A",
            "donor": donor_name,
            "hospital": r['hospital'],
            "phone": r['contact_number'],
            "status": r['status']
        })
    
    return jsonify(output)

@app.route('/api/admin/broadcast', methods=['POST'])
def create_broadcast():
    data = request.json
    broadcast_collection = get_collection('broadcasts')
    
    new_msg = {
        "message": data['message'],
        "timestamp": datetime.utcnow()
    }
    
    broadcast_collection.insert_one(new_msg)
    return jsonify({"message": "Broadcast sent successfully!"}), 201

@app.route('/api/broadcasts', methods=['GET'])
def get_broadcasts():
    broadcast_collection = get_collection('broadcasts')
    msgs = list(broadcast_collection.find().sort("timestamp", -1))
    
    output = []
    for m in msgs:
        output.append({
            "id": str(m['_id']),
            "message": m['message']
        })
    
    return jsonify(output)

@app.route('/api/broadcast/delete/<id>', methods=['DELETE'])
def delete_broadcast(id):
    broadcast_collection = get_collection('broadcasts')
    
    try:
        result = broadcast_collection.delete_one({"_id": ObjectId(id)})
        if result.deleted_count > 0:
            return jsonify({"message": "Broadcast deleted!"})
        else:
            return jsonify({"message": "Not found"}), 404
    except:
        return jsonify({"message": "Not found"}), 404

@app.route('/api/admin/inventory', methods=['GET'])
def get_inventory():
    inventory_collection = get_collection('blood_inventory')
    inventory = list(inventory_collection.find({}))
    
    output = []
    for i in inventory:
        output.append({
            "group": i['blood_group'],
            "units": i['units'],
            "updated": i['last_updated'].strftime("%d %b, %H:%M")
        })
    
    return jsonify(output)

@app.route('/api/admin/inventory/update', methods=['POST'])
def update_inventory():
    data = request.json
    inventory_collection = get_collection('blood_inventory')
    
    item = inventory_collection.find_one({"blood_group": data['group']})
    if item:
        if data['action'] == 'add':
            new_units = item['units'] + 1
        elif data['action'] == 'sub' and item['units'] > 0:
            new_units = item['units'] - 1
        else:
            new_units = item['units']
        
        inventory_collection.update_one(
            {"_id": item['_id']},
            {"$set": {
                "units": new_units,
                "last_updated": datetime.utcnow()
            }}
        )
        
        return jsonify({"message": "Inventory updated!"})
    
    return jsonify({"message": "Group not found"}), 404

@app.route('/api/admin/analytics', methods=['GET'])
def get_analytics():
    groups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
    
    donor_collection = get_collection('donors')
    blood_request_collection = get_collection('blood_requests')
    
    # Donor Distribution
    donor_stats = {}
    for g in groups:
        count = donor_collection.count_documents({"blood_group": g})
        donor_stats[g] = count
    
    # Request Distribution
    req_stats = {}
    for g in groups:
        count = blood_request_collection.count_documents({"blood_group": g})
        req_stats[g] = count
    
    # Success (Saves) Distribution
    save_stats = {}
    for g in groups:
        count = blood_request_collection.count_documents({
            "blood_group": g,
            "status": 'Completed'
        })
        save_stats[g] = count
    
    total_donors = donor_collection.count_documents({})
    total_requests = blood_request_collection.count_documents({})
    total_saves = blood_request_collection.count_documents({"status": 'Completed'})
    
    return jsonify({
        "labels": groups,
        "donors": [donor_stats[g] for g in groups],
        "requests": [req_stats[g] for g in groups],
        "saves": [save_stats[g] for g in groups],
        "total_donors": total_donors,
        "total_requests": total_requests,
        "total_saves": total_saves
    })

@app.route('/api/admin/camps/create', methods=['POST'])
def create_camp():
    data = request.json
    blood_camp_collection = get_collection('blood_camps')
    broadcast_collection = get_collection('broadcasts')
    
    new_camp = {
        "title": data['title'],
        "location": data['location'],
        "city": data['city'],
        "date": data['date'],
        "time": data['time'],
        "organizer": "LifeDrop Official",
        "created_at": datetime.utcnow()
    }
    
    blood_camp_collection.insert_one(new_camp)
    
    # Create broadcast message
    broadcast_msg = f"New Donation Camp: {data['title']} at {data['city']} on {data['date']}"
    broadcast_collection.insert_one({
        "message": broadcast_msg,
        "timestamp": datetime.utcnow()
    })
    
    return jsonify({"message": "Donation Camp Scheduled Successfully!"}), 201

@app.route('/api/camps/all', methods=['GET'])
def get_all_camps():
    blood_camp_collection = get_collection('blood_camps')
    camps = list(blood_camp_collection.find().sort("date", 1))
    
    output = []
    for c in camps:
        output.append({
            "id": str(c['_id']),
            "title": c['title'],
            "location": c['location'],
            "city": c['city'],
            "date": c['date'],
            "time": c['time'],
            "organizer": c.get('organizer', 'LifeDrop Official')
        })
    
    return jsonify(output)

@app.route('/api/admin/camps/delete/<id>', methods=['DELETE'])
def delete_camp(id):
    blood_camp_collection = get_collection('blood_camps')
    
    try:
        result = blood_camp_collection.delete_one({"_id": ObjectId(id)})
        if result.deleted_count > 0:
            return jsonify({"message": "Camp deleted!"})
        else:
            return jsonify({"message": "Not found"}), 404
    except:
        return jsonify({"message": "Not found"}), 404

@app.route('/api/chat', methods=['POST'])
def chat_with_ai():
    user_msg = request.json.get("message", "")
    
    # Fetch Inventory Context
    inventory_collection = get_collection('blood_inventory')
    inventory = list(inventory_collection.find({}))
    stock_info = ", ".join([f"{i['blood_group']}: {i['units']} units" for i in inventory])

    # Advanced System Instructions
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

    # Payload for Gemini API
    payload = {
        "contents": [{
            "parts": [{"text": f"{prompt_context}\n\nUser Question: {user_msg}"}]
        }]
    }

    try:
        response = requests.post(GEMINI_URL, json=payload)
        res_data = response.json()
        
        bot_reply = res_data['candidates'][0]['content']['parts'][0]['text']
        return jsonify({"reply": bot_reply})
        
    except Exception as e:
        print(f"AI Error: {e}")
        return jsonify({"reply": "Sorry nanba, I'm having trouble connecting to AI. Please try again."}), 500

@app.route('/api/blockchain/view/<req_id>', methods=['GET'])
def get_chain(req_id):
    blockchain_collection = get_collection('blockchain_ledger')
    
    # ✅ FIXED: Always treat req_id as string (MongoDB stores it as string)
    blocks = list(blockchain_collection.find({"request_id": str(req_id)}))
    
    output = []
    for b in blocks:
        try:
            data_json = json.loads(b['data'])
        except:
            data_json = b['data']
        
        output.append({
            "event": b['event'],
            "data": data_json,
            "prev_hash": b['previous_hash'][:16] + "...",
            "curr_hash": b['current_hash'][:16] + "...",
            "time": b['timestamp'].strftime("%d %b %Y, %I:%M %p")
        })
    
    return jsonify(output)

@app.route('/api/admin/check-cooldowns', methods=['GET'])
def check_donor_cooldowns():
    donor_collection = get_collection('donors')
    cooldown_limit = datetime.utcnow() - timedelta(days=90)
    
    # ✅ FIXED: Find donors who are eligible AND haven't been sent email yet
    eligible_donors = list(donor_collection.find({
        "last_donation_date": {"$lte": cooldown_limit},
        "cooldown_email_sent": False,
        "last_donation_date": {"$ne": None}  # Ensure they have donated before
    }))
    
    print(f"📧 Found {len(eligible_donors)} donors eligible for cooldown completion email")
    
    for d in eligible_donors:
        Thread(target=send_cooldown_completion_email, args=(d['email'], d['full_name'])).start()
        donor_collection.update_one(
            {"_id": d['_id']},
            {"$set": {"cooldown_email_sent": True}}
        )
        print(f"✅ Sent cooldown completion email to {d['email']}")
    
    return jsonify({
        "message": f"Sent {len(eligible_donors)} reminders!",
        "count": len(eligible_donors)
    })

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
    
    payload = {
        "sender": {"name": "LifeDrop System", "email": SENDER_EMAIL},
        "to": [{"email": "lifedrop108@gmail.com"}],
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

# Initialize database with all fields from original PostgreSQL schema
def init_database():
    with app.app_context():
        # Define all collections with their fields as per original app.py
        collections_schema = {
            'donors': [
                'unique_id', 'full_name', 'phone', 'email', 'password',
                'blood_group', 'dob', 'lat', 'lng', 'health_score',
                'last_donation_date', 'donation_count', 'cooldown_email_sent',
                'is_available', 'created_at'
            ],
            'requesters': [
                'unique_id', 'full_name', 'phone', 'email', 'password',
                'created_at'
            ],
            'blood_requests': [
                'requester_id', 'patient_name', 'contact_number', 'blood_group',
                'units', 'urgency', 'hospital', 'lat', 'lng', 'status',
                'timestamp'
            ],
            'notifications': [
                'donor_id', 'request_id', 'status', 'blood_bag_id',
                'created_at'
            ],
            'otp_verification': [
                'email', 'otp', 'timestamp'
            ],
            'blood_inventory': [
                'blood_group', 'units', 'last_updated'
            ],
            'blockchain_ledger': [
                'index', 'request_id', 'event', 'data', 'previous_hash',
                'current_hash', 'timestamp'
            ],
            'broadcasts': [
                'message', 'timestamp'
            ],
            'blood_camps': [
                'title', 'location', 'city', 'date', 'time', 'organizer',
                'created_at'
            ]
        }
        
        print("🔧 Initializing MongoDB Database with all fields...")
        
        # Create indexes for better performance
        collections_to_index = [
            ('donors', [
                ('email', 1), ('unique_id', 1), ('blood_group', 1),
                ('is_available', 1), ('last_donation_date', -1),
                ('cooldown_email_sent', 1)  # ✅ Index for cooldown check
            ]),
            ('requesters', [
                ('email', 1), ('unique_id', 1)
            ]),
            ('blood_requests', [
                ('requester_id', 1), ('blood_group', 1), ('status', 1),
                ('timestamp', -1), ('urgency', 1)
            ]),
            ('notifications', [
                ('donor_id', 1), ('request_id', 1), ('status', 1),
                ('created_at', -1)
            ]),
            ('otp_verification', [
                ('email', 1), ('timestamp', -1)
            ]),
            ('blood_inventory', [
                ('blood_group', 1), ('last_updated', -1)
            ]),
            ('blockchain_ledger', [
                ('request_id', 1), ('timestamp', -1), ('index', 1)
            ]),
            ('broadcasts', [
                ('timestamp', -1)
            ]),
            ('blood_camps', [
                ('date', 1), ('city', 1)
            ])
        ]
        
        for collection_name, indexes in collections_to_index:
            collection = get_collection(collection_name)
            for field, direction in indexes:
                try:
                    collection.create_index([(field, direction)])
                    print(f"✅ Created index on {collection_name}.{field}")
                except Exception as e:
                    print(f"⚠️  Index {collection_name}.{field}: {e}")
        
        # Initialize inventory with all blood groups
        print("🩸 Initializing Blood Inventory...")
        init_inventory()
        
        # Check if admin exists, if not create default admin placeholder
        donor_collection = get_collection('donors')
        admin_exists = donor_collection.find_one({"email": "lifedrop108@gmail.com"})
        if not admin_exists:
            print("👑 Creating default admin placeholder...")
        
        print("✅ Database initialized successfully with all fields!")
        print("📊 Collections created:")
        for collection_name, fields in collections_schema.items():
            collection = get_collection(collection_name)
            count = collection.count_documents({})
            print(f"   • {collection_name}: {count} documents, fields: {', '.join(fields)}")

@app.route('/api/admin/force-inventory', methods=['GET'])
def force_inventory_init():
    try:
        inventory_col = get_collection('blood_inventory')
        groups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
        
        count = 0
        for g in groups:
            # Check if group already exists
            exists = inventory_col.find_one({"blood_group": g})
            if not exists:
                inventory_col.insert_one({
                    "blood_group": g,
                    "units": 0,
                    "last_updated": datetime.utcnow()
                })
                count += 1
        
        return jsonify({
            "status": "success",
            "message": f"Inventory Fixed! Added {count} groups.",
            "total_groups": len(groups)
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Intha block-ah ippadiye vidunga
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)