import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { API_URL } from '../config'; 
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Clock, Plus, Trash2, Tent } from 'lucide-react';

const CampManager = () => {
  const navigate = useNavigate();
  const [camps, setCamps] = useState([]);
  const [formData, setFormData] = useState({ title: '', location: '', city: '', date: '', time: '' });

  const fetchCamps = () => {
    fetch(`${API_URL}/api/camps/all`).then(res => res.json()).then(data => setCamps(data));
  };

  useEffect(() => { fetchCamps(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/admin/camps/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if(res.ok) {
      toast.success("Camp Scheduled!");
      setFormData({ title: '', location: '', city: '', date: '', time: '' });
      fetchCamps();
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this camp?")) return;
    const res = await fetch(`${API_URL}/api/admin/camps/delete/${id}`, { method: 'DELETE' });
    if(res.ok) fetchCamps();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
         <button onClick={() => navigate(-1)} className="bg-white p-3 rounded-full shadow-sm"><ArrowLeft/></button>
         <h2 className="text-3xl font-black italic tracking-tighter">Camp Organizer</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Create Camp Form */}
        <div className="lg:col-span-1 bg-white p-8 rounded-[40px] shadow-2xl border border-gray-50 h-fit">
          <h3 className="font-black text-gray-800 text-xl mb-6 flex items-center gap-2">
             <Plus className="text-red-600" /> Schedule New Camp
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
             <input type="text" placeholder="Camp Title (e.g. Mega Blood Drive)" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-red-200 font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
             <input type="text" placeholder="Full Address" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
             <input type="text" placeholder="City" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
             <div className="grid grid-cols-2 gap-4">
                <input type="date" className="p-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-400" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                <input type="time" className="p-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-400" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} required />
             </div>
             <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-red-100 hover:bg-red-700 transition">PUBLISH CAMP</button>
          </form>
        </div>

        {/* Camps List */}
        <div className="lg:col-span-2 space-y-6">
           <h3 className="font-black text-gray-400 text-sm uppercase tracking-[0.3em] px-2">Upcoming Events</h3>
           <div className="grid gap-6">
             {camps.map(camp => (
               <div key={camp.id} className="bg-slate-900 text-white p-8 rounded-[48px] shadow-xl flex flex-col md:flex-row justify-between items-center group relative overflow-hidden">
                  <Tent className="absolute right-[-20px] bottom-[-20px] opacity-10" size={150} />
                  <div className="space-y-4 z-10">
                    <div className="flex items-center gap-2 text-red-500 font-black text-xs uppercase tracking-widest">
                       <Calendar size={14}/> {camp.date} | <Clock size={14}/> {camp.time}
                    </div>
                    <h4 className="text-2xl font-black italic">{camp.title}</h4>
                    <p className="text-gray-400 font-bold flex items-center gap-2"><MapPin size={16} className="text-red-600"/> {camp.location}, {camp.city}</p>
                  </div>
                  <button onClick={() => handleDelete(camp.id)} className="mt-6 md:mt-0 p-4 bg-white/10 rounded-2xl text-white hover:bg-red-600 transition z-10">
                    <Trash2 size={24}/>
                  </button>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default CampManager;