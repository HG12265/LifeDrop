import React, { useEffect, useState } from 'react';
import { API_URL } from '../config';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal'; // PUDHU IMPORT
import { 
  Users, Droplets, Activity, Clock, Megaphone, 
  Send, Trash2, ShieldCheck, AlertCircle, Database, Tent, X
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  
  // Broadcast States
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [allBroadcasts, setAllBroadcasts] = useState([]);

  // --- MODAL STATES ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBroadcastId, setSelectedBroadcastId] = useState(null);

  // 1. Fetch System Stats & Activity
  const fetchAdminData = () => {
    fetch(`${API_URL}/api/admin/stats`)
      .then(res => res.json())
      .then(val => setData(val))
      .catch(err => console.error("Admin fetch error:", err));
  };

  // 2. Fetch All Sent Broadcasts
  const fetchBroadcasts = () => {
    fetch(`${API_URL}/api/broadcasts`)
      .then(res => res.json())
      .then(data => setAllBroadcasts(data))
      .catch(err => console.error("Broadcast fetch error:", err));
  };

  useEffect(() => {
    fetchAdminData();
    fetchBroadcasts();
    const interval = setInterval(() => {
        fetchAdminData();
    }, 10000); 
    return () => clearInterval(interval);
  }, []);

  // 3. Send New Broadcast
  const sendBroadcast = async () => {
    if(!broadcastMsg.trim()) return toast.error("Please type a message!");
    
    const res = await fetch(`${API_URL}/api/admin/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: broadcastMsg })
    });
    
    if(res.ok) {
      setBroadcastMsg("");
      fetchBroadcasts();
      toast.success("Emergency Alert Dispatched Globally! 📢");
    }
  };

  // --- DELETE MODAL LOGIC ---
  const triggerDeleteModal = (id) => {
    setSelectedBroadcastId(id);
    setShowDeleteModal(true);
  };

  const finalizeDelete = async () => {
    setShowDeleteModal(false);
    try {
      const res = await fetch(`${API_URL}/api/broadcast/delete/${selectedBroadcastId}`, {
        method: 'DELETE'
      });
      if(res.ok) {
        toast.success("Broadcast removed from all users.");
        fetchBroadcasts();
      }
    } catch (err) {
      toast.error("Error deleting broadcast.");
    }
  };

  if (!data) return (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-white font-black italic text-2xl animate-pulse uppercase tracking-tighter">
        Accessing System Data...
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* CUSTOM DELETE CONFIRM MODAL */}
      <ConfirmModal 
        isOpen={showDeleteModal}
        title="Remove Broadcast?"
        message="Are you sure you want to delete this emergency alert? It will be removed from all user dashboards immediately."
        confirmText="YES, DELETE ALERT"
        onConfirm={finalizeDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl gap-4">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter">System Monitoring Dashboard</h2>
          <p className="text-xs font-bold text-red-500 uppercase tracking-widest mt-1">LifeDrop Management Portal</p>
        </div>
        <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md border border-white/10">
            <ShieldCheck size={32} className="text-red-600" />
        </div>
      </div>

      {/* --- FEATURE: GLOBAL EMERGENCY BROADCAST --- */}
      <div className="bg-red-50 p-6 md:p-8 rounded-[40px] border-2 border-dashed border-red-200 relative overflow-hidden group">
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
                <div className="bg-red-600 p-2 rounded-xl text-white animate-bounce">
                    <Megaphone size={20} />
                </div>
                <h3 className="font-black text-red-700 uppercase tracking-widest text-sm italic">Global Emergency Broadcast</h3>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <input 
                    type="text" 
                    value={broadcastMsg}
                    placeholder="Type urgent blood requirement or system alerts here..."
                    className="flex-1 p-5 rounded-[24px] border-2 border-transparent focus:border-red-300 outline-none font-bold text-gray-700 shadow-inner"
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                />
                <button 
                    onClick={sendBroadcast}
                    className="bg-red-600 text-white px-10 py-5 rounded-[24px] font-black flex items-center justify-center gap-2 shadow-xl shadow-red-200 hover:bg-red-700 transition active:scale-95"
                >
                    <Send size={20} /> DISPATCH
                </button>
            </div>

            {/* Active Alerts List */}
            {allBroadcasts.length > 0 && (
                <div className="mt-8">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3">Live Dispatched Alerts ({allBroadcasts.length})</p>
                    <div className="flex flex-wrap gap-3">
                        {allBroadcasts.map((b) => (
                            <div key={b.id} className="bg-white p-3 pl-5 rounded-2xl flex items-center gap-4 shadow-sm border border-red-100 animate-in slide-in-from-left">
                                <span className="text-sm font-bold text-gray-600">{b.message}</span>
                                <button 
                                    onClick={() => triggerDeleteModal(b.id)} // TRIGGER MODAL
                                    className="p-2 hover:bg-red-50 rounded-xl text-red-300 hover:text-red-600 transition"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
        <Megaphone size={150} className="absolute right-[-20px] top-[-20px] opacity-[0.03] -rotate-12" />
      </div>

      {/* STATS GRID - 7 Clickable Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminCard 
          label="Total Users" value={data.stats.donors + data.stats.requesters} 
          icon={<Users size={24}/>} color="bg-slate-800" 
          onClick={() => navigate('/admin/details/users')} 
        />
        <AdminCard 
          label="Registered Donors" value={data.stats.donors} 
          icon={<Users size={24}/>} color="bg-blue-600" 
          onClick={() => navigate('/admin/details/donors')} 
        />
        <AdminCard 
          label="Active Requests" value={data.stats.pending} 
          icon={<AlertCircle size={24}/>} color="bg-orange-500" 
          onClick={() => navigate('/admin/details/requests?type=active')} 
        />
        <AdminCard 
          label="Life Saves" value={data.stats.completed} 
          icon={<Droplets size={24}/>} color="bg-green-600" 
          onClick={() => navigate('/admin/details/requests?type=completed')} 
        />
        <AdminCard 
          label="Inventory Stock" value="Bank" 
          icon={<Database size={24}/>} color="bg-rose-500" 
          onClick={() => navigate('/admin/inventory')} 
        />
        <AdminCard 
          label="System Insights" value="Chart" 
          icon={<Activity size={24}/>} color="bg-indigo-600" 
          onClick={() => navigate('/admin/analytics')} 
        />
        <AdminCard 
          label="Camp Events" value="Live" 
          icon={<Tent size={24}/>} color="bg-emerald-600" 
          onClick={() => navigate('/admin/camps')} 
        />
      </div>

      {/* REAL-TIME MONITORING TABLE */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Clock className="text-red-600" />
                <h3 className="font-black text-gray-800 text-xl italic uppercase tracking-tighter">Live Activity Feed</h3>
            </div>
            <div className="bg-green-100 text-green-600 text-[10px] font-black px-4 py-1 rounded-full animate-pulse">
                REAL-TIME
            </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="p-6">Request ID</th>
                <th className="p-6">Patient Name</th>
                <th className="p-6">Blood Group</th>
                <th className="p-6">Hospital Location</th>
                <th className="p-6">Live Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.recent.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition group">
                  <td className="p-6 font-bold text-gray-400 text-xs tracking-widest">#{req.id}</td>
                  <td className="p-6 font-black text-gray-800 tracking-tight">{req.patient}</td>
                  <td className="p-6 text-center">
                    <span className="bg-red-50 text-red-600 px-4 py-1 rounded-xl font-black text-xs border border-red-100 inline-block">{req.blood}</span>
                  </td>
                  <td className="p-6 text-[10px] font-bold text-gray-500 italic uppercase leading-tight max-w-[150px]">{req.hospital}</td>
                  <td className="p-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm flex items-center justify-center w-fit gap-1 ${
                      req.status === 'Completed' ? 'bg-green-600 text-white' :
                      req.status === 'On the way' ? 'bg-blue-600 text-white animate-pulse' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {req.status === 'On the way' && <Activity size={10} />} {req.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Reusable Admin Card Component
const AdminCard = ({ label, value, icon, color, onClick }) => (
  <div 
    onClick={onClick}
    className={`${color} p-8 rounded-[40px] text-white shadow-2xl flex flex-col justify-between h-52 relative overflow-hidden group cursor-pointer hover:scale-[1.03] transition-all duration-300 active:scale-95`}
  >
    <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:scale-110 transition duration-700 group-hover:rotate-12">
        {React.cloneElement(icon, { size: 140 })}
    </div>
    
    <div className="flex items-center gap-2 bg-white/10 w-fit px-4 py-1.5 rounded-full backdrop-blur-md border border-white/5 relative z-10">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
    
    <div className="relative z-10">
        <h4 className="text-5xl font-black tracking-tighter mt-4">{value}</h4>
        <div className="text-[9px] font-bold opacity-0 group-hover:opacity-60 transition-all duration-300 uppercase tracking-widest mt-2 flex items-center gap-1">
          Detailed Analytics <span className="text-lg">→</span>
        </div>
    </div>
  </div>
);

export default AdminDashboard;