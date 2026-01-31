import React, { useState } from 'react';
import { API_URL } from '../config'; 
import { useNavigate } from 'react-router-dom';
import { LogIn, UserCircle, Heart } from 'lucide-react';
import { toast } from 'sonner'; 

const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '', role: 'donor' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      // 2. RATE LIMIT CHECK (429 Error) - Changed to toast.error
      if (res.status === 429) {
          toast.error(data.message); 
          setLoading(false);
          return;
      }
      
      if (res.ok) {
        setUser(data.user); 
        
        // 3. SUCCESS TOAST - Welcome message seththurukken
        toast.success(`Welcome back, ${data.user.name}!`, {
            description: "Accessing your secure dashboard...",
        });
        
        if (data.user.role === 'admin') {
          navigate('/admin-dashboard');
        } else if (data.user.role === 'donor') {
          navigate('/donor-dashboard');
        } else {
          navigate('/requester-dashboard');
        }
      } else {
        // Error toast
        toast.error(data.message || "Invalid Credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Connection error! Please check if the server is live.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 md:p-10 animate-in fade-in duration-500">
      <div className="bg-white shadow-2xl rounded-[40px] overflow-hidden border border-gray-100">
        
        {/* Login Header */}
        <div className="bg-red-600 p-8 text-white text-center relative overflow-hidden">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <LogIn size={32} />
          </div>
          <h2 className="text-3xl font-black tracking-tight italic">Welcome Back</h2>
          <p className="opacity-70 text-[10px] font-black mt-1 uppercase tracking-[0.2em]">LifeDrop Secure Access</p>
        </div>

        <div className="p-8">
          {/* Role Selection Tabs */}
          <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8 border border-gray-200 shadow-inner">
            <button 
              type="button"
              onClick={() => setFormData({...formData, role: 'donor'})} 
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-2 ${formData.role === 'donor' ? 'bg-white shadow-md text-red-600 scale-105' : 'text-gray-400'}`}
            >
              <Heart size={16} fill={formData.role === 'donor' ? "currentColor" : "none"} /> Donor
            </button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, role: 'requester'})} 
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-2 ${formData.role === 'requester' ? 'bg-white shadow-md text-red-600 scale-105' : 'text-gray-400'}`}
            >
              <UserCircle size={16} /> Requester
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest italic">Email Address</label>
              <input 
                type="email" 
                placeholder="name@mail.com" 
                className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-red-200 font-bold text-gray-700 focus:bg-white focus:ring-2 ring-red-50 transition-all shadow-inner" 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                required 
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest italic">Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-red-200 font-bold text-gray-700 focus:bg-white focus:ring-2 ring-red-50 transition-all shadow-inner" 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                required 
              />
            </div>
            <div className="text-right mt-1">
              <span 
                onClick={() => navigate('/forgot-password')} 
                className="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-red-600 transition"
              >
                Forgot Password?
              </span>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full bg-red-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-red-100 hover:bg-red-700 transition mt-6 active:scale-95 flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? "AUTHENTICATING..." : "LOGIN TO DASHBOARD"}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>
          
          <p className="text-center mt-8 text-xs text-gray-400 font-medium tracking-tight">
            {formData.role === 'admin' ? "System Administrator Identity Verified" : "New to LifeDrop?"} 
            <span className="text-red-600 font-black cursor-pointer ml-1 hover:underline uppercase tracking-tighter" onClick={() => navigate('/')}>
               {formData.role === 'admin' ? "" : "Register here"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

const ArrowRight = ({size}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
);

export default Login;