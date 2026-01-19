import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Bell, Phone, Droplet, User, CheckCircle, XCircle, Package, ShieldCheck, Clock, Award } from 'lucide-react';

const DonorDashboard = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [bagId, setBagId] = useState("");
  const [stats, setStats] = useState({ donation_count: 0, is_available: true, days_remaining: 0 });
  const profileUrl = `${window.location.origin}/profile/${user.unique_id}`;

  // 1. Fetching specific alerts for this donor
  const fetchAlerts = () => {
    fetch(`http://localhost:5000/api/donor/targeted-alerts/${user.unique_id}`)
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(err => console.error("Error fetching alerts:", err));
  };

  // 2. Fetching Donor Cooldown & Donation Stats
  const fetchStats = () => {
    fetch(`http://localhost:5000/api/donor/profile-stats/${user.unique_id}`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Error fetching stats:", err));
  };

  useEffect(() => {
    fetchAlerts();
    fetchStats();
    // Real-time sync: Every 10 seconds refresh aagum
    const interval = setInterval(() => {
      fetchAlerts();
      fetchStats();
    }, 10000); 
    return () => clearInterval(interval);
  }, [user.unique_id]);

  const handleRespond = async (notifId, status) => {
    const res = await fetch('http://localhost:5000/api/notif/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notif_id: notifId, status: status })
    });
    if(res.ok) fetchAlerts();
  };

  const handleDonate = async (notifId) => {
    if (!bagId) return alert("Please enter Blood Bag Serial Number!");
    const res = await fetch('http://localhost:5000/api/notif/donate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notif_id: notifId, bag_id: bagId })
    });
    if(res.ok) {
      alert("Donation Confirmed! You are now on a 90-day rest period.");
      setBagId("");
      fetchAlerts();
      fetchStats();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* --- LEFT SIDE: PROFILE & STATS --- */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
          
          <div className="bg-slate-50 w-24 h-24 rounded-full mx-auto flex items-center justify-center text-red-600 mb-4 shadow-inner border-4 border-white">
             <User size={48} />
          </div>
          
          <h2 className="text-3xl font-black text-gray-800 tracking-tighter">{user.name}</h2>
          <p className="text-red-600 font-black text-xs uppercase tracking-[0.2em] mt-1 italic">#{user.unique_id}</p>
          
          <div className="mt-8 flex flex-col items-center bg-gray-50 p-6 rounded-[32px] border-2 border-dashed border-gray-200">
            <QRCodeCanvas value={profileUrl} size={140} level={"H"} />
            <p className="text-[10px] font-black text-gray-400 mt-4 uppercase tracking-widest">Scan Medical Card</p>
          </div>
          
          {/* Dynamic Stats Grid */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-red-50 p-4 rounded-3xl border border-red-100 flex flex-col items-center">
              <Award className="text-red-600 mb-1" size={18} />
              <p className="text-[10px] font-black text-gray-400 uppercase">Donations</p>
              <p className="text-3xl font-black text-red-600">{stats.donation_count}</p>
            </div>
            <div className={`p-4 rounded-3xl border flex flex-col items-center transition-colors duration-500 ${stats.is_available ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
              <ShieldCheck className={stats.is_available ? 'text-green-600 mb-1' : 'text-orange-600 mb-1'} size={18} />
              <p className="text-[10px] font-black text-gray-400 uppercase">Status</p>
              <p className={`text-sm font-black uppercase mt-1 ${stats.is_available ? 'text-green-600' : 'text-orange-600'}`}>
                {stats.is_available ? 'Active' : 'Resting'}
              </p>
            </div>
          </div>

          {/* 90-Days Cooldown Progress Bar */}
          {!stats.is_available && (
            <div className="mt-6 bg-slate-900 text-white p-6 rounded-[32px] text-left relative overflow-hidden">
                <Clock className="absolute right-[-10px] bottom-[-10px] opacity-10" size={80} />
                <p className="text-[10px] font-black opacity-50 uppercase tracking-[0.2em]">Next Eligibility</p>
                <h4 className="text-3xl font-black mt-1 text-red-500">{stats.days_remaining} <span className="text-sm">Days</span></h4>
                <div className="mt-4 w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div 
                        className="bg-red-500 h-full transition-all duration-1000" 
                        style={{ width: `${(90 - stats.days_remaining) / 90 * 100}%` }}
                    ></div>
                </div>
                <p className="text-[9px] mt-3 opacity-40 font-bold italic">* Mandatory 90-day medical recovery period.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- RIGHT SIDE: ALERTS & TRACKING --- */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between mb-2 px-2">
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
            <div key={note.notif_id} className="bg-white rounded-[40px] shadow-lg border border-gray-50 overflow-hidden group">
              <div className="p-6 md:p-8">
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="bg-red-100 text-red-600 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest">Personal Request</span>
                    <h4 className="text-2xl font-black text-gray-800 mt-2">Needs {note.blood} Blood</h4>
                    <p className="text-gray-500 font-bold text-sm mt-1">{note.patient} @ {note.hospital}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                    note.status === 'Pending' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                    note.status === 'Completed' ? 'bg-green-600 text-white border-transparent' : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {note.status === 'Donated' ? 'Sent to Hospital' : note.status === 'Completed' ? 'Blood Received' : note.status}
                  </div>
                </div>

                {note.status === 'Pending' && (
                  <div className="flex flex-col sm:flex-row gap-4 mt-8">
                    <button onClick={() => handleRespond(note.notif_id, 'Accepted')} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-green-100 hover:bg-green-700 transition transform active:scale-95">
                      <CheckCircle size={20}/> ACCEPT
                    </button>
                    <button onClick={() => handleRespond(note.notif_id, 'Declined')} className="flex-1 bg-gray-50 text-gray-400 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-600 transition transform active:scale-95">
                      <XCircle size={20}/> DECLINE
                    </button>
                  </div>
                )}

                {note.status === 'Accepted' && (
                  <div className="space-y-6 mt-6 animate-in slide-in-from-bottom duration-500">
                    <a href={`tel:${note.phone}`} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:bg-black transition">
                        <Phone size={20} fill="white"/> CALL REQUESTER
                    </a>
                    <div className="bg-slate-50 p-6 rounded-[32px] border-2 border-slate-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Tracking Details</p>
                        <input 
                          type="text" placeholder="Blood Bag Serial No. (e.g. BB-9842)" 
                          className="w-full p-4 rounded-2xl border border-gray-200 outline-red-200 mb-4 font-bold"
                          onChange={(e) => setBagId(e.target.value)}
                        />
                        <button onClick={() => handleDonate(note.notif_id)} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-red-100 hover:bg-red-700 transition">
                          CONFIRM DONATION
                        </button>
                    </div>
                  </div>
                )}

                {note.status === 'Donated' && (
                  <div className="mt-6 bg-blue-600 p-6 rounded-[32px] text-white flex items-center justify-center gap-4 shadow-xl animate-in zoom-in">
                     <Package size={32} />
                     <div className="text-left">
                        <h4 className="text-xl font-black italic uppercase">Blood Dispatched</h4>
                        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Waiting for requester to receive.</p>
                     </div>
                  </div>
                )}

                {note.status === 'Completed' && (
                  <div className="mt-6 bg-green-600 p-6 rounded-[32px] text-white flex items-center justify-center gap-4 shadow-xl animate-in zoom-in">
                     <ShieldCheck size={32} />
                     <div className="text-left">
                        <h4 className="text-xl font-black italic uppercase">Process Finished</h4>
                        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest tracking-widest">You saved a life today!</p>
                     </div>
                  </div>
                )}

              </div>
            </div>
          )) : (
            <div className="bg-white p-20 rounded-[48px] border-2 border-dashed border-gray-100 text-center">
              <Droplet size={60} className="mx-auto text-gray-100 mb-6" />
              <p className="text-gray-400 font-black text-xl tracking-tight">No Urgent Alerts for You.</p>
              <p className="text-gray-400 text-xs mt-1 italic uppercase tracking-widest">Active status is monitored in real-time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;