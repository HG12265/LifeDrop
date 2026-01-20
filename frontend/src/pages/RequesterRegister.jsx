import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, ShieldAlert, ArrowRight, UserPlus } from 'lucide-react';
import OTPModal from '../components/OTPModal';

const RequesterRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ fullName: '', phone: '', email: '', password: '' });
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Send OTP logic
  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/verify/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      if (res.ok) {
        setShowOTP(true);
      } else {
        alert("Failed to send OTP. Please check your email address.");
      }
    } catch (err) {
      alert("Network error. Is Flask running?");
    } finally {
      setLoading(false);
    }
  };

  // 2. Final Registration Logic (After OTP Success)
  const finalizeRegistration = async () => {
    try {
      const res = await fetch('http://localhost:5000/register/requester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(`Account Verified! Welcome, Your ID is #${data.unique_id}`);
        navigate('/login');
      } else {
        alert(data.message || "Registration failed.");
      }
    } catch (err) {
      alert("Registration error. Try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 md:p-10 animate-in fade-in zoom-in duration-500">
      
      {/* OTP MODAL INTEGRATION */}
      {showOTP && (
        <OTPModal 
          email={formData.email} 
          onVerify={finalizeRegistration} 
          onClose={() => setShowOTP(false)}
          onResend={handleInitialSubmit}
        />
      )}

      <div className="bg-white shadow-2xl rounded-[40px] overflow-hidden border border-gray-100">
        
        {/* Modern Header */}
        <div className="bg-red-600 p-8 text-white text-center">
            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white">
                <UserPlus size={36} className="text-red-500" />
            </div>
            <h2 className="text-3xl font-black italic tracking-tighter">Requester Sign Up</h2>
            <p className="text-[10px] font-black text-white uppercase tracking-widest mt-1">Emergency Access Portal</p>
            {/* Background design element */}
            <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-red-600/20 rounded-full blur-3xl"></div>
        </div>

        <form onSubmit={handleInitialSubmit} className="p-8 space-y-5">
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-1">
                <User size={10}/> Full Name
            </label>
            <input 
              type="text" 
              placeholder="Enter your name" 
              className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-red-200 font-bold text-gray-700 transition-all focus:bg-white focus:ring-2 ring-red-50"
              onChange={e => setFormData({...formData, fullName: e.target.value})} 
              required 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-1">
                <Phone size={10}/> Mobile Number
            </label>
            <input 
              type="tel" 
              placeholder="+91 00000 00000" 
              className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-red-200 font-bold text-gray-700 transition-all focus:bg-white focus:ring-2 ring-red-50"
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              required 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-1">
                <Mail size={10}/> Email Address
            </label>
            <input 
              type="email" 
              placeholder="example@mail.com" 
              className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-red-200 font-bold text-gray-700 transition-all focus:bg-white focus:ring-2 ring-red-50"
              onChange={e => setFormData({...formData, email: e.target.value})} 
              required 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-1">
                <Lock size={10}/> Create Password
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-red-200 font-bold text-gray-700 transition-all focus:bg-white focus:ring-2 ring-red-50"
              onChange={e => setFormData({...formData, password: e.target.value})} 
              required 
            />
          </div>

          {/* Alert Message */}
          <div className="flex gap-3 bg-red-50 p-4 rounded-2xl border border-red-100">
             <ShieldAlert size={20} className="text-red-500 shrink-0" />
             <p className="text-[9px] font-bold text-red-700 leading-relaxed">
               By creating an account, you agree that LifeDrop is a connector platform. Please verify medical details manually before donation.
             </p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full bg-red-600 text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-red-100 hover:bg-red-700 transition-all flex items-center justify-center gap-2 mt-4 active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? "SENDING CODE..." : "VERIFY & SIGN UP"}
            <ArrowRight size={20} />
          </button>

          <p className="text-center mt-6 text-xs text-gray-400 font-medium">
            Already have an account? <span className="text-red-600 font-black cursor-pointer hover:underline" onClick={() => navigate('/login')}>Login</span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RequesterRegister;