import React, { useEffect, useState } from 'react';
import { API_URL } from '../config'; 
import { Megaphone, X } from 'lucide-react';

const BroadcastAlert = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/broadcasts`)
      .then(res => res.json())
      .then(data => setAlerts(data));
  }, []);

  const dismissAlert = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full px-4">
      {alerts.map((a) => (
        <div key={a.id} className="bg-red-600 text-white p-5 rounded-[28px] shadow-2xl flex items-start gap-4 animate-in slide-in-from-right duration-500 relative overflow-hidden group">
          <div className="bg-white/20 p-2 rounded-full"><Megaphone size={20} /></div>
          <div className="flex-1">
             <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Emergency Alert</p>
             <p className="text-sm font-bold leading-tight mt-1">{a.message}</p>
          </div>
          <button onClick={() => dismissAlert(a.id)} className="text-white/40 hover:text-white transition"><X size={18}/></button>
          <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full animate-out fade-out duration-[10000ms]"></div>
        </div>
      ))}
    </div>
  );
};

export default BroadcastAlert;