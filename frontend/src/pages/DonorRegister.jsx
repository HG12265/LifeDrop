import React, { useState, useEffect } from 'react';
import { API_URL } from '../config'; 
import { useNavigate } from 'react-router-dom';
import { 
  Activity, ShieldCheck, User, Mail, Phone, 
  Lock, Calendar, Droplet, ArrowRight, ArrowLeft,
  UserPlus, ShieldAlert, Heart, CheckCircle2, Info, Users
} from 'lucide-react';
import LocationPicker from '../components/LocationPicker';
import SuccessModal from '../components/SuccessModal';
import OTPModal from '../components/OTPModal';

const DonorRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Identity, 2: Medical, 3: Finalize
  const [showModal, setShowModal] = useState(false); 
  const [showOTP, setShowOTP] = useState(false); 
  const [registeredId, setRegisteredId] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ lat: 13.0827, lng: 80.2707 });
  const [healthScore, setHealthScore] = useState(100);

  // Expanded Form State (All your requirements included)
  const [formData, setFormData] = useState({
    fullName: '', phone: '', email: '', password: '', bloodGroup: '', dob: '', gender: 'male',
    // Permanent Filters (Automatic 0% Score)
    has_hiv_hepa: false, has_cancer_history: false, has_heart_disease: false,
    // Temporary Restrictions (Reduction in Score)
    is_on_meds: false, had_fever: false, had_tattoo: false, had_surgery: false,
    // Female Specific
    is_pregnant: false, is_breastfeeding: false
  });

  // PROFESSIONAL HEALTH SCORE ENGINE
  useEffect(() => {
    let score = 100;
    // Permanent Critical Exclusions
    if (formData.has_hiv_hepa || formData.has_cancer_history || formData.has_heart_disease) {
        score = 0;
    } else {
      // Deductions for temporary factors
      if (formData.is_on_meds) score -= 15;
      if (formData.had_fever) score -= 10;
      if (formData.had_tattoo) score -= 25;
      if (formData.had_surgery) score -= 30;
      // Female specific logic
      if (formData.gender === 'female') {
          if (formData.is_pregnant) score -= 50;
          if (formData.is_breastfeeding) score -= 20;
      }
    }
    setHealthScore(score < 0 ? 0 : score);
  }, [formData]);

  // Handle Step Navigation & Final OTP Trigger
  const handleStepSubmit = (e) => {
    e.preventDefault();
    if (step < 3) setStep(step + 1);
    else initiateOTPSend();
  };

  const initiateOTPSend = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/verify/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      if (res.ok) setShowOTP(true);
      else alert("OTP delivery failed. Please check your email.");
    } catch (err) { alert("Server connection error."); }
    finally { setLoading(false); }
  };

  const finalizeRegistration = async () => {
    setLoading(true);
    const finalData = { ...formData, lat: position.lat, lng: position.lng, healthScore };
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
        alert("Registration failed. Please try again.");
      }
    } catch (err) { alert("Final registration error."); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 relative animate-in fade-in duration-700">
      
      {/* 1. MODALS (OTP & Success) */}
      {showOTP && <OTPModal email={formData.email} onVerify={finalizeRegistration} onClose={() => setShowOTP(false)} onResend={initiateOTPSend} />}
      {showModal && <SuccessModal userId={registeredId} type="donor" onClose={() => navigate('/login')} />}

      <div className="bg-white shadow-2xl rounded-[48px] overflow-hidden border border-gray-100 min-h-[650px] flex flex-col lg:flex-row">
        
        {/* --- LEFT SIDEBAR: PROGRESS & SCORE --- */}
        <div className="lg:w-1/3 bg-slate-900 p-10 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
                <div className="bg-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-red-900/30">
                    <UserPlus size={32} />
                </div>
                <h2 className="text-3xl font-black italic tracking-tighter mb-12">Donor <br/>Verification</h2>
                
                <div className="space-y-10">
                    <StepIndicator active={step === 1} done={step > 1} num="1" label="IDENTITY" sub="Basic Info" />
                    <StepIndicator active={step === 2} done={step > 2} num="2" label="SCREENING" sub="Medical Deep Check" />
                    <StepIndicator active={step === 3} done={step > 3} num="3" label="VALIDATE" sub="Location & OTP" />
                </div>
            </div>

            {/* Real-time Health Meter in Sidebar */}
            <div className="mt-12 bg-white/5 backdrop-blur-md p-6 rounded-[32px] border border-white/10 relative z-10">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Live Fitness Score</p>
                <div className="flex items-end gap-2">
                    <span className="text-5xl font-black italic">{healthScore}%</span>
                    <span className={`text-[10px] font-bold mb-2 uppercase ${healthScore > 70 ? 'text-green-400' : 'text-orange-400'}`}>
                        {healthScore === 0 ? 'NOT ELIGIBLE' : 'TRUST RATING'}
                    </span>
                </div>
            </div>
            
            <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-red-600/10 rounded-full blur-[100px]"></div>
        </div>

        {/* --- RIGHT SIDE: DYNAMIC FORM CONTENT --- */}
        <div className="lg:w-2/3 p-6 md:p-16 flex flex-col justify-between bg-white">
            <form onSubmit={handleStepSubmit} className="space-y-8">
                
                {/* STEP 1: IDENTITY DETAILS */}
                {step === 1 && (
                    <div className="space-y-8 animate-in slide-in-from-right duration-500">
                        <SectionTitle title="Identity Details" icon={<User className="text-red-600"/>} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputBox icon={<User/>} placeholder="Full Name" value={formData.fullName} onChange={v => setFormData({...formData, fullName: v})} />
                            <InputBox icon={<Phone/>} placeholder="Phone Number" type="tel" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
                            <InputBox icon={<Mail/>} placeholder="Email Address" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
                            <InputBox icon={<Lock/>} placeholder="Password" type="password" value={formData.password} onChange={v => setFormData({...formData, password: v})} />
                            
                            <div className="relative">
                                <Users className="absolute left-4 top-4 text-gray-400" size={18}/>
                                <select className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-none font-bold outline-red-200 cursor-pointer" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <select className="p-4 bg-gray-50 rounded-2xl border-none font-bold" value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} required>
                                    <option value="">Blood</option>
                                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                </select>
                                <input type="date" className="p-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-400" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} required />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: MEDICAL SCREENING (The New "Medical Grade" section) */}
                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-500">
                        <SectionTitle title="Medical Screening" icon={<ShieldCheck className="text-green-600"/>} />
                        
                        <div className="bg-blue-50 p-5 rounded-3xl flex items-start gap-4 border border-blue-100">
                            <Info size={24} className="text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-bold text-blue-700 leading-relaxed uppercase tracking-tight">
                                Medical honesty is vital. Permanent conditions will set score to 0% for patient safety. Temporary conditions reduce the match trust.
                            </p>
                        </div>

                        {/* Condition Groups */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <MedicalToggle label="Heart Disease / Chronic" checked={formData.has_heart_disease} onChange={() => setFormData({...formData, has_heart_disease: !formData.has_heart_disease})} />
                            <MedicalToggle label="HIV / Hepatitis history" checked={formData.has_hiv_hepa} onChange={() => setFormData({...formData, has_hiv_hepa: !formData.has_hiv_hepa})} />
                            <MedicalToggle label="Cancer History" checked={formData.has_cancer_history} onChange={() => setFormData({...formData, has_cancer_history: !formData.has_cancer_history})} />
                            <MedicalToggle label="Recent Tattoo (6m)" checked={formData.had_tattoo} onChange={() => setFormData({...formData, had_tattoo: !formData.had_tattoo})} />
                            <MedicalToggle label="Surgery / Extraction (6m)" checked={formData.had_surgery} onChange={() => setFormData({...formData, had_surgery: !formData.had_surgery})} />
                            <MedicalToggle label="On Antibiotics / Meds" checked={formData.is_on_meds} onChange={() => setFormData({...formData, is_on_meds: !formData.is_on_meds})} />
                        </div>

                        {/* Gender Specific Dynamic Logic */}
                        {formData.gender === 'female' && (
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <h4 className="text-xs font-black text-red-500 uppercase tracking-[0.2em] mb-4">Women's Health Guard</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <MedicalToggle label="Currently Pregnant" checked={formData.is_pregnant} onChange={() => setFormData({...formData, is_pregnant: !formData.is_pregnant})} />
                                    <MedicalToggle label="Breastfeeding" checked={formData.is_breastfeeding} onChange={() => setFormData({...formData, is_breastfeeding: !formData.is_breastfeeding})} />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3: LOCATION & FINALIZATION */}
                {step === 3 && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-500">
                        <SectionTitle title="Final Validation" icon={<Activity className="text-blue-600"/>} />
                        <div className="border-2 border-dashed border-gray-100 rounded-[32px] p-2">
                             <LocationPicker position={position} setPosition={setPosition} />
                        </div>
                        
                        <div className="flex gap-4 bg-red-50 p-6 rounded-[32px] border border-red-100">
                            <ShieldAlert size={28} className="text-red-600 shrink-0" />
                            <p className="text-[11px] font-bold text-red-800 leading-relaxed uppercase tracking-tight">
                                I solemnly declare that all information is true. LifeDrop is a connector platform, and I will verify medical fitness again before donation.
                            </p>
                        </div>
                    </div>
                )}

                {/* --- RESPONSIVE NAVIGATION --- */}
                <div className="flex gap-4 pt-10">
                    {step > 1 && (
                        <button type="button" onClick={() => setStep(step - 1)} className="p-6 rounded-[32px] bg-slate-100 text-slate-500 hover:bg-slate-200 transition transform active:scale-90">
                            <ArrowLeft size={24} />
                        </button>
                    )}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="flex-1 bg-red-600 text-white py-5 rounded-[32px] font-black text-xl shadow-2xl shadow-red-100 hover:bg-red-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? "PROCESSING..." : step === 3 ? "VERIFY EMAIL & JOIN" : "NEXT STEP"}
                        <ArrowRight size={24} />
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

// --- MODERN UI SUB-COMPONENTS ---

const StepIndicator = ({ active, done, num, label, sub }) => (
    <div className={`flex items-center gap-5 transition-all duration-500 ${active ? 'opacity-100 translate-x-2' : done ? 'opacity-100' : 'opacity-20'}`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all ${done ? 'bg-green-500 text-white' : active ? 'bg-red-600 text-white shadow-xl shadow-red-900/50 scale-110' : 'bg-white/10 text-white'}`}>
            {done ? <CheckCircle2 size={24}/> : num}
        </div>
        <div>
            <p className="text-xs font-black tracking-widest leading-none mb-1">{label}</p>
            <p className="text-[10px] font-bold opacity-40 uppercase">{sub}</p>
        </div>
    </div>
);

const SectionTitle = ({ title, icon }) => (
    <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
        <div className="bg-slate-50 p-2 rounded-xl">{icon}</div>
        <h3 className="font-black text-gray-800 text-2xl tracking-tighter italic uppercase">{title}</h3>
    </div>
);

const InputBox = ({ icon, placeholder, type = "text", value, onChange }) => (
    <div className="relative group">
        <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-red-500 transition-colors">{React.cloneElement(icon, { size: 18 })}</div>
        <input 
            type={type} 
            placeholder={placeholder} 
            value={value}
            className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-red-100 focus:bg-white outline-none font-bold text-gray-700 transition-all shadow-inner"
            onChange={e => onChange(e.target.value)} 
            required 
        />
    </div>
);

const MedicalToggle = ({ label, checked, onChange }) => (
    <label className={`flex justify-between items-center p-5 rounded-[28px] border-2 cursor-pointer transition-all duration-300 ${checked ? 'bg-red-50 border-red-200 shadow-md' : 'bg-gray-50 border-transparent hover:bg-slate-100'}`}>
      <span className={`text-[10px] font-black uppercase tracking-widest ${checked ? 'text-red-700' : 'text-gray-500'}`}>{label}</span>
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${checked ? 'bg-red-600 border-red-600 shadow-lg scale-110' : 'border-gray-200 bg-white'}`}>
         {checked && <ShieldAlert size={12} className="text-white" />}
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
    </label>
);

export default DonorRegister;