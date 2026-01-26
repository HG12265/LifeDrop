import React, { useState } from 'react';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, Lock, ArrowRight, KeyRound } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (res.ok) setStep(2);
    else alert("Email not found!");
    setLoading(false);
  };

  // Step 2 & 3: Verify and Reset
  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, new_password: newPassword })
    });
    if (res.ok) {
      alert("Password Reset Success! Please Login.");
      navigate('/login');
    } else {
      alert("Invalid OTP or Error!");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 md:p-10 mt-10 animate-in fade-in zoom-in duration-500">
      <div className="bg-white shadow-2xl rounded-[40px] overflow-hidden border border-gray-100">
        <div className="bg-slate-900 p-8 text-white text-center">
          <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <KeyRound size={32} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-black italic">Account Recovery</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Reset your secure password</p>
        </div>

        <div className="p-8">
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <p className="text-xs text-gray-500 text-center mb-4">Enter your registered email to receive a reset code.</p>
              <div className="relative">
                <Mail className="absolute left-4 top-4 text-gray-400" size={18}/>
                <input type="email" placeholder="Email Address" className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-none outline-red-200 font-bold" onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2">
                {loading ? "SENDING..." : "SEND RESET CODE"} <ArrowRight size={18}/>
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-5 text-center">
              <p className="text-xs text-gray-500">Enter the 4-digit code sent to <br/><span className="font-bold text-slate-800">{email}</span></p>
              <input type="text" maxLength="4" placeholder="0000" className="w-full p-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-red-500 outline-none text-center text-3xl font-black tracking-[15px]" onChange={e => setOtp(e.target.value)} required />
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black">VERIFY CODE</button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleReset} className="space-y-5">
              <p className="text-xs text-gray-500 text-center">Create a strong new password.</p>
              <div className="relative">
                <Lock className="absolute left-4 top-4 text-gray-400" size={18}/>
                <input type="password" placeholder="New Password" className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-none outline-red-200 font-bold" onChange={e => setNewPassword(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-4 rounded-2xl font-black shadow-lg">
                {loading ? "UPDATING..." : "UPDATE PASSWORD"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;