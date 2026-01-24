import React, { useEffect, useState } from 'react';
import { API_URL } from '../config'; 
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Database, RefreshCw, AlertTriangle } from 'lucide-react';

const InventoryManager = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = () => {
    fetch(`${API_URL}/api/admin/inventory`)
      .then(res => res.json())
      .then(data => { setInventory(data); setLoading(false); });
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleUpdate = async (group, action) => {
    const res = await fetch(`${API_URL}/api/admin/inventory/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group, action })
    });
    if(res.ok) fetchInventory();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate(-1)} className="bg-slate-100 p-2 rounded-xl text-slate-500"><ArrowLeft/></button>
           <div>
              <h2 className="text-3xl font-black italic tracking-tighter">Blood Bank Inventory</h2>
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1">
                 <Database size={12}/> Live Stock Management
              </p>
           </div>
        </div>
        <button onClick={fetchInventory} className="bg-slate-900 text-white p-3 rounded-2xl hover:rotate-180 transition-all duration-500">
            <RefreshCw size={20}/>
        </button>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {inventory.map((item) => (
          <div key={item.group} className="bg-white p-6 rounded-[40px] shadow-xl border border-gray-50 flex flex-col items-center group hover:border-red-100 transition">
             
             {/* Unit Circle */}
             <div className="relative w-24 h-24 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90">
                   <circle cx="48" cy="48" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                   <circle cx="48" cy="48" r="40" stroke={item.units < 5 ? "#ef4444" : "#22c55e"} strokeWidth="8" fill="transparent" 
                           strokeDasharray={251.2} strokeDashoffset={251.2 - (Math.min(item.units, 100) / 100) * 251.2} 
                           strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <div className="absolute flex flex-col items-center">
                   <span className="text-2xl font-black text-gray-800">{item.group}</span>
                </div>
             </div>

             <h4 className="text-3xl font-black text-gray-800">{item.units} <span className="text-xs text-gray-400 font-bold uppercase">Units</span></h4>
             
             {/* Critical Stock Warning */}
             {item.units < 5 && (
                <p className="text-[9px] font-black text-red-500 flex items-center gap-1 mt-1 animate-pulse">
                    <AlertTriangle size={10}/> LOW STOCK ALERT
                </p>
             )}

             <p className="text-[9px] text-gray-300 font-bold mt-4 uppercase">Last Updated: {item.updated}</p>

             {/* Controls */}
             <div className="mt-6 flex gap-3 w-full">
                <button 
                   onClick={() => handleUpdate(item.group, 'sub')}
                   className="flex-1 bg-slate-50 text-gray-400 p-3 rounded-2xl hover:bg-red-50 hover:text-red-600 transition flex justify-center"
                >
                   <Minus size={20}/>
                </button>
                <button 
                   onClick={() => handleUpdate(item.group, 'add')}
                   className="flex-1 bg-slate-50 text-gray-400 p-3 rounded-2xl hover:bg-green-50 hover:text-green-600 transition flex justify-center"
                >
                   <Plus size={20}/>
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryManager;