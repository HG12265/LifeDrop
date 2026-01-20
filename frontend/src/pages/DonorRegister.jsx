import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationPicker from '../components/LocationPicker';
import SuccessModal from '../components/SuccessModal';
import OTPModal from '../components/OTPModal'; 
import { Activity, ShieldCheck, ShieldAlert } from 'lucide-react'; // <--- FIX: Added ShieldAlert

const DonorRegister = () => {
  const navigate = useNavigate();
  
  const [showModal, setShowModal] = useState(false); 
  const [showOTP, setShowOTP] = useState(false); 
  const [registeredId, setRegisteredId] = useState(''); 
  const [loading, setLoading] = useState(false);

  const [position, setPosition] = useState({ lat: 13.0827, lng: 80.2707 });
  const [healthScore, setHealthScore] = useState(100);
  
  const [formData, setFormData] = useState({
    fullName: '', phone: '', email: '', password: '', bloodGroup: '', dob: '',
    weight: true, alcohol: false, surgery: false, tattoo: false, medication: false
  });

  useEffect(() => {
    let score = 100;
    if (!formData.weight) score -= 30;
    if (formData.alcohol) score -= 20;
    if (formData.surgery) score -= 25;
    if (formData.tattoo) score -= 15;
    if (formData.medication) score -= 10;
    setHealthScore(score < 0 ? 0 : score);
  }, [formData]);

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
      alert("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalRegister = async () => {
    setLoading(true);
    const finalData = {
      ...formData,
      lat: position.lat,
      lng: position.lng,
      healthScore: healthScore
    };

    try {
      const res = await fetch('http://localhost:5000/register/donor', {
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
        alert("Registration failed. Please try again.");
      }
    } catch (err) {
      alert("Registration error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 relative">
      
      {showOTP && (
        <OTPModal 
          email={formData.email} 
          onVerify={handleFinalRegister} 
          onClose={() => setShowOTP(false)}
          onResend={handleInitialSubmit}
        />
      )}

      {showModal && (
        <SuccessModal 
          userId={registeredId} 
          type="donor" 
          onClose={() => navigate('/login')} 
        />
      )}

      <div className={`bg-white shadow-2xl rounded-[32px] overflow-hidden border border-gray-100 ${(showModal || showOTP) ? 'blur-sm pointer-events-none' : ''}`}>
        <div className="bg-red-600 p-8 text-white text-center">
          <h2 className="text-3xl font-black italic">LifeDrop Hero Registration</h2>
          <p className="opacity-80 text-sm mt-1">Verify your email to join the community</p>
        </div>

        <form onSubmit={handleInitialSubmit} className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 border-b pb-2">Personal Details</h3>
            <input type="text" placeholder="Full Name" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-red-200 font-bold" onChange={e => setFormData({...formData, fullName: e.target.value})} required />
            <input type="tel" placeholder="Phone Number" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-red-200 font-bold" onChange={e => setFormData({...formData, phone: e.target.value})} required />
            <input type="email" placeholder="Email Address" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-red-200 font-bold" onChange={e => setFormData({...formData, email: e.target.value})} required />
            <input type="password" placeholder="Create Password" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-red-200 font-bold" onChange={e => setFormData({...formData, password: e.target.value})} required />
            
            <div className="grid grid-cols-2 gap-4">
              <select className="p-4 bg-gray-50 rounded-2xl border-none font-bold" onChange={e => setFormData({...formData, bloodGroup: e.target.value})} required>
                <option value="">Group</option>
                {['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
              <input type="date" className="p-4 bg-gray-50 rounded-2xl border-none text-gray-400 font-bold" onChange={e => setFormData({...formData, dob: e.target.value})} required />
            </div>

            <LocationPicker position={position} setPosition={setPosition} />
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900 rounded-[24px] p-6 text-white relative overflow-hidden">
               <Activity className="absolute right-[-10px] bottom-[-10px] opacity-10" size={100} />
               <p className="text-sm opacity-70 uppercase tracking-widest font-black">Health Score</p>
               <h4 className="text-5xl font-black mt-2">{healthScore}%</h4>
            </div>

            <h3 className="font-bold text-gray-800 border-b pb-2 mt-6">Medical Screening</h3>
            <div className="space-y-3">
              <HealthCheck label="Weight is above 50kg" checked={formData.weight} onChange={() => setFormData({...formData, weight: !formData.weight})} />
              <HealthCheck label="No alcohol in last 24h" checked={!formData.alcohol} onChange={() => setFormData({...formData, alcohol: !formData.alcohol})} />
              <HealthCheck label="No major surgery (6 months)" checked={!formData.surgery} onChange={() => setFormData({...formData, surgery: !formData.surgery})} />
              <HealthCheck label="No Tattoos (6 months)" checked={!formData.tattoo} onChange={() => setFormData({...formData, tattoo: !formData.tattoo})} />
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className={`w-full bg-red-600 text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-red-100 hover:bg-red-700 transition mt-6 ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? "SENDING OTP..." : "GET VERIFIED & REGISTER"}
            </button>

            {/* Added ShieldAlert UI Section */}
            <div className="flex gap-3 bg-red-50 p-4 rounded-2xl border border-red-100 mt-4">
              <ShieldAlert size={20} className="text-red-500 shrink-0" />
              <p className="text-[9px] font-bold text-red-700 leading-relaxed">
                By creating an account, you agree that LifeDrop is a connector platform. Please verify medical details manually before donation.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const HealthCheck = ({ label, checked, onChange }) => (
  <label className={`flex justify-between items-center p-4 rounded-2xl border cursor-pointer transition ${checked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
    <span className={`text-sm font-bold ${checked ? 'text-green-700' : 'text-gray-400'}`}>{label}</span>
    <input type="checkbox" checked={checked} onChange={onChange} className="w-5 h-5 accent-red-600" />
  </label>
);

export default DonorRegister;