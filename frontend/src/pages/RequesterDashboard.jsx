import React, { useEffect, useState } from 'react';
// Link2 icon-ah inga add panni irukken nanba
import { Plus, Clock, CheckCircle2, MapPin, History, Droplet, Truck, AlertCircle, Link2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RequesterDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });

  const fetchHistory = () => {
    fetch(`http://localhost:5000/api/requester/history/${user.unique_id}`)
      .then(res => res.json())
      .then(data => {
        setHistory(data);
        const total = data.length;
        const pending = data.filter(r => r.status !== 'Completed' && r.status !== 'Rejected').length;
        const completed = data.filter(r => r.status === 'Completed').length;
        setStats({ total, pending, completed });
      })
      .catch(err => console.error("Error:", err));
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000); 
    return () => clearInterval(interval);
  }, [user.unique_id]);

  const handleComplete = async (reqId) => {
    if(!window.confirm("Confirm that you have received the blood?")) return;
    const res = await fetch(`http://localhost:5000/api/request/complete/${reqId}`, {
      method: 'POST',
    });
    if (res.ok) {
      alert("Glad to help! Process marked as Completed.");
      fetchHistory();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-8 animate-in fade-in duration-500">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tighter italic">Welcome, {user.name} 👋</h2>
          <p className="text-gray-500 font-bold text-sm uppercase tracking-widest opacity-60">Requester Control Center</p>
        </div>
        <button 
          onClick={() => navigate('/new-request')}
          className="w-full md:w-auto bg-red-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-red-100 flex items-center justify-center gap-2 hover:bg-red-700 active:scale-95 transition transform"
        >
          <Plus size={24} /> NEW REQUEST
        </button>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard icon={<History size={20}/>} label="Total Requests" value={stats.total} color="bg-slate-900" />
          <StatCard icon={<Droplet size={20}/>} label="Active Requests" value={stats.pending} color="bg-red-600" />
          <StatCard icon={<CheckCircle2 size={20}/>} label="Closed Requests" value={stats.completed} color="bg-green-600" />
      </div>

      {/* 3. REQUEST TIMELINE */}
      <div className="bg-white rounded-[40px] p-6 md:p-10 border border-gray-100 shadow-2xl">
        <h3 className="font-black text-gray-800 text-xl mb-8 flex items-center gap-2 italic uppercase tracking-tighter">
            <Clock size={24} className="text-red-600" /> Request Timeline
        </h3>
        
        <div className="grid gap-8">
          {history.length > 0 ? history.map((req) => (
            <div key={req.id} className="group relative bg-slate-50 p-6 md:p-8 rounded-[32px] border border-gray-100 transition hover:bg-white hover:shadow-2xl hover:border-red-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    
                    {/* Left: Patient Info */}
                    <div className="flex gap-6 items-center">
                        <div className="bg-red-600 text-white w-16 h-16 rounded-[24px] flex flex-col items-center justify-center shadow-lg shadow-red-100 group-hover:scale-110 transition">
                            <span className="text-[10px] font-black opacity-60 leading-none mb-1">TYPE</span>
                            <span className="text-2xl font-black leading-none">{req.bloodGroup}</span>
                        </div>
                        <div>
                            <h4 className="font-black text-gray-800 text-2xl tracking-tight">{req.patient}</h4>
                            <p className="text-xs font-bold text-gray-400 flex items-center gap-1 mt-1 uppercase tracking-widest">
                                <MapPin size={14} className="text-red-500"/> {req.hospital}
                            </p>
                        </div>
                    </div>

                    {/* Right: Actions & Status */}
                    <div className="w-full md:w-auto flex flex-col items-end gap-4">
                        <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-2 border ${
                            req.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-100' :
                            req.status === 'On the way' ? 'bg-blue-600 text-white border-transparent animate-pulse' :
                            req.status === 'Accepted' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            'bg-orange-50 text-orange-600 border-orange-100'
                        }`}>
                            {req.status === 'On the way' && <Truck size={12} />}
                            {req.status === 'On the way' ? 'Blood Dispatched' : req.status}
                        </div>

                        <div className="flex flex-wrap justify-end gap-3 w-full">
                            {/* BLOCKCHAIN LEDGER BUTTON */}
                            {['Accepted', 'On the way', 'Completed'].includes(req.status) && (
                                <button 
                                  onClick={() => navigate(`/blockchain/${req.id}`)}
                                  className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[10px] tracking-widest hover:bg-black transition shadow-lg"
                                >
                                  <Link2 size={14} className="text-red-500" /> VIEW BLOCKCHAIN LEDGER
                                </button>
                            )}

                            {/* RECEIVED CONFIRMATION BUTTON */}
                            {req.status === 'On the way' && (
                                <button 
                                    onClick={() => handleComplete(req.id)}
                                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] tracking-widest shadow-lg shadow-green-100 hover:bg-green-700 transition"
                                >
                                    <CheckCircle2 size={14} /> I RECEIVED THE BLOOD
                                </button>
                            )}
                        </div>

                        <p className="text-[10px] font-bold text-gray-300 italic tracking-widest uppercase">{req.date}</p>
                    </div>
                </div>

                {/* Acceptance Notification Alert */}
                {req.status === 'Accepted' && (
                   <div className="mt-6 flex items-center gap-3 bg-blue-50 p-4 rounded-2xl border border-blue-100 animate-in zoom-in">
                      <div className="bg-blue-600 p-1.5 rounded-full text-white"><AlertCircle size={14}/></div>
                      <p className="text-xs font-bold text-blue-600 italic">
                        A donor hero has accepted your request! They are preparing the donation now.
                      </p>
                   </div>
                )}
            </div>
          )) : (
            <div className="text-center py-24 bg-slate-50 rounded-[48px] border-2 border-dashed border-gray-100">
                <Droplet size={48} className="text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-black text-lg">No Active History Found.</p>
                <p className="text-gray-400 text-xs italic mt-1 uppercase tracking-widest">Your health journey starts here.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

// Sub-component for Stats
const StatCard = ({ icon, label, value, color }) => (
  <div className={`${color} p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group transition-all hover:scale-[1.02]`}>
    <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:scale-110 transition duration-500 group-hover:rotate-12">
        {React.cloneElement(icon, { size: 100 })}
    </div>
    <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">{label}</p>
        <h4 className="text-5xl font-black tracking-tighter">{value}</h4>
    </div>
  </div>
);

export default RequesterDashboard;