import React, { useState } from 'react';
import { API_URL } from '../config'; 
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import LocationPicker from '../components/LocationPicker';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const BloodRequestForm = ({ user }) => {
  const navigate = useNavigate();
  const [position, setPosition] = useState({ lat: 13.0827, lng: 80.2707 });
  const [formData, setFormData] = useState({
    patientName: '', contactNumber: '', bloodGroup: '', units: 1, urgency: 5, hospital: ''
  });

const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Debug panna indha line add pannunga
  console.log("Current User:", user); 

  if (!user || !user.unique_id) {
    toast.error("Error: User session expired. Please login again.");
    return;
  }

  const finalData = { 
    ...formData, 
    lat: position.lat, 
    lng: position.lng, 
    requester_id: user.unique_id // Intha unique_id thaan missing aagudhu
  };
  
  console.log("Sending Data to Backend:", finalData);

  try {
    const res = await fetch(`${API_URL}/api/request/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalData)
    });

    const data = await res.json();

    if (res.ok) {
      toast.info("Request Posted! Loading nearby donors...");
      navigate(`/matching/${data.id}`); 
    } else {
      toast.error("Backend Error: " + data.message);
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
};

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-gray-500 font-bold hover:text-red-600">
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-slate-900 p-8 text-white flex items-center gap-4">
          <div className="bg-red-600 p-3 rounded-2xl animate-pulse">
            <AlertCircle size={30} />
          </div>
          <div>
            <h2 className="text-2xl font-black italic">Create Blood Request</h2>
            <p className="opacity-60 text-xs uppercase tracking-widest font-bold">Emergency Portal</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Patient Name" className="p-4 bg-gray-50 rounded-2xl border-none outline-red-200 font-bold" onChange={e => setFormData({...formData, patientName: e.target.value})} required />
            <input type="tel" placeholder="Contact Number" className="p-4 bg-gray-50 rounded-2xl border-none outline-red-200 font-bold" onChange={e => setFormData({...formData, contactNumber: e.target.value})} required />
            
            <select className="p-4 bg-gray-50 rounded-2xl border-none font-bold" onChange={e => setFormData({...formData, bloodGroup: e.target.value})} required>
              <option value="">Blood Group Needed</option>
              {['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
            <input type="number" placeholder="Units Needed" min="1" className="p-4 bg-gray-50 rounded-2xl border-none font-bold" onChange={e => setFormData({...formData, units: e.target.value})} required />
          </div>

          <input type="text" placeholder="Hospital Name & Branch" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-red-200 font-bold" onChange={e => setFormData({...formData, hospital: e.target.value})} required />

          {/* Urgency Slider */}
          <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
            <div className="flex justify-between mb-2">
              <label className="text-sm font-black text-red-800">Urgency Level</label>
              <span className="text-red-600 font-black">{formData.urgency}/10</span>
            </div>
            <input 
              type="range" min="1" max="10" 
              value={formData.urgency}
              onChange={e => setFormData({...formData, urgency: e.target.value})}
              className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-600" 
            />
            <div className="flex justify-between text-[10px] font-bold text-red-400 mt-2">
              <span>NORMAL</span>
              <span>CRITICAL</span>
            </div>
          </div>

          <LocationPicker position={position} setPosition={setPosition} />

          <button type="submit" className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-red-100 hover:bg-red-700 transition">
            FIND MATCH & NEARBY DONORS
          </button>
        </form>
      </div>
    </div>
  );
};

export default BloodRequestForm;