import React, { useState } from 'react';
import { API_URL } from '../config'; 
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { User, Mail, Phone, Lock, ShieldAlert, ArrowRight, UserPlus, ShieldCheck } from 'lucide-react';
import OTPModal from '../components/OTPModal';

const RequesterRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ fullName: '', phone: '', email: '', password: '' });
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Send OTP logic via Brevo
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
        toast.error(data.message || "Failed to send OTP. Please check your email address.");
      }
    } catch (err) {
      toast.error("Network error. Is Flask running?");
    } finally {
      setLoading(false);
    }
  };

  // 2. Final Registration Logic (Runs after OTP verification)
const finalizeRegistration = async () => {
  setLoading(true);
  try {
    const res = await fetch(`${API_URL}/register/requester`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await res.json();

    if (res.ok) {
      // 1. Success aana Modal-ah close pannidalam
      setShowOTP(false); 
      
      toast.success(`Account Verified! Welcome, Your ID is #${data.unique_id}`);
      
      // 2. Adhukku apram login-ku navigate pannalam
      navigate('/login');
    } else {
      // 3. Backend error vandha alert panni, error-ah throw pannanum
      toast.error(data.message || "Registration failed.");
      throw new Error(data.message || "Registration failed");
    }
  } catch (err) {
    // 4. Network error or throw panna error-ah inga handle panni thirumba throw pannanum
    // Appo thaan OTP Modal-oda loading stop aagum
    if (err.message !== "Registration failed") {
      toast.error("Registration error. Try again.");
    }
    throw err; 
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 relative animate-in fade-in zoom-in duration-500">
      
      {/* OTP MODAL INTEGRATION */}
      {showOTP && (
        <OTPModal 
          email={formData.email} 
          onVerify={finalizeRegistration} 
          onClose={() => setShowOTP(false)}
          onResend={handleInitialSubmit}
        />
      )}

      <div className={`bg-white shadow-2xl rounded-[48px] overflow-hidden border border-gray-100 ${showOTP ? 'blur-sm pointer-events-none' : ''}`}>
        
        {/* Modern Header Section */}
        <div className="bg-slate-900 p-10 md:p-14 text-white text-center relative overflow-hidden">
            <div className="bg-white/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/10">
                <UserPlus size={36} className="text-red-500" />
            </div>
            <h2 className="text-4xl font-black italic tracking-tighter uppercase">Requester Sign Up</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2 italic">LifeDrop Emergency Portal</p>
            {/* Design Element */}
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-red-600/10 rounded-full blur-3xl"></div>
        </div>

        <form onSubmit={handleInitialSubmit} className="p-8 md:p-12 space-y-10">
          
          <div className="space-y-6">
            <h3 className="font-black text-gray-800 text-lg flex items-center gap-2 uppercase tracking-tighter border-b pb-2 border-gray-50">
                <ShieldCheck size={18} className="text-red-600"/> Account Details
            </h3>

            {/* RESPONSIVE GRID: Mobile 1 Col, Desktop 2 Cols */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-1 tracking-widest">
                    <User size={10}/> Full Name
                </label>
                <div className="relative group">
                    <User className="absolute left-4 top-4 text-gray-400 group-focus-within:text-red-500 transition-colors" size={18}/>
                    <input 
                      type="text" 
                      placeholder="Enter your name" 
                      className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-red-100 focus:bg-white outline-none font-bold text-gray-700 transition-all shadow-inner"
                      onChange={e => setFormData({...formData, fullName: e.target.value})} 
                      required 
                    />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-1 tracking-widest">
                    <Phone size={10}/> Mobile Number
                </label>
                <div className="relative group">
                    <Phone className="absolute left-4 top-4 text-gray-400 group-focus-within:text-red-500 transition-colors" size={18}/>
                    <input 
                      type="tel" 
                      placeholder="+91 00000 00000" 
                      className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-red-100 focus:bg-white outline-none font-bold text-gray-700 transition-all shadow-inner"
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      required 
                    />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-1 tracking-widest">
                    <Mail size={10}/> Email ID
                </label>
                <div className="relative group">
                    <Mail className="absolute left-4 top-4 text-gray-400 group-focus-within:text-red-500 transition-colors" size={18}/>
                    <input 
                      type="email" 
                      placeholder="example@mail.com" 
                      className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-red-100 focus:bg-white outline-none font-bold text-gray-700 transition-all shadow-inner"
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      required 
                    />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-1 tracking-widest">
                    <Lock size={10}/> Create Password
                </label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-4 text-gray-400 group-focus-within:text-red-500 transition-colors" size={18}/>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-red-100 focus:bg-white outline-none font-bold text-gray-700 transition-all shadow-inner"
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                      required 
                    />
                </div>
              </div>
            </div>
          </div>

          {/* Legal Alert Message */}
          <div className="flex gap-4 bg-red-50 p-6 rounded-[32px] border border-red-100 shadow-sm">
             <ShieldAlert size={28} className="text-red-600 shrink-0" />
             <p className="text-[11px] font-bold text-red-800 leading-relaxed uppercase tracking-tight">
               By creating an account, you agree that LifeDrop is a connector platform. Please verify medical details and donor identity manually before the extraction process.
             </p>
          </div>

          {/* Submit Action */}
          <div className="flex flex-col items-center gap-6">
            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-red-600 text-white py-6 rounded-[28px] font-black text-xl shadow-xl shadow-red-100 hover:bg-red-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {loading ? "SENDING VERIFICATION..." : "VERIFY & SIGN UP"}
              <ArrowRight size={24} />
            </button>

            <p className="text-center text-xs text-gray-400 font-bold uppercase tracking-widest">
                Already part of the mission? 
                <span className="text-red-600 font-black cursor-pointer hover:underline ml-2" onClick={() => navigate('/login')}>
                    Sign In
                </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequesterRegister;