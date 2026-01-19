import React, { useEffect, useState } from 'react';
import { Plus, Clock, CheckCircle2, MapPin, History, Droplet, Truck, AlertCircle } from 'lucide-react';
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
        // Stats Calculation
        const total = data.length;
        const pending = data.filter(r => r.status !== 'Completed' && r.status !== 'Rejected').length;
        const completed = data.filter(r => r.status === 'Completed').length;
        setStats({ total, pending, completed });
      })
      .catch(err => console.error("Error:", err));
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000); // 10 seconds refresh
    return () => clearInterval(interval);
  }, [user.unique_id]);

  const handleComplete = async (reqId) => {
    const res = await fetch(`http://localhost:5000/api/request/complete/${reqId}`, {
      method: 'POST',
    });
    if (res.ok) {
      alert("Glad to help! Process marked as Completed.");
      fetchHistory();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-8">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tighter">Welcome, {user.name} 👋</h2>
          <p className="text-gray-500 font-bold text-sm">Track your blood requests and find heroes.</p>
        </div>
        <button 
          onClick={() => navigate('/new-request')}
          className="w-full md:w-auto bg-red-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-red-100 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition transform"
        >
          <Plus size={24} /> NEW REQUEST
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={<History size={20}/>} label="Total Requests" value={stats.total} color="bg-slate-800" />
          <StatCard icon={<Droplet size={20}/>} label="Active / Pending" value={stats.pending} color="bg-red-600" />
          <StatCard icon={<CheckCircle2 size={20}/>} label="Closed Requests" value={stats.completed} color="bg-green-600" />
      </div>

      {/* 3. REQUEST HISTORY LIST */}
      <div className="bg-white rounded-[40px] p-6 md:p-8 border border-gray-100 shadow-xl">
        <h3 className="font-black text-gray-800 text-xl mb-6 flex items-center gap-2 italic">
            <Clock size={24} className="text-red-600" /> REQUEST TIMELINE
        </h3>
        
        <div className="grid gap-6">
          {history.length > 0 ? history.map((req) => (
            <div key={req.id} className="group relative bg-slate-50 p-6 rounded-[32px] border border-gray-100 transition hover:bg-white hover:shadow-2xl hover:border-red-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    
                    {/* Left: Blood & Patient Info */}
                    <div className="flex gap-5 items-center">
                        <div className="bg-red-600 text-white w-16 h-16 rounded-[24px] flex flex-col items-center justify-center shadow-lg shadow-red-100">
                            <span className="text-xs font-black opacity-60 leading-none mb-1">TYPE</span>
                            <span className="text-2xl font-black leading-none">{req.bloodGroup}</span>
                        </div>
                        <div>
                            <h4 className="font-black text-gray-800 text-xl">{req.patient}</h4>
                            <p className="text-xs font-bold text-gray-400 flex items-center gap-1 mt-1">
                                <MapPin size={14} className="text-red-500"/> {req.hospital}
                            </p>
                        </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="w-full md:w-auto flex flex-col items-end gap-3">
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                            req.status === 'Completed' ? 'bg-green-100 text-green-600' :
                            req.status === 'On the way' ? 'bg-blue-600 text-white animate-pulse' :
                            req.status === 'Accepted' ? 'bg-blue-100 text-blue-600' :
                            req.status === 'Rejected' ? 'bg-gray-200 text-gray-500' : 'bg-orange-100 text-orange-600'
                        }`}>
                            {req.status === 'On the way' && <Truck size={12} />}
                            {req.status}
                        </div>

                        {/* ACTION BUTTON: Only show when blood is on the way */}
                        {req.status === 'On the way' && (
                            <button 
                                onClick={() => handleComplete(req.id)}
                                className="w-full md:w-auto bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg shadow-green-100 hover:bg-green-700 transition flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={16} /> BLOOD RECEIVED
                            </button>
                        )}

                        <p className="text-[10px] font-bold text-gray-300 italic tracking-wider">{req.date}</p>
                    </div>
                </div>

                {/* Status Help Text */}
                {req.status === 'Accepted' && (
                   <p className="mt-4 text-[10px] font-bold text-blue-500 flex items-center gap-1 bg-blue-50 p-2 rounded-xl">
                      <AlertCircle size={12}/> A hero has accepted your request! Waiting for donation.
                   </p>
                )}
            </div>
          )) : (
            <div className="text-center py-24 bg-slate-50 rounded-[48px] border-2 border-dashed border-gray-100">
                <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                   <Droplet size={32} className="text-gray-200" />
                </div>
                <p className="text-gray-400 font-black text-lg">No Active Requests.</p>
                <p className="text-gray-400 text-xs italic">When you need blood, click on "New Request" above.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className={`${color} p-6 rounded-[32px] text-white shadow-xl relative overflow-hidden group`}>
    <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:scale-110 transition duration-500">
        {icon}
    </div>
    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</p>
    <h4 className="text-4xl font-black mt-1 tracking-tighter">{value}</h4>
  </div>
);

export default RequesterDashboard;