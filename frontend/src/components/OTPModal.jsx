import React, { useState } from 'react';
import { API_URL } from '../config'; 
import { toast } from 'sonner';
import { ShieldCheck, RefreshCcw, Loader2 } from 'lucide-react';

const OTPModal = ({ email, onVerify, onClose, onResend }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    // 1. Basic Validation
    if (otp.length !== 4) return toast.error("Please enter the 4-digit code sent to your email.");
    
    setLoading(true); // Loading starts here

    try {
      // 2. First, verify the OTP with backend
      const res = await fetch(`${API_URL}/api/check-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email, 
          otp: otp      
        })
      });
      
      const data = await res.json();

      if (data.success) {
        // 3. OTP is correct! 
        // Now we call onVerify() and WAIT for the registration to complete.
        // This is the "await" that prevents the button from reverting.
        await onVerify(); 
        
        // Note: Success aana parent component intha Modal-ah unmount (remove) pannidum.
        // So namma inga setLoading(false) panna thevai illai.
      } else {
        // If OTP is wrong
        toast.error(data.message || "Invalid OTP! Please check your email.");
        setLoading(false); // Revert button only on wrong OTP
      }
    } catch (err) {
      console.toast.error("Verification Error:", err);
      toast.error("Connection error. Please check if the server is running.");
      setLoading(false); // Revert button on network error
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[2000] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300 border border-white/20">
        
        {/* Icon Section */}
        <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
           <ShieldCheck size={40} className="text-red-600" />
        </div>

        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Verify Identity</h2>
        <p className="text-gray-400 text-xs mt-2 px-4 leading-relaxed">
            We've sent a secure 4-digit code to <br/>
            <span className="text-slate-800 font-bold break-all">{email}</span>
        </p>

        {/* OTP Input Field */}
        <input 
           type="text" 
           maxLength="4"
           inputMode="numeric"
           disabled={loading} // Disable input while verifying
           className={`w-full mt-8 p-5 rounded-3xl bg-slate-50 border-2 outline-none text-center text-3xl font-black tracking-[15px] transition-all ${
             loading ? 'opacity-50 border-transparent' : 'focus:border-red-500 border-transparent'
           }`}
           placeholder="0000"
           value={otp}
           onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} // Only numbers allowed
        />

        {/* Action Button */}
        <button 
          onClick={handleCheck}
          disabled={loading}
          className={`w-full py-5 rounded-[24px] font-black mt-6 shadow-xl transition-all duration-300 flex items-center justify-center gap-2 ${
            loading 
            ? 'bg-slate-800 text-white opacity-100 cursor-not-allowed' 
            : 'bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-red-100'
          }`}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              VERIFYING...
            </>
          ) : (
            "CONFIRM & REGISTER"
          )}
        </button>

        {/* Resend Option */}
        {!loading && (
            <button 
                onClick={onResend} 
                className="mt-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2 mx-auto hover:text-red-600 transition-colors group"
            >
                <RefreshCcw size={12} className="group-hover:rotate-180 transition-transform duration-500" /> 
                Resend Verification Code
            </button>
        )}

        {/* Close Button (Only if not loading) */}
        {!loading && (
            <button 
                onClick={onClose}
                className="mt-4 text-[10px] font-bold text-slate-300 uppercase hover:text-slate-500 transition-colors"
            >
                Cancel the Registration
            </button>
        )}
      </div>
    </div>
  );
};

export default OTPModal;