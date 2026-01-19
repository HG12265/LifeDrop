from flask import Flask, request, jsonify, session
from flask_cors import CORS
from datetime import datetime, timedelta
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
import random
import math
import string

app = Flask(__name__)
app.secret_key = "lifedrop_secret_key" 
CORS(app)

# Database
db_path = os.path.join(os.path.dirname(__file__), 'lifedrop.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
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

with app.app_context():
    db.create_all()

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
            
@app.route('/register/donor', methods=['POST'])
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

@app.route('/login', methods=['POST'])
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
        output.append({
            "id": r.id,
            "bloodGroup": r.blood_group,
            "status": r.status,
            "patient": r.patient_name,
            "hospital": r.hospital,
            "date": r.timestamp.strftime("%d %b, %Y")
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
    return jsonify({"message": "Request Created Successfully", "id": new_req.id}), 201

@app.route('/api/match-donors/<int:request_id>', methods=['GET'])
def match_donors(request_id):
    req = BloodRequest.query.get(request_id)
    if not req: return jsonify({"message": "Not Found"}), 404

    # COOLDOWN CHECK: 90 days gap iruntha mattum thaan list-la varuvanga
    cooldown_limit = datetime.utcnow() - timedelta(days=90)
    
    donors = Donor.query.filter(
        Donor.blood_group == req.blood_group,
        (Donor.last_donation_date == None) | (Donor.last_donation_date <= cooldown_limit)
    ).all()

    matches = []
    for d in donors:
        dist = calculate_distance(req.lat, req.lng, d.lat, d.lng)
        dist_score = max(0, 100 - (dist * 2)) 
        match_percent = (dist_score * 0.6) + (d.health_score * 0.4)
        matches.append({
            "unique_id": d.unique_id,
            "name": d.full_name,
            "distance": round(dist, 1),
            "healthScore": d.health_score,
            "match": round(match_percent),
            "phone": d.phone,
            "lat": d.lat,
            "lng": d.lng
        })
    return jsonify({"request": {"lat": req.lat, "lng": req.lng, "blood": req.blood_group}, "matches": matches})

@app.route('/api/send-request', methods=['POST'])
def send_notification():
    data = request.json
    exists = Notification.query.filter_by(donor_id=data['donor_id'], request_id=data['request_id']).first()
    if not exists:
        new_notif = Notification(donor_id=data['donor_id'], request_id=data['request_id'])
        db.session.add(new_notif)
        db.session.commit()
        return jsonify({"message": "Request sent successfully!"}), 201
    return jsonify({"message": "Request already sent to this donor"}), 200

@app.route('/api/donor/profile-stats/<u_id>', methods=['GET'])
def get_donor_stats(u_id):
    donor = Donor.query.filter_by(unique_id=u_id).first()
    days_remaining = 0
    is_available = True

    if donor.last_donation_date:
        days_passed = (datetime.utcnow() - donor.last_donation_date).days
        if days_passed < 90:
            days_remaining = 90 - days_passed
            is_available = False
    
    return jsonify({
        "donation_count": donor.donation_count,
        "is_available": is_available,
        "days_remaining": days_remaining
    })


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
                "status": n.status         # Request read-ah illaiyanu theriya
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

# --- ADMIN DELETE ROUTES ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)