import React, { useEffect, useState } from 'react';
import { API_URL } from '../config'; 
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom'; 
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Bell, Phone, Droplet, User, CheckCircle, 
  XCircle, Package, ShieldCheck, Clock, Award, 
  Tent, MapPin, Calendar, Link2, Activity
} from 'lucide-react';

import { generateCertificate } from '../utils/CertificateGenerator';

const DonorDashboard = ({ user }) => {
  const navigate = useNavigate(); 
  const [notifications, setNotifications] = useState([]);
  const [bagId, setBagId] = useState("");
  const [stats, setStats] = useState({ donation_count: 0, is_available: true, days_remaining: 0 });
  const [camps, setCamps] = useState([]); 
  const [isToggling, setIsToggling] = useState(false);

  // --- MODAL STATES ---
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [selectedNotifId, setSelectedNotifId] = useState(null);
  
  const profileUrl = `${window.location.origin}/profile/${user.unique_id}`;

  const fetchAlerts = () => {
    fetch(`${API_URL}/api/donor/targeted-alerts/${user.unique_id}`)
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(err => console.error("Error alerts:", err));
  };

  const fetchStats = () => {
    fetch(`${API_URL}/api/donor/profile-stats/${user.unique_id}`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Error stats:", err));
  };

  const fetchCamps = () => {
    fetch(`${API_URL}/api/camps/all`)
      .then(res => res.json())
      .then(data => setCamps(data))
      .catch(err => console.error("Error camps:", err));
  };

  useEffect(() => {
    fetchAlerts();
    fetchStats();
    fetchCamps();
    const interval = setInterval(() => {
      fetchAlerts();
      fetchStats();
    }, 10000); 
    return () => clearInterval(interval);
  }, [user.unique_id]);

  const handleToggleStatus = async () => {
    if (stats.days_remaining > 0) {
        toast.info(`Medical Safety: You are in a mandatory rest period for ${stats.days_remaining} more days.`);
        return;
    }

    setIsToggling(true);
    try {
      const res = await fetch(`${API_URL}/api/donor/toggle-status/${user.unique_id}`, {
        method: 'POST'
      });
      const data = await res.json();
      if(res.ok) {
        setStats(prev => ({ ...prev, is_available: data.is_available }));
        toast.success(data.is_available ? "Visibility: ONLINE" : "Visibility: OFFLINE");
      }
    } catch (err) {
      toast.error("Error updating status");
    } finally {
      setIsToggling(false);
    }
  };

  const handleRespond = async (notifId, status) => {
    const res = await fetch(`${API_URL}/api/notif/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notif_id: notifId, status: status })
    });
    if(res.ok) {
        toast.success(`Request ${status}`);
        fetchAlerts();
    }
  };

  // --- DONATION MODAL LOGIC ---
  const triggerDonateModal = (notifId) => {
    if (!bagId.trim()) return toast.error("Please enter Blood Bag Serial Number!");
    setSelectedNotifId(notifId);
    setShowDonateModal(true);
  };

  const finalizeDonation = async () => {
    setShowDonateModal(false);
    try {
      const res = await fetch(`${API_URL}/api/notif/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notif_id: selectedNotifId, bag_id: bagId })
      });
      if(res.ok) {
        toast.success("Hero! Donation Confirmed. Cooldown Started.");
        setBagId("");
        fetchAlerts();
        fetchStats();
      }
    } catch (err) {
      toast.error("Error recording donation.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* CUSTOM DONATION CONFIRM MODAL */}
      <ConfirmModal 
        isOpen={showDonateModal}
        title="Confirm Donation"
        message={`Are you sure you want to record this donation with Bag ID: ${bagId}? This will start your 90-day medical rest period.`}
        confirmText="YES, CONFIRM DONATION"
        onConfirm={finalizeDonation}
        onCancel={() => setShowDonateModal(false)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- LEFT SIDE: PROFILE & STATS --- */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-xl text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
                <div className="bg-slate-50 w-24 h-24 rounded-full mx-auto flex items-center justify-center text-red-600 mb-4 shadow-inner border-4 border-white">
                    <User size={48} />
                </div>
                <h2 className="text-3xl font-black text-gray-800 tracking-tighter">{user.name}</h2>
                <p className="text-red-600 font-black text-xs uppercase tracking-widest italic">#{user.unique_id}</p>
                
                <div className="mt-8 flex flex-col items-center bg-gray-50 p-6 rounded-[32px] border-2 border-dashed border-gray-200">
                    <QRCodeCanvas value={profileUrl} size={140} level={"H"} />
                    <p className="text-[10px] font-black text-gray-400 mt-4 uppercase tracking-widest leading-none">Hero Digital Card</p>
                </div>
                
                <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="bg-red-50 p-4 rounded-3xl border border-red-100 flex flex-col items-center justify-center">
                        <Award className="text-red-600 mb-1" size={18} />
                        <p className="text-[10px] font-black text-gray-400 uppercase leading-none text-center">Donations</p>
                        <p className="text-3xl font-black text-red-600 mt-1">{stats.donation_count}</p>
                    </div>

                    <button 
                        onClick={handleToggleStatus}
                        disabled={isToggling || stats.days_remaining > 0}
                        className={`p-4 rounded-3xl border flex flex-col items-center justify-center transition-all duration-500 transform active:scale-95 shadow-sm ${
                            stats.is_available 
                            ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                            : 'bg-slate-100 border-slate-200 opacity-80'
                        }`}
                    >
                        <div className={`w-3 h-3 rounded-full mb-1 ${stats.is_available ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase leading-none">Visibility</p>
                        <p className={`text-sm font-black uppercase mt-1 ${stats.is_available ? 'text-green-600' : 'text-slate-500'}`}>
                            {stats.days_remaining > 0 ? 'Resting' : (stats.is_available ? 'Online' : 'Offline')}
                        </p>
                    </button>
                </div>

                {/* --- COOLDOWN INDICATOR --- */}
                {stats.days_remaining > 0 && (
                    <div className="mt-6 bg-slate-900 text-white p-6 rounded-[32px] text-left relative overflow-hidden shadow-2xl animate-in zoom-in">
                        <Clock className="absolute right-[-10px] bottom-[-10px] opacity-10" size={80} />
                        <p className="text-[10px] font-black opacity-50 uppercase tracking-widest leading-none mb-1">Rest Period Active</p>
                        <h4 className="text-3xl font-black mt-1 text-red-500">{stats.days_remaining} Days Left</h4>
                        <div className="mt-4 w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div 
                                className="bg-red-500 h-full transition-all duration-1000" 
                                style={{ width: `${((90 - stats.days_remaining) / 90) * 100}%` }}
                            ></div>
                        </div>
                        <p className="text-[8px] mt-3 opacity-40 font-bold italic">* You will be automatically visible after this period.</p>
                    </div>
                )}
            </div>
        </div>

        {/* --- RIGHT SIDE: ALERTS & TRACKING --- */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="bg-red-600 p-2.5 rounded-2xl text-white shadow-lg shadow-red-100"><Bell size={24} /></div>
                    <h3 className="text-2xl font-black text-gray-800 tracking-tight italic uppercase">Urgent Help Alerts</h3>
                </div>
                <span className="bg-slate-800 text-white text-[10px] px-3 py-1 rounded-full font-black">
                    {notifications.length} ASSIGNED
                </span>
            </div>

            <div className="space-y-6">
            {notifications.length > 0 ? notifications.map((note) => (
                <div key={note.notif_id} className="bg-white rounded-[40px] shadow-lg border border-gray-50 overflow-hidden group hover:shadow-2xl transition-all duration-300">
                <div className="p-6 md:p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="bg-red-100 text-red-600 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest italic">Personal Request</span>
                            <h4 className="text-2xl font-black text-gray-800 mt-2 italic">Needs {note.blood} Blood</h4>
                            <p className="text-gray-500 font-bold text-sm mt-1">{note.patient} @ {note.hospital}</p>
                        </div>
                        <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                            note.status === 'Pending' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                            note.status === 'Completed' ? 'bg-green-600 text-white border-transparent shadow-lg shadow-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                            {note.status === 'Donated' ? 'Blood Dispatched' : note.status === 'Completed' ? 'Process Finished' : note.status}
                        </div>
                    </div>

                    {note.status === 'Pending' && (
                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                        <button onClick={() => handleRespond(note.notif_id, 'Accepted')} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-green-100 hover:bg-green-700 transition transform active:scale-95">
                        <CheckCircle size={20}/> ACCEPT
                        </button>
                        <button onClick={() => handleRespond(note.notif_id, 'Declined')} className="flex-1 bg-gray-50 text-gray-400 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-600 transition">
                        <XCircle size={20}/> DECLINE
                        </button>
                    </div>
                    )}

                    {note.status === 'Accepted' && (
                    <div className="space-y-6 mt-6 animate-in slide-in-from-bottom duration-500">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <a href={`tel:${note.phone}`} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:bg-black transition">
                                <Phone size={20} fill="white"/> CALL REQUESTER
                            </a>
                            <button 
                                onClick={() => navigate(`/blockchain/${note.request_id}`)}
                                className="flex-1 bg-white border-2 border-slate-100 text-slate-400 py-4 rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 hover:border-red-200 hover:text-red-600 transition"
                            >
                                <Link2 size={16} /> VIEW LIVE LEDGER
                            </button>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-[32px] border-2 border-slate-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Donation Confirmation</p>
                            <input 
                            type="text" placeholder="Enter Blood Bag Serial No." 
                            className="w-full p-4 rounded-2xl border border-gray-200 outline-red-200 mb-4 font-bold"
                            value={bagId}
                            onChange={(e) => setBagId(e.target.value)}
                            />
                            <button onClick={() => triggerDonateModal(note.notif_id)} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-red-100 hover:bg-red-700 transition">
                            MARK AS DONATED
                            </button>
                        </div>
                    </div>
                    )}

                    {note.status === 'Donated' && (
                        <div className="mt-6 space-y-4">
                            <div className="bg-blue-600 p-6 rounded-[32px] text-white flex items-center justify-center gap-4 shadow-xl animate-in zoom-in">
                                <Package size={32} />
                                <div className="text-left">
                                    <h4 className="text-xl font-black italic uppercase leading-none">Bag in Transit</h4>
                                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Safe delivery in progress.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => navigate(`/blockchain/${note.request_id}`)}
                                className="w-full border-2 border-dashed border-blue-100 text-blue-600 py-4 rounded-[32px] font-black text-xs flex items-center justify-center gap-2 hover:bg-blue-50 transition"
                            >
                                <ShieldCheck size={18} /> VERIFY BLOCKCHAIN RECORD
                            </button>
                        </div>
                    )}

                    {note.status === 'Completed' && (
                      <div className="mt-6 space-y-3">
                        <div className="bg-green-600 p-6 rounded-[32px] text-white flex items-center justify-center gap-4 shadow-xl">
                           <ShieldCheck size={32} />
                           <div className="text-left">
                              <h4 className="text-xl font-black italic uppercase leading-none text-white">Life Saved!</h4>
                              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Patient received the blood.</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => generateCertificate(user.name, note.blood, note.date, note.request_id)}
                          className="w-full bg-slate-900 text-amber-400 py-5 rounded-[32px] font-black flex items-center justify-center gap-3 border-4 border-amber-400/20 shadow-2xl hover:scale-[1.02] transition transform active:scale-95"
                        >
                          <Award size={24} className="animate-pulse" />
                          DOWNLOAD HERO CERTIFICATE
                        </button>
                        <button 
                                onClick={() => navigate(`/blockchain/${note.request_id}`)}
                                className="w-full border-2 border-dashed border-green-100 text-green-600 py-4 rounded-[32px] font-black text-xs flex items-center justify-center gap-2 hover:bg-green-50 transition"
                            >
                                <ShieldCheck size={18} /> VIEW FINAL LEDGER
                            </button>
                      </div>
                    )}
                </div>
                </div>
            )) : (
                <div className="bg-white p-20 rounded-[48px] border-2 border-dashed border-gray-100 text-center">
                    <Droplet size={60} className="text-gray-100 mb-6 mx-auto" />
                    <p className="text-gray-400 font-black text-xl tracking-tight uppercase italic">No urgent alerts for you.</p>
                </div>
            )}
            </div>
        </div>
      </div>

      {/* --- BOTTOM SECTION: CAMPS --- */}
      {camps.length > 0 && (
        <div className="pt-10 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="bg-red-100 p-2 rounded-xl text-red-600 shadow-sm"><Tent size={24} /></div>
            <h3 className="text-2xl font-black text-gray-800 tracking-tight italic uppercase">Upcoming Donation Drives</h3>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide px-2">
            {camps.map(camp => (
              <div key={camp.id} className="min-w-[320px] bg-white p-8 rounded-[40px] shadow-xl border border-gray-50 relative overflow-hidden group hover:border-red-100 transition-all">
                <div className="bg-red-50 text-red-600 w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase mb-6 tracking-widest">{camp.city}</div>
                <h4 className="text-xl font-black text-gray-800 leading-tight mb-3 italic">{camp.title}</h4>
                <p className="text-xs font-bold text-gray-400 flex items-center gap-2 mb-6"><MapPin size={16} className="text-red-500"/> {camp.location}</p>
                <div className="flex items-center justify-between border-t border-gray-50 pt-6">
                    <div>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Date</p>
                        <p className="text-xs font-black text-gray-700 flex items-center gap-1 mt-1"><Calendar size={12}/> {camp.date}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Timings</p>
                        <p className="text-xs font-black text-gray-700 flex items-center gap-1 mt-1 justify-end"><Clock size={12}/> {camp.time}</p>
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

export default DonorDashboard;