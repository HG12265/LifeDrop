import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationPicker from '../components/LocationPicker';
import SuccessModal from '../components/SuccessModal'; // Pudhu Modal Import
import { Activity, ShieldCheck } from 'lucide-react';

const DonorRegister = () => {
  const navigate = useNavigate();
  
  // --- MODAL STATES ---
  const [showModal, setShowModal] = useState(false); // Modal theriyanuma illaya?
  const [registeredId, setRegisteredId] = useState(''); // Backend thara Unique ID store panna
  
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      lat: position.lat,
      lng: position.lng,
      healthScore: healthScore
    };

    // --- API CALL ---
    const res = await fetch('http://localhost:5000/register/donor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalData)
    });

    const data = await res.json(); // Backend-la irundhu vara unique_id-ah edukkuroam

    if (res.ok && data.unique_id) {
      // SUCCESS!
      setRegisteredId(data.unique_id); // Backend kuduththa ID-ah state-la veikiroam
      setShowModal(true); // Modal-ah open pannuroam
    } else {
      alert("Registration failed. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 relative">
      
      {/* SUCCESS MODAL LOGIC - ID-ah pass panroam */}
      {showModal && (
        <SuccessModal 
          userId={registeredId} 
          type="donor" 
          onClose={() => navigate('/login')} 
        />
      )}

      <div className={`bg-white shadow-2xl rounded-[32px] overflow-hidden border border-gray-100 ${showModal ? 'blur-sm pointer-events-none' : ''}`}>
        <div className="bg-red-600 p-8 text-white text-center">
          <h2 className="text-3xl font-black italic">LifeDrop Hero Registration</h2>
          <p className="opacity-80 text-sm mt-1">Provide accurate details to save lives</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ... Personal Details (Same as before) ... */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 border-b pb-2">Personal Details</h3>
            <input type="text" placeholder="Full Name" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-red-200" onChange={e => setFormData({...formData, fullName: e.target.value})} required />
            <input type="tel" placeholder="Phone Number" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-red-200" onChange={e => setFormData({...formData, phone: e.target.value})} required />
            <input type="email" placeholder="Email" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-red-200" onChange={e => setFormData({...formData, email: e.target.value})} required />
            <input type="password" placeholder="Password" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-red-200" onChange={e => setFormData({...formData, password: e.target.value})} required />
            
            <div className="grid grid-cols-2 gap-4">
              <select className="p-4 bg-gray-50 rounded-2xl border-none" onChange={e => setFormData({...formData, bloodGroup: e.target.value})} required>
                <option value="">Blood Group</option>
                {['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
              <input type="date" className="p-4 bg-gray-50 rounded-2xl border-none text-gray-400" onChange={e => setFormData({...formData, dob: e.target.value})} required />
            </div>

            <LocationPicker position={position} setPosition={setPosition} />
          </div>

          {/* ... Medical Screening (Same as before) ... */}
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-[24px] p-6 text-white relative overflow-hidden">
               <Activity className="absolute right-[-10px] bottom-[-10px] opacity-10" size={100} />
               <p className="text-sm opacity-70">Calculated Health Score</p>
               <h4 className="text-5xl font-black mt-2">{healthScore}%</h4>
            </div>

            <h3 className="font-bold text-gray-800 border-b pb-2 mt-6">Medical Screening</h3>
            <div className="space-y-3">
              <HealthCheck label="My weight is above 50kg" checked={formData.weight} onChange={() => setFormData({...formData, weight: !formData.weight})} />
              <HealthCheck label="Consumed alcohol in last 24h" checked={formData.alcohol} onChange={() => setFormData({...formData, alcohol: !formData.alcohol})} danger />
              <HealthCheck label="Had surgery in last 6 months" checked={formData.surgery} onChange={() => setFormData({...formData, surgery: !formData.surgery})} danger />
              <HealthCheck label="Got a Tattoo in last 6 months" checked={formData.tattoo} onChange={() => setFormData({...formData, tattoo: !formData.tattoo})} danger />
            </div>

            <button type="submit" className="w-full bg-red-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl hover:bg-red-700 transition mt-6">
              Register as Donor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const HealthCheck = ({ label, checked, onChange, danger }) => (
  <label className={`flex justify-between items-center p-4 rounded-2xl border cursor-pointer transition ${checked ? (danger ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200') : 'bg-gray-50 border-gray-100'}`}>
    <span className={`text-sm font-bold ${checked && danger ? 'text-red-700' : 'text-gray-600'}`}>{label}</span>
    <input type="checkbox" checked={checked} onChange={onChange} className="w-5 h-5 accent-red-600" />
  </label>
);

export default DonorRegister;