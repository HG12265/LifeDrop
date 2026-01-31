import React, { useState, useEffect } from 'react';
import { API_URL } from '../config'; 
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import LocationPicker from '../components/LocationPicker';
import SuccessModal from '../components/SuccessModal';
import OTPModal from '../components/OTPModal'; 
import { 
  Activity, ShieldCheck, ShieldAlert, User, Mail, 
  Phone, Lock, Calendar, Droplet, ArrowRight, UserPlus 
} from 'lucide-react';

const DonorRegister = () => {
  const navigate = useNavigate();
  
  // --- MODAL & LOADING STATES ---
  const [showModal, setShowModal] = useState(false); 
  const [showOTP, setShowOTP] = useState(false); 
  const [registeredId, setRegisteredId] = useState(''); 
  const [loading, setLoading] = useState(false);

  // --- MAP & HEALTH STATES ---
  const [position, setPosition] = useState({ lat: 13.0827, lng: 80.2707 });
  const [healthScore, setHealthScore] = useState(100);
  
  const [formData, setFormData] = useState({
    fullName: '', phone: '', email: '', password: '', bloodGroup: '', dob: '',
    weight: true, alcohol: false, surgery: false, tattoo: false, medication: false
  });

  // Health Score Calculation Logic
  useEffect(() => {
    let score = 100;
    if (!formData.weight) score -= 30;
    if (formData.alcohol) score -= 20;
    if (formData.surgery) score -= 25;
    if (formData.tattoo) score -= 15;
    if (formData.medication) score -= 10;
    setHealthScore(score < 0 ? 0 : score);
  }, [formData]);

  // STEP 1: Initial Submit (Sends OTP)
  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/verify/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      if (res.ok) {
        setShowOTP(true);
      } else {
        toast.error(data.message || "Failed to send OTP.");
      }
    } catch (err) {
      toast.error("Error connecting to server. Please check if backend is live.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Final Registration (Runs after OTP Success)
  const finalizeRegistration = async () => {
    setLoading(true);
    const finalData = {
      ...formData,
      lat: position.lat,
      lng: position.lng,
      healthScore: healthScore
    };

    try {
      const res = await fetch(`${API_URL}/register/donor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
      });
      const data = await res.json();
      if (res.ok && data.unique_id) {
        setRegisteredId(data.unique_id);
        setShowOTP(false);
        setShowModal(true);
      } else {
        toast.error(data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      toast.error("Registration error occurred.");
      throw err; // Essential for OTPModal loading state
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 relative animate-in fade-in zoom-in duration-500">
      
      {/* GLOBAL MODALS */}
      {showOTP && (
        <OTPModal 
          email={formData.email} 
          onVerify={finalizeRegistration} 
          onClose={() => setShowOTP(false)}
          onResend={handleInitialSubmit}
        />
      )}

      {showModal && (
        <SuccessModal userId={registeredId} type="donor" onClose={() => navigate('/login')} />
      )}

      <div className={`bg-white shadow-2xl rounded-[48px] overflow-hidden border border-gray-100 ${(showModal || showOTP) ? 'blur-sm pointer-events-none' : ''}`}>
        
        {/* Modern Header Section */}
        <div className="bg-slate-900 p-8 md:p-12 text-white text-center relative overflow-hidden border-b-8 border-red-600">
            <div className="bg-white/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/10">
                <UserPlus size={36} className="text-red-500" />
            </div>
            <h2 className="text-4xl font-black italic tracking-tighter uppercase">Become a Hero</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2 italic">LifeDrop Hero Registration Portal</p>
            <div className="absolute top-[-20px] left-[-20px] w-32 h-32 bg-red-600/10 rounded-full blur-3xl"></div>
        </div>

        <form onSubmit={handleInitialSubmit} className="p-6 md:p-12 space-y-12">
          
          {/* TOP BLOCK: Identity Details (Responsive Grid) */}
          <div className="space-y-6">
            <h3 className="font-black text-gray-800 text-lg flex items-center gap-2 uppercase tracking-tighter border-b pb-2 border-gray-50">
                <User size={18} className="text-red-600"/> Identity Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {/* Full Name */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-4 text-gray-400 group-focus-within:text-red-500 transition-colors" size={18}/>
                    <input type="text" placeholder="e.g. John Doe" className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-red-100 focus:bg-white outline-none font-bold text-gray-700 transition-all shadow-inner" onChange={e => setFormData({...formData, fullName: e.target.value})} required />
                  </div>
               </div>
               
               {/* Phone */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Phone Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-4 text-gray-400 group-focus-within:text-red-500 transition-colors" size={18}/>
                    <input type="tel" placeholder="+91" className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-red-100 focus:bg-white outline-none font-bold text-gray-700 transition-all shadow-inner" onChange={e => setFormData({...formData, phone: e.target.value})} required />
                  </div>
               </div>

               {/* Email */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-4 text-gray-400 group-focus-within:text-red-500 transition-colors" size={18}/>
                    <input type="email" placeholder="mail@example.com" className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-red-100 focus:bg-white outline-none font-bold text-gray-700 transition-all shadow-inner" onChange={e => setFormData({...formData, email: e.target.value})} required />
                  </div>
               </div>

               {/* Password */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Security Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-4 text-gray-400 group-focus-within:text-red-500 transition-colors" size={18}/>
                    <input type="password" placeholder="••••••••" className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-red-100 focus:bg-white outline-none font-bold text-gray-700 transition-all shadow-inner" onChange={e => setFormData({...formData, password: e.target.value})} required />
                  </div>
               </div>
               
               {/* Blood Group */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Select Blood Group</label>
                  <div className="relative group">
                    <Droplet className="absolute left-4 top-4 text-red-500 transition-colors" size={18}/>
                    <select className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-red-100 focus:bg-white outline-none font-bold text-gray-700 appearance-none cursor-pointer transition-all shadow-inner" onChange={e => setFormData({...formData, bloodGroup: e.target.value})} required>
                        <option value="">Choose Group</option>
                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
               </div>

               {/* Date of Birth */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-1 tracking-widest">
                      <Calendar size={10}/> Date of Birth (DOB)
                  </label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-4 text-gray-400 group-focus-within:text-red-500 transition-colors" size={18}/>
                    <input type="date" className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-red-100 focus:bg-white outline-none font-bold text-gray-400 transition-all shadow-inner cursor-pointer" onChange={e => setFormData({...formData, dob: e.target.value})} required />
                  </div>
               </div>
            </div>
          </div>

          {/* MAIN GRID: Desktop 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* LEFT SIDE: Location & Legal */}
            <div className="space-y-8 flex flex-col h-full">
               <div className="flex-1">
                  <h3 className="font-black text-gray-800 text-lg flex items-center gap-2 uppercase tracking-tighter mb-6 border-b pb-2 border-gray-50">
                      <ShieldCheck size={18} className="text-blue-600"/> Current Location
                  </h3>
                  <LocationPicker position={position} setPosition={setPosition} />
               </div>

               {/* Legal Disclaimer */}
               <div className="flex gap-4 bg-red-50 p-6 rounded-[32px] border border-red-100 mt-auto shadow-sm">
                  <ShieldAlert size={28} className="text-red-600 shrink-0" />
                  <p className="text-[11px] font-bold text-red-800 leading-relaxed uppercase tracking-tight">
                    By creating a hero account, you confirm that all information provided is true. LifeDrop is a connector platform; please verify medical details manually before donation.
                  </p>
               </div>
            </div>

            {/* RIGHT SIDE: Health & Eligibility */}
            <div className="space-y-8 flex flex-col h-full">
                {/* Health Score Card */}
                <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl border-b-4 border-red-600">
                   <Activity className="absolute right-[-10px] bottom-[-10px] opacity-10" size={120} />
                   <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-2">Medical Trust Rating</p>
                   <div className="flex items-end gap-2">
                      <h4 className="text-6xl font-black italic tracking-tighter">{healthScore}%</h4>
                      <span className="text-xs font-bold opacity-50 mb-2 uppercase tracking-widest leading-none border-l pl-2 border-white/20">Safe Score</span>
                   </div>
                   <div className="mt-6 w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-red-600 h-full transition-all duration-1000" style={{ width: `${healthScore}%` }}></div>
                   </div>
                </div>

                {/* Eligibility Grid */}
                <div>
                   <h3 className="font-black text-gray-800 text-lg flex items-center gap-2 uppercase tracking-tighter mb-6 border-b pb-2 border-gray-50">
                       <ShieldCheck size={18} className="text-green-600"/> Eligibility Screening
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <HealthCheck label="Weight > 50kg" checked={formData.weight} onChange={() => setFormData({...formData, weight: !formData.weight})} />
                     <HealthCheck label="No alcohol (24h)" checked={!formData.alcohol} onChange={() => setFormData({...formData, alcohol: !formData.alcohol})} />
                     <HealthCheck label="No surgery (6m)" checked={!formData.surgery} onChange={() => setFormData({...formData, surgery: !formData.surgery})} />
                     <HealthCheck label="No Tattoos (6m)" checked={!formData.tattoo} onChange={() => setFormData({...formData, tattoo: !formData.tattoo})} />
                   </div>
                </div>

                {/* Submit Action */}
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-red-600 text-white py-6 rounded-[28px] font-black text-xl shadow-xl shadow-red-100 hover:bg-red-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mt-auto uppercase tracking-widest"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        PROCESSING...
                    </div>
                  ) : (
                    <>
                        Get Verified & Join
                        <ArrowRight size={24} />
                    </>
                  )}
                </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

// Reusable Health Check Component
const HealthCheck = ({ label, checked, onChange }) => (
  <label className={`flex justify-between items-center p-5 rounded-3xl border-2 cursor-pointer transition-all duration-300 ${checked ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-gray-50 border-transparent opacity-60'}`}>
    <span className={`text-[10px] font-black uppercase tracking-tight ${checked ? 'text-green-700' : 'text-gray-400'}`}>{label}</span>
    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${checked ? 'bg-green-600 border-green-600' : 'border-gray-200 bg-white'}`}>
       {checked && <ShieldCheck size={14} className="text-white" />}
    </div>
    <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
  </label>
);

export default DonorRegister;