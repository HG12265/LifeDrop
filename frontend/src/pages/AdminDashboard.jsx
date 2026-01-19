import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. MUKKIYAM
import { Users, Droplets, Activity, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate(); // 2. MUKKIYAM
  const [data, setData] = useState(null);

  const fetchAdminData = () => {
    fetch('http://localhost:5000/api/admin/stats')
      .then(res => res.json())
      .then(val => setData(val))
      .catch(err => console.error("Admin fetch error:", err));
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 10000); 
    return () => clearInterval(interval);
  }, []);

  if (!data) return (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-white font-black italic text-2xl animate-pulse">
        ACCESSING SYSTEM DATA...
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-8 animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl gap-4">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter">System Monitoring Dashboard</h2>
          <p className="text-xs font-bold text-red-500 uppercase tracking-widest mt-1">LifeDrop Management Portal</p>
        </div>
        <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md border border-white/10">
            <ShieldCheck size={32} className="text-red-600" />
        </div>
      </div>

      {/* Stats Grid - Clickable Cards */}
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
      </div>

      {/* Real-time Monitoring Table */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Clock className="text-red-600" />
                <h3 className="font-black text-gray-800 text-xl italic uppercase tracking-tighter">Live Activity Feed</h3>
            </div>
            <div className="bg-green-100 text-green-600 text-[10px] font-black px-4 py-1 rounded-full animate-pulse">
                LIVE MONITORING
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
                <tr key={req.id} className="hover:bg-slate-50 transition">
                  <td className="p-6 font-bold text-gray-400 text-xs tracking-widest">#{req.id}</td>
                  <td className="p-6 font-black text-gray-800 tracking-tight">{req.patient}</td>
                  <td className="p-6">
                    <span className="bg-red-50 text-red-600 px-3 py-1 rounded-xl font-black text-xs border border-red-100">{req.blood}</span>
                  </td>
                  <td className="p-6 text-xs font-bold text-gray-500 italic uppercase">{req.hospital}</td>
                  <td className="p-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${
                      req.status === 'Completed' ? 'bg-green-500 text-white' :
                      req.status === 'On the way' ? 'bg-blue-600 text-white animate-pulse' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {req.status}
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
    className={`${color} p-8 rounded-[40px] text-white shadow-2xl flex flex-col justify-between h-48 relative overflow-hidden group cursor-pointer hover:scale-[1.03] transition-all duration-300 active:scale-95`}
  >
    {/* Background Large Icon */}
    <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:scale-110 transition duration-500 group-hover:rotate-12">
        {React.cloneElement(icon, { size: 120 })}
    </div>
    
    <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-md">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
    
    <h4 className="text-5xl font-black tracking-tighter mt-4">{value}</h4>
    
    <div className="text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest mt-2">
      Click to view details →
    </div>
  </div>
);

export default AdminDashboard;