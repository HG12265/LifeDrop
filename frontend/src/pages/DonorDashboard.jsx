import React, { useEffect, useState } from 'react';
import { API_URL } from '../config'; 
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom'; 
import { 
  Bell, Phone, Droplet, User, CheckCircle, 
  XCircle, Package, ShieldCheck, Clock, Award, 
  Tent, MapPin, Calendar, Link2, Activity,
  Zap, Syringe, Thermometer, Info, ShieldAlert
} from 'lucide-react';

import { generateCertificate } from '../utils/CertificateGenerator';

const DonorDashboard = ({ user }) => {
  const navigate = useNavigate(); 
  const [notifications, setNotifications] = useState([]);
  const [bagId, setBagId] = useState("");
  const [stats, setStats] = useState({ 
    donation_count: 0, 
    is_available: true, 
    days_remaining: 0,
    impact_points: 0,
    badge: 'New Hero 🌱'
  });
  const [camps, setCamps] = useState([]); 
  
  const profileUrl = `${window.location.origin}/profile/${user.unique_id}`;

  // 1. Fetch Targeted Alerts
  const fetchAlerts = () => {
    fetch(`${API_URL}/api/donor/targeted-alerts/${user.unique_id}`)
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(err => console.error("Error alerts:", err));
  };

  // 2. Fetch Advanced Profile Stats (Cooldown, Count, Badge, Impact)
  const fetchStats = () => {
    fetch(`${API_URL}/api/donor/profile-stats/${user.unique_id}`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Error stats:", err));
  };

  // 3. Fetch Upcoming Camps
  const fetchCamps = () => {
    fetch(`${API_URL}/api/camps/all`)
      .then(res => res.json())
      .then(data => setCamps(data))
      .catch(err => console.error("Error camps:", err));
  };

  useEffect(() => {
    fetchAlerts(); fetchStats(); fetchCamps();
    const interval = setInterval(() => {
      fetchAlerts(); fetchStats();
    }, 15000); 
    return () => clearInterval(interval);
  }, [user.unique_id]);

  // --- FITNESS VAULT LOGIC (Self Reporting) ---
  const logHealthEvent = async (type) => {
    const msg = type === 'fever' ? "Resting period of 2 weeks" : "Resting period of 6 months";
    if(!window.confirm(`Are you reporting ${type.toUpperCase()}? This will temporarily pause your availability for ${msg}.`)) return;
    
    const res = await fetch(`${API_URL}/api/donor/log-health-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ u_id: user.unique_id, type })
    });
    if(res.ok) {
        alert("Fitness status updated. Take rest and recover hero!");
        fetchStats(); // Status-ah immediate-ah refresh pannuvom
    }
  };

  const handleRespond = async (notifId, status) => {
    const res = await fetch(`${API_URL}/api/notif/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notif_id: notifId, status: status })
    });
    if(res.ok) fetchAlerts();
  };

  const handleDonate = async (notifId) => {
    if (!bagId) return alert("Please enter Blood Bag Serial Number!");
    const res = await fetch(`${API_URL}/api/notif/donate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notif_id: notifId, bag_id: bagId })
    });
    if(res.ok) {
      alert("Donation Confirmed! Cooldown period activated.");
      setBagId("");
      fetchAlerts();
      fetchStats();
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-12 animate-in fade-in duration-700">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* --- LEFT SECTION: PROFILE & FITNESS VAULT --- */}
        <div className="lg:col-span-1 space-y-8">
            {/* 1. Hero Identity Card */}
            <div className="bg-white rounded-[48px] p-10 border border-gray-100 shadow-2xl text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-3 bg-red-600"></div>
                <div className="bg-slate-900 w-28 h-28 rounded-full mx-auto flex items-center justify-center text-red-500 mb-4 border-8 border-white shadow-2xl transition-transform group-hover:scale-105 duration-500">
                    <User size={54} />
                </div>
                <h2 className="text-3xl font-black text-gray-800 tracking-tighter leading-none">{user.name}</h2>
                <div className="inline-block bg-amber-100 text-amber-700 px-5 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest mt-4 shadow-sm border border-amber-200">
                    {stats.badge}
                </div>
                
                <div className="mt-8 flex flex-col items-center bg-gray-50 p-6 rounded-[40px] border-2 border-dashed border-gray-200">
                    <QRCodeCanvas value={profileUrl} size={150} level={"H"} />
                    <p className="text-[10px] font-black text-gray-400 mt-5 uppercase tracking-widest italic opacity-60">Digital Verification ID</p>
                </div>
                
                <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="bg-red-50 p-5 rounded-[32px] border border-red-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Impact Score</p>
                        <p className="text-3xl font-black text-red-600 tracking-tighter">{stats.impact_points || 0}</p>
                    </div>
                    <div className={`p-5 rounded-[32px] border flex flex-col items-center justify-center transition-all ${stats.is_available ? 'bg-green-50 border-green-100 shadow-lg shadow-green-100/50' : 'bg-orange-50 border-orange-100'}`}>
                        <ShieldCheck className={stats.is_available ? 'text-green-600 mb-1' : 'text-orange-600 mb-1'} size={20} />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Availability</p>
                        <p className={`text-sm font-black uppercase ${stats.is_available ? 'text-green-600' : 'text-orange-600'}`}>
                            {stats.is_available ? 'Active' : 'Resting'}
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. Advanced Fitness Vault */}
            <div className="bg-slate-900 p-8 rounded-[48px] text-white shadow-2xl relative overflow-hidden border-b-8 border-red-600">
                <Activity className="absolute right-[-20px] bottom-[-20px] opacity-10" size={150} />
                <div className="relative z-10">
                    <h3 className="text-xl font-black italic mb-8 flex items-center gap-2 uppercase tracking-tighter">
                        <ShieldCheck className="text-red-500" /> Fitness Vault
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <FitnessBtn icon={<Thermometer/>} label="Fever" onClick={() => logHealthEvent('fever')} />
                        <FitnessBtn icon={<Syringe/>} label="Tattoo" onClick={() => logHealthEvent('tattoo')} />
                        <FitnessBtn icon={<Zap/>} label="Surgery" onClick={() => logHealthEvent('surgery')} />
                    </div>
                    
                    <div className="mt-8 bg-white/5 p-5 rounded-[32px] border border-white/10 flex gap-4 items-start">
                        <Info className="text-red-500 shrink-0" size={18} />
                        <p className="text-[9px] font-bold text-gray-400 leading-relaxed uppercase tracking-tight">
                            Reporting health changes will temporarily pause your donor profile to ensure patient safety and your recovery.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* --- RIGHT SECTION: ALERTS & TRACKING --- */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Cooldown Awareness Banner */}
            {!stats.is_available && (
                <div className="bg-white p-8 rounded-[48px] shadow-xl border-l-[16px] border-red-600 relative overflow-hidden group">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                        <div className="flex items-center gap-4 text-center md:text-left">
                            <div className="bg-red-50 p-4 rounded-3xl text-red-600 animate-pulse"><Clock size={32} /></div>
                            <div>
                                <h4 className="text-3xl font-black text-gray-800 italic tracking-tighter uppercase">Cooldown Active</h4>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Hero, you are currently in a recovery phase.</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 px-8 py-5 rounded-[32px] border border-gray-100 text-center shadow-inner">
                            <p className="text-4xl font-black text-red-600 tracking-tighter">{stats.days_remaining}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Days to Go</p>
                        </div>
                    </div>
                    <div className="mt-8 w-full bg-slate-50 h-2 rounded-full overflow-hidden border">
                        <div 
                            className="bg-red-600 h-full transition-all duration-1000 shadow-[0_0_20px_rgba(220,38,38,0.5)]" 
                            style={{ width: `${((90 - stats.days_remaining) / 90) * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <div className="bg-red-600 p-3 rounded-2xl text-white shadow-xl shadow-red-200"><Bell size={28} /></div>
                    <div>
                        <h3 className="text-3xl font-black text-gray-800 tracking-tighter italic uppercase leading-none">Emergency Alerts</h3>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest italic">Live assignments for your group</p>
                    </div>
                </div>
                <span className="bg-slate-900 text-white text-xs px-4 py-1.5 rounded-full font-black shadow-lg">
                    {notifications.length} NEW
                </span>
            </div>

            <div className="space-y-8 pt-4">
            {notifications.length > 0 ? notifications.map((note) => (
                <div key={note.notif_id} className="bg-white rounded-[48px] shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 group hover:border-red-200">
                <div className="p-8 md:p-10">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div>
                            <span className="bg-red-50 text-red-600 text-[10px] px-4 py-1 rounded-full font-black uppercase tracking-widest italic border border-red-100">Hero Request</span>
                            <h4 className="text-3xl font-black text-gray-800 mt-4 tracking-tighter uppercase italic leading-none">Needs {note.blood} Blood</h4>
                            <p className="text-gray-500 font-bold text-sm mt-2 flex items-center gap-2 uppercase tracking-wide">
                                Patient: <span className="text-slate-800">{note.patient}</span> @ <span className="text-red-500">{note.hospital}</span>
                            </p>
                        </div>
                        <div className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border ${
                            note.status === 'Pending' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                            note.status === 'Completed' ? 'bg-green-600 text-white border-transparent' : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                            {note.status === 'Donated' ? 'Sent to Hospital' : note.status === 'Completed' ? 'Donation Confirmed' : note.status}
                        </div>
                    </div>

                    {/* ACTION LOGIC (Synchronized) */}
                    {note.status === 'Pending' && (
                    <div className="flex flex-col sm:flex-row gap-4 mt-10 animate-in slide-in-from-bottom">
                        <button onClick={() => handleRespond(note.notif_id, 'Accepted')} className="flex-1 bg-green-600 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-green-100 hover:bg-green-700 transition transform active:scale-95 flex items-center justify-center gap-2">
                            <CheckCircle size={20}/> ACCEPT HELP
                        </button>
                        <button onClick={() => handleRespond(note.notif_id, 'Declined')} className="flex-1 bg-gray-50 text-gray-400 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition">
                            <XCircle size={20}/> DECLINE
                        </button>
                    </div>
                    )}

                    {note.status === 'Accepted' && (
                    <div className="space-y-6 mt-10 animate-in slide-in-from-bottom duration-500">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <a href={`tel:${note.phone}`} className="flex-1 bg-slate-900 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl hover:bg-black transition">
                                <Phone size={20} fill="white"/> CALL REQUESTER
                            </a>
                            <button 
                                onClick={() => navigate(`/blockchain/${note.request_id}`)}
                                className="flex-1 bg-white border-2 border-slate-100 text-slate-400 py-5 rounded-[24px] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:border-red-200 hover:text-red-600 transition"
                            >
                                <Link2 size={18} /> OPEN LEDGER
                            </button>
                        </div>
                        <div className="bg-slate-50 p-8 rounded-[40px] border-2 border-slate-100">
                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Package size={14} className="text-red-600" /> Donation Tracking ID
                            </h5>
                            <input 
                                type="text" placeholder="Enter Serial Number from Blood Bag..." 
                                className="w-full p-5 rounded-3xl border border-gray-200 outline-red-200 mb-6 font-bold text-gray-700 shadow-inner"
                                value={bagId}
                                onChange={(e) => setBagId(e.target.value)}
                            />
                            <button onClick={() => handleDonate(note.notif_id)} className="w-full bg-red-600 text-white py-5 rounded-[24px] font-black uppercase text-sm tracking-widest shadow-2xl shadow-red-200 hover:bg-red-700 transition">
                                SUBMIT DONATION PROOF
                            </button>
                        </div>
                    </div>
                    )}

                    {note.status === 'Donated' && (
                        <div className="mt-10 space-y-5 animate-in zoom-in">
                            <div className="bg-blue-600 p-8 rounded-[40px] text-white flex flex-col sm:flex-row items-center justify-center gap-6 shadow-2xl">
                                <div className="bg-white/20 p-5 rounded-full"><Package size={42} /></div>
                                <div className="text-center sm:text-left">
                                    <h4 className="text-2xl font-black italic uppercase leading-none">Bag Dispatched</h4>
                                    <p className="text-xs font-bold opacity-70 uppercase tracking-[0.2em] mt-2 italic">Tracking Live on Blockchain</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => navigate(`/blockchain/${note.request_id}`)}
                                className="w-full border-2 border-dashed border-blue-200 text-blue-600 py-5 rounded-[40px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-50 transition"
                            >
                                <ShieldCheck size={20} /> VERIFY SHIPMENT STATUS
                            </button>
                        </div>
                    )}

                    {note.status === 'Completed' && (
                      <div className="mt-10 space-y-5 animate-in zoom-in">
                        <div className="bg-green-600 p-10 rounded-[48px] text-white flex flex-col items-center justify-center gap-6 shadow-2xl relative overflow-hidden group">
                           <Award className="absolute right-[-10px] bottom-[-10px] opacity-10" size={150} />
                           <div className="bg-white p-6 rounded-full text-green-600 shadow-xl"><ShieldCheck size={48} /></div>
                           <div className="text-center">
                              <h4 className="text-3xl font-black italic uppercase tracking-tighter">Life Saved Successfully</h4>
                              <p className="text-sm font-bold opacity-80 uppercase tracking-[0.3em] mt-2 italic">Official Certification Issued</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => generateCertificate(user.name, note.blood, note.date || "Today", note.request_id)}
                          className="w-full bg-slate-900 text-amber-400 py-6 rounded-[40px] font-black flex items-center justify-center gap-4 border-4 border-amber-400/20 shadow-2xl hover:bg-black transition-all transform active:scale-95"
                        >
                          <Award size={28} className="animate-bounce" />
                          DOWNLOAD HERO CERTIFICATE
                        </button>
                      </div>
                    )}
                </div>
                </div>
            )) : (
                <div className="bg-white p-24 rounded-[60px] border-2 border-dashed border-gray-100 text-center flex flex-col items-center animate-in fade-in duration-1000">
                    <Droplet size={80} className="text-gray-100 mb-8" />
                    <p className="text-gray-400 font-black text-2xl tracking-tighter uppercase italic opacity-40">Listening for Urgent Help Requests</p>
                </div>
            )}
            </div>
        </div>
      </div>

      {/* --- CAMPS SECTION (Consistent UI) --- */}
      {camps.length > 0 && (
        <div className="pt-12 border-t border-gray-100">
          <div className="flex items-center gap-4 mb-10 px-4">
            <div className="bg-red-600 p-3 rounded-2xl text-white shadow-xl shadow-red-100"><Tent size={28} /></div>
            <h3 className="text-3xl font-black text-gray-800 tracking-tighter italic uppercase italic leading-none">Upcoming Donation Drives</h3>
          </div>
          <div className="flex gap-8 overflow-x-auto pb-10 scrollbar-hide px-4">
            {camps.map(camp => (
              <div key={camp.id} className="min-w-[340px] bg-white p-10 rounded-[50px] shadow-2xl border border-gray-50 relative overflow-hidden group hover:border-red-200 transition-all duration-500">
                <div className="bg-red-50 text-red-600 w-fit px-5 py-1.5 rounded-full text-[10px] font-black uppercase mb-8 border border-red-100">{camp.city}</div>
                <h4 className="text-2xl font-black text-gray-800 leading-tight mb-4 italic uppercase tracking-tighter">{camp.title}</h4>
                <p className="text-xs font-bold text-gray-400 flex items-center gap-2 mb-8 italic"><MapPin size={18} className="text-red-500"/> {camp.location}</p>
                <div className="flex items-center justify-between border-t border-gray-50 pt-8">
                    <div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Schedule</p>
                        <p className="text-sm font-black text-slate-800 flex items-center gap-2"><Calendar size={16} className="text-red-600"/> {camp.date}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Timings</p>
                        <p className="text-sm font-black text-slate-800 flex items-center gap-2"><Clock size={16} className="text-red-600"/> {camp.time}</p>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Fitness Button
const FitnessBtn = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="p-6 bg-white/5 rounded-[32px] hover:bg-red-600 transition-all duration-300 flex flex-col items-center gap-3 border border-white/5 active:scale-90 group">
    <div className="group-hover:scale-110 transition-transform duration-300">{React.cloneElement(icon, { size: 24 })}</div>
    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
  </button>
);

export default DonorDashboard;