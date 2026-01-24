import React, { useEffect, useState } from 'react';
import { API_URL } from '../config'; 
import { useParams, useNavigate } from 'react-router-dom';
import { Activity, Phone, User, ShieldCheck, MapPin, Calendar, Mail, Droplet, ArrowLeft } from 'lucide-react';

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donor, setDonor] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/donor/${id}`)
      .then(res => res.json())
      .then(data => setDonor(data))
      .catch(err => console.error("Error:", err));
  }, [id]);

  if (!donor) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-red-600 mb-4"></div>
      <p className="font-bold text-gray-500">Fetching Hero Details...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header / Cover */}
      <div className="bg-red-600 h-48 relative rounded-b-[50px] shadow-lg">
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-6 left-6 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="max-w-md mx-auto px-6 -translate-y-20">
        {/* Main Card */}
        <div className="bg-white rounded-[40px] shadow-2xl p-8 border border-gray-100 text-center relative overflow-hidden">
          {/* Health Score Badge (Top Right) */}
          <div className="absolute top-6 right-6 flex flex-col items-center">
             <div className="text-[10px] font-black text-gray-400 uppercase">Health</div>
             <div className="text-xl font-black text-green-600">{donor.healthScore}%</div>
          </div>

          {/* Profile Image Area */}
          <div className="w-32 h-32 bg-white rounded-full mx-auto p-2 shadow-xl border-4 border-red-50 relative">
             <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
                <User size={60} className="text-red-300" />
             </div>
             <div className="absolute bottom-1 right-1 bg-green-500 p-1.5 rounded-full border-4 border-white">
                <ShieldCheck size={16} className="text-white" />
             </div>
          </div>

          <h2 className="text-3xl font-black text-gray-800 mt-6 tracking-tight">{donor.name}</h2>
          <p className="text-red-600 font-bold text-sm flex items-center justify-center gap-1 mt-1">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
            LifeDrop ID: #{donor.id}
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-red-50 p-4 rounded-3xl border border-red-100">
               <Droplet className="text-red-600 mx-auto mb-1" size={24} />
               <p className="text-[10px] font-bold text-gray-400 uppercase">Blood Group</p>
               <h4 className="text-2xl font-black text-red-600">{donor.bloodGroup}</h4>
            </div>
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
               <Calendar className="text-slate-600 mx-auto mb-1" size={24} />
               <p className="text-[10px] font-bold text-gray-400 uppercase">Age / DOB</p>
               <h4 className="text-lg font-black text-slate-800">{donor.dob}</h4>
            </div>
          </div>

          {/* Medical Info Section */}
          <div className="mt-8 text-left space-y-4">
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Contact & Verification</h3>
             
             <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                <div className="bg-white p-2 rounded-xl shadow-sm text-blue-600"><Mail size={20} /></div>
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase">Email Address</p>
                   <p className="text-sm font-bold text-gray-700">{donor.email}</p>
                </div>
             </div>

             <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                <div className="bg-white p-2 rounded-xl shadow-sm text-green-600"><MapPin size={20} /></div>
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase">Live Location Pinned</p>
                   <p className="text-sm font-bold text-gray-700">{donor.location.lat.toFixed(4)}, {donor.location.lng.toFixed(4)}</p>
                </div>
             </div>
          </div>

          {/* Medical Trust Score Meter */}
          <div className="mt-8 bg-slate-900 rounded-3xl p-6 text-white text-left overflow-hidden relative">
            <Activity className="absolute right-[-10px] bottom-[-10px] opacity-10" size={80} />
            <p className="text-xs font-bold opacity-60 uppercase">Medical Eligibility Score</p>
            <div className="flex items-end gap-3 mt-2">
               <h4 className="text-4xl font-black">{donor.healthScore}%</h4>
               <span className="bg-green-500 text-[10px] px-2 py-0.5 rounded-full mb-2">SAFE TO DONATE</span>
            </div>
            <div className="mt-4 w-full bg-white/20 h-2 rounded-full overflow-hidden">
               <div className="bg-green-400 h-full rounded-full" style={{ width: `${donor.healthScore}%` }}></div>
            </div>
          </div>

          {/* Action Button */}
          <a 
            href={`tel:${donor.phone}`} 
            className="mt-8 flex items-center justify-center gap-3 bg-red-600 text-white py-5 rounded-3xl font-black shadow-xl shadow-red-200 hover:scale-[1.02] active:scale-95 transition"
          >
            <Phone size={24} fill="white" /> CONTACT DONOR NOW
          </a>
        </div>

        {/* Bottom Disclaimer */}
        <p className="mt-8 text-center text-xs text-gray-400 px-4 leading-relaxed">
           This donor profile is verified by <b>LifeDrop</b>. Please ensure to check the medical fitness again before the extraction process.
        </p>
      </div>
    </div>
  );
};

export default PublicProfile;