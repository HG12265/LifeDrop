import React, { useEffect, useState } from 'react';
import { API_URL } from '../config'; 
import { useNavigate } from 'react-router-dom';
import { 
  Heart, MapPin, Users, ShieldCheck, 
  ArrowRight, Activity, Droplets, Zap 
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ donors: 0, saves: 0 });

  useEffect(() => {
    
    fetch(`${API_URL}/api/admin/analytics`)
      .then(res => res.json())
      .then(data => setStats({ donors: data.total_donors, saves: data.total_saves }))
      .catch(() => setStats({ donors: 25, saves: 12 })); 
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden font-sans">
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-20 pb-32 flex flex-col items-center px-6">
        {/* Background Animated Elements */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-red-100 rounded-full blur-[100px] opacity-60 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-50 rounded-full blur-[120px] opacity-40"></div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 px-4 py-2 rounded-full text-red-600 font-black text-[10px] tracking-[0.2em] uppercase animate-bounce">
            <Zap size={14} fill="currentColor" /> Real-time Matching Enabled
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-tight">
            Saving Lives <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">Through Technology</span>
          </h1>

          <p className="max-w-2xl mx-auto text-gray-500 text-lg md:text-xl font-medium leading-relaxed">
            The world’s first blockchain-secured, AI-powered blood donation platform. Connecting heroes with those in need, instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
            <button 
              onClick={() => navigate('/register-requester')}
              className="w-full sm:w-auto bg-red-600 text-white px-10 py-5 rounded-[24px] font-black text-lg shadow-2xl shadow-red-200 hover:bg-red-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <Heart size={24} /> REQUEST BLOOD
            </button>
            <button 
              onClick={() => navigate('/register-donor')}
              className="w-full sm:w-auto bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black text-lg shadow-2xl shadow-slate-200 hover:bg-black hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              BECOME A DONOR <ArrowRight size={24} />
            </button>
          </div>
        </div>

        {/* Floating Droplet Icon (Animated) */}
        <div className="mt-20 animate-bounce duration-[3000ms]">
           <div className="bg-white p-6 rounded-[32px] shadow-2xl border border-gray-50 relative group cursor-pointer">
              <Droplets size={60} className="text-red-600 transition-transform group-hover:scale-110" />
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full border-4 border-white animate-ping"></div>
           </div>
        </div>
        <br></br>
        <div className="max-w-7xl mx-auto space-y-16 text-center">
           <div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Our Ecosystem</h2>
              <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-xs">Why LifeDrop is Different</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <FeatureCard 
                icon={<Activity className="text-red-600" size={32} />}
                title="AI Matching"
                desc="Smart compatibility algorithms finding universal and exact donors in milliseconds."
              />
              <FeatureCard 
                icon={<ShieldCheck className="text-green-600" size={32} />}
                title="Blockchain Secured"
                desc="Every donation step is recorded on an immutable ledger for total transparency."
              />
              <FeatureCard 
                icon={<MapPin className="text-blue-600" size={32} />}
                title="Live Tracking"
                desc="Real-time map and blood bag tracking with unique bag serial IDs."
              />
           </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (Timeline) --- */}
      <section className="bg-gray-50 py-32 px-6">
        <div className="max-w-5xl mx-auto space-y-20">
           <div className="text-center">
              <h2 className="text-4xl font-black italic">How It Works?</h2>
           </div>

           <div className="space-y-24">
              <StepRow 
                num="01" title="Request or Register" 
                desc="Users can create a request with patient details or join as a verified donor with a health score." 
                imageIcon={<UserPlus className="text-red-600" size={40}/>}
              />
              <StepRow 
                num="02" title="AI Search & Match" 
                desc="Our AI filters donors by distance, compatibility, and availability (90-day cooldown check)." 
                imageIcon={<Activity className="text-blue-600" size={40}/>}
                reverse
              />
              <StepRow 
                num="03" title="Verified Donation" 
                desc="Blockchain verifies the donation, generates a Hero Certificate, and updates the stock." 
                imageIcon={<ShieldCheck className="text-green-600" size={40}/>}
              />
           </div>
        </div>
      </section>

      {/* --- CALL TO ACTION (BOTTOM) --- */}
      <section className="py-32 px-6 text-center">
         <div className="max-w-4xl mx-auto bg-red-600 rounded-[60px] p-12 md:p-20 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 group-hover:scale-110 transition duration-[5000ms]"></div>
            <h2 className="text-4xl md:text-6xl font-black text-white relative z-10 leading-tight">
               Ready to save <br /> someone's life?
            </h2>
            <button 
              onClick={() => navigate('/register-donor')}
              className="mt-10 bg-white text-red-600 px-12 py-5 rounded-[24px] font-black text-xl hover:bg-slate-900 hover:text-white transition-all relative z-10 active:scale-95 shadow-xl"
            >
               JOIN AS A HERO NOW
            </button>
         </div>
      </section>

    </div>
  );
};

// --- HELPER COMPONENTS ---

const StatItem = ({ label, value, color }) => (
  <div className="space-y-1">
    <h4 className={`text-4xl font-black tracking-tighter ${color}`}>{value}</h4>
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
  </div>
);

const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-white p-10 rounded-[48px] border border-gray-50 shadow-xl hover:shadow-2xl transition duration-500 group hover:-translate-y-2">
    <div className="bg-slate-50 w-20 h-20 rounded-[28px] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition duration-500 shadow-inner">
       {icon}
    </div>
    <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">{title}</h3>
    <p className="text-gray-400 font-bold text-sm leading-relaxed">{desc}</p>
  </div>
);

const StepRow = ({ num, title, desc, imageIcon, reverse }) => (
  <div className={`flex flex-col md:flex-row items-center gap-10 md:gap-20 ${reverse ? 'md:flex-row-reverse' : ''}`}>
     <div className="flex-1 space-y-4 text-center md:text-left">
        <span className="text-red-600 font-black text-6xl opacity-10 leading-none">{num}</span>
        <h3 className="text-3xl font-black text-slate-900 tracking-tight italic">{title}</h3>
        <p className="text-gray-500 font-medium leading-relaxed">{desc}</p>
     </div>
     <div className="w-32 h-32 md:w-48 md:h-48 bg-white rounded-[40px] shadow-2xl flex items-center justify-center border border-gray-50 hover:rotate-6 transition duration-500 shrink-0">
        {imageIcon}
     </div>
  </div>
);

const UserPlus = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
);

export default Home;