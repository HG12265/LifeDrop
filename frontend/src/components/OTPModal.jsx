import React, { useState } from 'react';
import { API_URL } from '../config'; 
import { ShieldCheck, X, RefreshCcw } from 'lucide-react';

const OTPModal = ({ email, onVerify, onClose, onResend }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (otp.length !== 4) return alert("Enter 4 digits!");
    setLoading(true);
    const res = await fetch(`${API_URL}/api/check-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: email, // Form-la irukura email (Props-ah varum)
        otp: otp      // User type panna 4 digits
      }),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success) {
      onVerify(); // Parent logic-ah trigger pannum
    } else {
      alert("Wrong OTP Nanba! Check again.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[2000] p-4">
      <div className="bg-white rounded-[40px] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300">
        <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
           <ShieldCheck size={40} className="text-red-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-800">Verify Email</h2>
        <p className="text-gray-400 text-xs mt-2 px-4">We sent a 4-digit code to <br/><span className="text-slate-800 font-bold">{email}</span></p>

        <input 
           type="text" maxLength="4"
           className="w-full mt-8 p-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-red-500 outline-none text-center text-3xl font-black tracking-[15px] transition-all"
           placeholder="0000"
           onChange={(e) => setOtp(e.target.value)}
        />

        <button 
          onClick={handleCheck}
          disabled={loading}
          className="w-full bg-red-600 text-white py-5 rounded-[24px] font-black mt-6 shadow-xl shadow-red-100 hover:bg-red-700 transition"
        >
          {loading ? "VERIFYING..." : "CONFIRM & REGISTER"}
        </button>

        <button onClick={onResend} className="mt-6 text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2 mx-auto hover:text-red-600 transition">
           <RefreshCcw size={12}/> Resend Code
        </button>
      </div>
    </div>
  );
};

export default OTPModal;