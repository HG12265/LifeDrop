import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { API_URL } from '../config'; 
import ConfirmModal from '../components/ConfirmModal'; // PUDHU IMPORT
import { 
  Plus, Clock, CheckCircle2, MapPin, History, 
  Droplet, Truck, AlertCircle, Link2, ShieldCheck, Phone 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RequesterDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });

  // --- MODAL STATES ---
  const [showReceivedModal, setShowReceivedModal] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState(null);

  // 1. Data Fetching Logic
  const fetchHistory = () => {
    fetch(`${API_URL}/api/requester/history/${user.unique_id}`)
      .then(res => res.json())
      .then(data => {
        setHistory(data);
        const total = data.length;
        const pending = data.filter(r => r.status !== 'Completed' && r.status !== 'Rejected').length;
        const completed = data.filter(r => r.status === 'Completed').length;
        setStats({ total, pending, completed });
      })
      .catch(err => console.error("Error fetching history:", err));
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000); 
    return () => clearInterval(interval);
  }, [user.unique_id]);

  // 2. Trigger Modal Function
  const triggerReceivedModal = (reqId) => {
    setSelectedReqId(reqId);
    setShowReceivedModal(true);
  };

  // 3. Final API Call (After Modal Confirmation)
  const finalizeReceived = async () => {
    setShowReceivedModal(false);
    try {
      const res = await fetch(`${API_URL}/api/request/complete/${selectedReqId}`, {
        method: 'POST',
      });
      if (res.ok) {
        toast.success("Life Saved! Case Closed Successfully.");
        fetchHistory();
      }
    } catch (err) {
      toast.error("Connection error. Please try again.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* CUSTOM RECEIVED CONFIRMATION MODAL */}
      <ConfirmModal 
        isOpen={showReceivedModal}
        type="success" // Green theme for success action
        title="Confirm Blood Receipt"
        message="Are you sure you have received the blood? This will officially close the request and notify the donor hero."
        confirmText="YES, I RECEIVED IT"
        onConfirm={finalizeReceived}
        onCancel={() => setShowReceivedModal(false)}
      />

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

      {/* 2. STATS CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard icon={<History size={20}/>} label="Total Requests" value={stats.total} color="bg-slate-900" />
          <StatCard icon={<Droplet size={20}/>} label="Active Requests" value={stats.pending} color="bg-red-600" />
          <StatCard icon={<CheckCircle2 size={20}/>} label="Closed Requests" value={stats.completed} color="bg-green-600" />
      </div>

      {/* 3. REQUEST TIMELINE SECTION */}
      <div className="bg-white rounded-[40px] p-6 md:p-10 border border-gray-100 shadow-2xl">
        <h3 className="font-black text-gray-800 text-xl mb-8 flex items-center gap-2 italic uppercase tracking-tighter border-b pb-4">
            <Clock size={24} className="text-red-600" /> Request History & Status
        </h3>
        
        <div className="grid gap-8">
          {history.length > 0 ? history.map((req) => (
            <div key={req.id} className="group relative bg-slate-50 p-6 md:p-8 rounded-[32px] border border-gray-100 transition hover:bg-white hover:shadow-2xl hover:border-red-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    
                    <div className="flex gap-6 items-center">
                        <div className="bg-red-600 text-white w-16 h-16 rounded-[24px] flex flex-col items-center justify-center shadow-lg shadow-red-100 group-hover:scale-110 transition duration-300">
                            <span className="text-[10px] font-black opacity-60 leading-none mb-1 uppercase">Group</span>
                            <span className="text-2xl font-black leading-none">{req.bloodGroup}</span>
                        </div>
                        <div>
                            <h4 className="font-black text-gray-800 text-2xl tracking-tight leading-none">{req.patient}</h4>
                            <p className="text-xs font-bold text-gray-400 flex items-center gap-1 mt-2 uppercase tracking-widest">
                                <MapPin size={14} className="text-red-500"/> {req.hospital}
                            </p>
                        </div>
                    </div>

                    <div className="w-full md:w-auto flex flex-col items-end gap-4">
                        <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-2 border ${
                            req.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-100' :
                            req.status === 'On the way' ? 'bg-blue-600 text-white border-transparent animate-pulse shadow-blue-200 shadow-lg' :
                            req.status === 'Accepted' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            req.status === 'Rejected' ? 'bg-gray-100 text-gray-400' : 'bg-orange-50 text-orange-600 border-orange-100'
                        }`}>
                            {req.status === 'On the way' && <Truck size={12} />}
                            {req.status === 'On the way' ? 'Blood Dispatched' : req.status}
                        </div>

                        <div className="flex flex-wrap justify-end gap-3 w-full">
                            {['Accepted', 'On the way', 'Completed'].includes(req.status) && (
                                <button 
                                  onClick={() => navigate(`/blockchain/${req.id}`)}
                                  className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-black text-[9px] tracking-widest hover:bg-black transition shadow-lg"
                                >
                                  <Link2 size={14} className="text-red-500" /> VIEW BLOCKCHAIN LEDGER
                                </button>
                            )}

                            {req.status === 'On the way' && (
                                <button 
                                    onClick={() => triggerReceivedModal(req.id)} // TRIGGER MODAL
                                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-black text-[9px] tracking-widest shadow-lg shadow-green-100 hover:bg-green-700 transition active:scale-95"
                                >
                                    <CheckCircle2 size={14} /> I RECEIVED THE BLOOD
                                </button>
                            )}
                        </div>

                        <p className="text-[10px] font-bold text-gray-300 italic tracking-widest uppercase">{req.date}</p>
                    </div>
                </div>

                {req.accepted_donor && (
                  <div className="mt-6 p-5 bg-white border-2 border-dashed border-green-100 rounded-[28px] animate-in slide-in-from-top duration-500">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                          <div className="flex items-center gap-4">
                              <div className="bg-green-100 p-3 rounded-2xl text-green-600">
                                  <ShieldCheck size={24} />
                              </div>
                              <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Donor Hero Matched</p>
                                  <h4 className="font-black text-gray-800 text-lg uppercase tracking-tight">{req.accepted_donor.name}</h4>
                              </div>
                          </div>
                          
                          <a 
                              href={`tel:${req.accepted_donor.phone}`} 
                              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-black transition active:scale-95 border-b-4 border-green-600"
                          >
                              <Phone size={18} fill="white" />
                              {req.accepted_donor.phone}
                          </a>
                      </div>
                      <p className="text-[9px] font-bold text-green-600 mt-4 uppercase tracking-[0.2em] italic text-center sm:text-left">
                          * Secure connection established. You can now contact the donor.
                      </p>
                  </div>
                )}

                {req.status === 'Pending' && (
                   <div className="mt-6 flex items-center gap-3 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                      <div className="bg-orange-500 p-1.5 rounded-full text-white"><AlertCircle size={14}/></div>
                      <p className="text-xs font-bold text-orange-600 italic">
                        Searching for compatible heroes nearby. You will see donor details once they accept.
                      </p>
                   </div>
                )}
            </div>
          )) : (
            <div className="text-center py-32 bg-slate-50 rounded-[48px] border-2 border-dashed border-gray-200">
                <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                   <Droplet size={48} className="text-gray-100" />
                </div>
                <p className="text-gray-400 font-black text-xl tracking-tight">Your Dashboard is Empty</p>
                <p className="text-gray-400 text-xs italic mt-2 uppercase tracking-widest">Start saving lives by creating your first request.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className={`${color} p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group transition-all duration-500 hover:scale-[1.03]`}>
    <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:scale-110 transition duration-700 group-hover:rotate-12">
        {React.cloneElement(icon, { size: 120 })}
    </div>
    <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">{label}</p>
        <h4 className="text-5xl font-black tracking-tighter">{value}</h4>
    </div>
  </div>
);

export default RequesterDashboard;