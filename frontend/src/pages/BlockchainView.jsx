import React, { useEffect, useState } from 'react';
import { API_URL } from '../config'; 
import { useParams } from 'react-router-dom';
import { Link2, ShieldCheck, Clock, Hash } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const BlockchainView = () => {
  const { id } = useParams();
  const [chain, setChain] = useState([]);
  const trackingUrl = window.location.href;

  useEffect(() => {
    fetch(`${API_URL}/api/blockchain/view/${id}`)
      .then(res => res.json())
      .then(data => setChain(data));
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-10">
      <div className="text-center space-y-4">
         <div className="bg-green-100 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <ShieldCheck size={40} />
         </div>
         <h2 className="text-4xl font-black italic tracking-tighter">LifeDrop Immutable Ledger</h2>
         <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Powered by Blockchain Technology</p>
      </div>

      {/* QR Code for Blood Packet */}
      <div className="bg-white p-8 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col md:flex-row items-center gap-8 shadow-xl">
         <QRCodeCanvas value={trackingUrl} size={120} />
         <div>
            <h4 className="font-black text-gray-800 text-xl">Digital Verification QR</h4>
            <p className="text-gray-500 text-sm mt-2">Scan this QR on the blood bag to verify the complete donation history and donor eligibility.</p>
         </div>
      </div>

      {/* Blockchain Timeline */}
      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
        {chain.map((block, idx) => (
          <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group animate-in slide-in-from-bottom">
            {/* Dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-900 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <Clock size={16} />
            </div>
            {/* Card */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-[32px] shadow-xl border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-red-600 text-xs uppercase tracking-widest">{block.event}</span>
                <span className="text-[9px] font-bold text-gray-300">{block.time}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl mb-4">
                 <pre className="text-[10px] font-mono text-gray-500 overflow-hidden">{JSON.stringify(block.data, null, 2)}</pre>
              </div>
              <div className="flex flex-col gap-1">
                 <p className="text-[8px] font-mono text-gray-300 flex items-center gap-1"><Hash size={8}/> PREV: {block.prev_hash}</p>
                 <p className="text-[8px] font-mono text-green-400 flex items-center gap-1"><Hash size={8}/> CURR: {block.curr_hash}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockchainView;