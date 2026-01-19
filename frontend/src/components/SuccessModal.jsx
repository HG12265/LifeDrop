import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, CheckCircle } from 'lucide-react';

const SuccessModal = ({ userId, type, onClose }) => {
  const profileUrl = `${window.location.origin}/profile/${userId}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300">
        <CheckCircle className="text-green-500 mx-auto mb-4" size={60} />
        <h2 className="text-2xl font-black text-gray-800">Registration Success!</h2>
        <p className="text-gray-500 mt-2">Welcome to LifeDrop community</p>

        <div className="my-6 p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Unique ID</p>
          <h3 className="text-4xl font-black text-red-600 mt-1">#{userId}</h3>
          
          {type === 'donor' && (
            <div className="mt-6 flex flex-col items-center">
              <div className="bg-white p-3 rounded-2xl shadow-md">
                <QRCodeCanvas value={profileUrl} size={150} level={"H"} />
              </div>
              <p className="text-[10px] text-gray-400 mt-3 font-medium">SCAN TO VIEW MEDICAL CARD</p>
            </div>
          )}
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;