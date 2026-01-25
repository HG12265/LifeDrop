import React, { useEffect, useState } from 'react';
import { API_URL } from '../config'; 
import { 
  Plus, Clock, CheckCircle2, MapPin, History, 
  Droplet, Truck, AlertCircle, Link2, ShieldCheck, 
  Phone, Zap, Activity, ChevronRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RequesterDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [pulseData, setPulseData] = useState({}); // Stores live donor count for each request

  // 1. Fetch Request Pulse (Live nearby donor count)
  const fetchPulse = (reqId) => {
    fetch(`${API_URL}/api/request/pulse/${reqId}`)
      .then(res => res.json())
      .then(val => {
        setPulseData(prev => ({ ...prev, [reqId]: val }));
      })
      .catch(err => console.error("Pulse error:", err));
  };

  // 2. Main Data Fetching Logic
  const fetchHistory = () => {
    fetch(`${API_URL}/api/requester/history/${user.unique_id}`)
      .then(res => res.json())
      .then(data => {
        setHistory(data);
        
        // Calculate Stats
        const total = data.length;
        const pending = data.filter(r => r.status !== 'Completed' && r.status !== 'Rejected').length;
        const completed = data.filter(r => r.status === 'Completed').length;
        setStats({ total, pending, completed });

        // Trigger pulse fetch for all 'Pending' requests
        data.filter(r => r.status === 'Pending').forEach(req => fetchPulse(req.id));
      })
      .catch(err => console.error("History fetch error:", err));
  };

  useEffect(() => {
    fetchHistory();
    // Real-time synchronization every 15 seconds
    const interval = setInterval(fetchHistory, 15000); 
    return () => clearInterval(interval);
  }, [user.unique_id]);

  // 3. Emergency Boost Logic
  const handleBoost = async (reqId) => {
    try {
      const res = await fetch(`${API_URL}/api/request/boost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ req_id: reqId })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchHistory();
      }
    } catch (err) {
      alert("Boost failed. Check connection.");
    }
  };

  const handleComplete = async (reqId) => {
    if(!window.confirm("Confirm blood received? This will mark the request as success.")) return;
    try {
      const res = await fetch(`${API_URL}/api/request/complete/${reqId}`, { method: 'POST' });
      if (res.ok) {
        alert("Life Saved! Process marked as Completed.");
        fetchHistory();
      }
    } catch (err) {
      alert("Error updating status.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-10 animate-in fade-in duration-700 pb-24">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-10 rounded-[48px] shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-gray-800 tracking-tighter italic leading-none">Requester Portal</h2>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3">Monitoring Dashboard • v4.0</p>
        </div>
        <button 
          onClick={() => navigate('/new-request')}
          className="w-full md:w-auto bg-red-600 text-white px-10 py-5 rounded-[24px] font-black shadow-2xl shadow-red-200 flex items-center justify-center gap-3 hover:bg-red-700 transition transform active:scale-95 z-10 tracking-widest"
        >
          <Plus size={24} strokeWidth={3} /> NEW BLOOD REQUEST
        </button>
        <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-red-50 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* 2. LIVE STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard icon={<History size={24}/>} label="History" value={stats.total} color="bg-slate-900" />
          <StatCard icon={<Activity size={24}/>} label="Active Requests" value={stats.pending} color="bg-red-600" />
          <StatCard icon={<ShieldCheck size={24}/>} label="Fulfilled Cases" value={stats.completed} color="bg-green-600" />
      </div>

      {/* 3. MAIN REQUESTS FEED */}
      <div className="space-y-6">
        <h3 className="font-black text-gray-800 text-2xl mb-8 flex items-center gap-3 italic uppercase tracking-tighter px-2">
            <Clock size={28} className="text-red-600" /> Live Request Timeline
        </h3>
        
        <div className="grid grid-cols-1 gap-8">
          {history.length > 0 ? history.map((req) => (
            <div key={req.id} className="bg-white p-8 md:p-10 rounded-[50px] shadow-2xl border border-gray-100 relative overflow-hidden group hover:border-red-200 transition-all duration-500">
                
                {/* --- ADVANCED FEATURE: LIVE PULSE CARD (Overlay for Pending) --- */}
                {req.status === 'Pending' && pulseData[req.id] && (
                    <div className="absolute top-0 right-0 bg-slate-900 text-white p-5 pl-10 rounded-bl-[50px] flex items-center gap-6 animate-in slide-in-from-right shadow-xl">
                        <div className="text-right">
                           <p className="text-[9px] font-black opacity-40 uppercase tracking-widest leading-none mb-1">Available Nearby</p>
                           <div className="flex items-center justify-end gap-2 text-green-400">
                               <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
                               <p className="text-2xl font-black tracking-tighter leading-none">{pulseData[req.id].available_donors_in_region} Heroes</p>
                           </div>
                        </div>
                        <button 
                            onClick={() => handleBoost(req.id)}
                            className="bg-red-600 p-4 rounded-3xl hover:scale-110 transition shadow-lg group/boost relative"
                            title="Boost Urgency"
                        >
                           <Zap size={24} fill="white" className="animate-pulse" />
                           <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover/boost:opacity-100 transition whitespace-nowrap">BOOST EMERGENCY</span>
                        </button>
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    {/* Blood Group Indicator */}
                    <div className="flex gap-8 items-center">
                        <div className="bg-red-600 text-white w-24 h-24 rounded-[36px] flex flex-col items-center justify-center shadow-xl shadow-red-100 group-hover:scale-105 transition duration-500">
                            <span className="text-[10px] font-black opacity-60 uppercase tracking-widest leading-none mb-1">TYPE</span>
                            <span className="text-4xl font-black leading-none tracking-tighter">{req.bloodGroup}</span>
                        </div>
                        <div>
                            <h4 className="font-black text-gray-800 text-3xl tracking-tighter leading-none mb-3 uppercase italic">{req.patient}</h4>
                            <p className="text-xs font-bold text-gray-400 flex items-center gap-2 uppercase tracking-[0.2em] italic">
                                <MapPin size={16} className="text-red-600"/> {req.hospital}
                            </p>
                        </div>
                    </div>

                    {/* Status & Action Hub */}
                    <div className="w-full md:w-auto flex flex-col items-end gap-5 pt-6 md:pt-0">
                        <div className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 border shadow-sm ${
                            req.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-200' :
                            req.status === 'On the way' ? 'bg-blue-600 text-white border-transparent animate-pulse shadow-lg' :
                            req.status === 'Accepted' ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-md' :
                            req.status === 'Rejected' ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-orange-50 text-orange-600 border-orange-200'
                        }`}>
                            {req.status === 'On the way' && <Truck size={14} className="animate-bounce" />}
                            {req.status === 'On the way' ? 'Blood Dispatched' : req.status}
                        </div>

                        <div className="flex flex-wrap justify-end gap-3">
                            {['Accepted', 'On the way', 'Completed'].includes(req.status) && (
                                <button 
                                  onClick={() => navigate(`/blockchain/${req.id}`)}
                                  className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] tracking-widest hover:bg-black transition-all shadow-xl hover:shadow-red-600/20 active:scale-95"
                                >
                                  <Link2 size={16} className="text-red-600" /> VIEW LEDGER
                                </button>
                            )}

                            {req.status === 'On the way' && (
                                <button 
                                    onClick={() => handleComplete(req.id)}
                                    className="flex items-center gap-2 bg-green-600 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] tracking-widest shadow-xl shadow-green-100 hover:bg-green-700 transition animate-bounce"
                                >
                                    <CheckCircle2 size={16} /> CONFIRM RECEIPT
                                </button>
                            )}
                        </div>
                        <p className="text-[10px] font-bold text-gray-300 italic tracking-[0.2em] uppercase">{req.date}</p>
                    </div>
                </div>

                {/* --- SECURE REVEAL AREA: Donor Hero Info --- */}
                {req.accepted_donor && (
                  <div className="mt-10 p-6 bg-slate-50 border-2 border-dashed border-green-200 rounded-[40px] animate-in zoom-in duration-500 relative">
                      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                          <div className="flex items-center gap-5">
                              <div className="bg-green-600 p-4 rounded-3xl text-white shadow-xl">
                                  <ShieldCheck size={32} />
                              </div>
                              <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1 italic">Verified Hero Assigned</p>
                                  <h4 className="font-black text-gray-800 text-2xl tracking-tighter uppercase">{req.accepted_donor.name}</h4>
                              </div>
                          </div>
                          
                          <a 
                              href={`tel:${req.accepted_donor.phone}`} 
                              className="w-full lg:w-auto flex items-center justify-center gap-4 bg-slate-900 text-white px-12 py-5 rounded-[28px] font-black text-sm shadow-2xl hover:bg-black hover:shadow-red-600/30 transition-all border-b-4 border-green-600 active:scale-95"
                          >
                              <Phone size={20} fill="white" />
                              CONTACT: {req.accepted_donor.phone}
                          </a>
                      </div>
                      <div className="mt-4 flex items-center justify-center lg:justify-start gap-2">
                         <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                         <p className="text-[9px] font-bold text-green-700 uppercase tracking-widest">End-to-End Encrypted Tunnel Active</p>
                      </div>
                  </div>
                )}

                {/* Search Status if Pending */}
                {req.status === 'Pending' && !req.accepted_donor && (
                   <div className="mt-8 flex items-center gap-4 bg-orange-50/50 p-6 rounded-3xl border border-orange-100">
                      <div className="bg-white p-3 rounded-2xl shadow-sm text-orange-500"><Activity size={20} className="animate-spin" /></div>
                      <p className="text-xs font-bold text-orange-700 uppercase tracking-wider italic leading-relaxed">
                        Broadcasting to compatible heroes within 10KM. Check back soon or use "BOOST" for faster outreach.
                      </p>
                   </div>
                )}
            </div>
          )) : (
            <div className="text-center py-32 bg-white rounded-[60px] border-4 border-dashed border-gray-50 flex flex-col items-center">
                <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mb-8">
                   <Droplet size={54} className="text-gray-200" />
                </div>
                <h4 className="text-gray-400 font-black text-2xl uppercase tracking-widest italic leading-none">Safe Environment</h4>
                <p className="text-gray-300 text-xs font-bold mt-2 uppercase tracking-widest">No active emergencies found in your area.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable Stats Component
const StatCard = ({ icon, label, value, color }) => (
  <div className={`${color} p-10 rounded-[50px] text-white shadow-2xl relative overflow-hidden group transition-all duration-700 hover:-translate-y-2`}>
    <div className="absolute right-[-15px] bottom-[-15px] opacity-10 group-hover:scale-125 transition duration-1000 group-hover:-rotate-12">
        {React.cloneElement(icon, { size: 140 })}
    </div>
    <div className="relative z-10 flex flex-col gap-1">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">{label}</p>
        <h4 className="text-6xl font-black tracking-tighter">{value}</h4>
    </div>
    <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-40 transition-opacity">
        <ChevronRight size={20} />
    </div>
  </div>
);

export default RequesterDashboard;