import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Yes, Proceed", 
  cancelText = "Cancel",
  type = "danger" // 'danger' (Red) or 'success' (Green)
}) => {
  if (!isOpen) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in duration-300 relative">
        
        {/* Close Button (Top Right) */}
        <button 
          onClick={onCancel}
          className="absolute top-5 right-5 text-gray-300 hover:text-gray-500 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Dynamic Header Icon Section */}
        <div className={`p-10 flex justify-center ${isSuccess ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className={`bg-white p-5 rounded-full shadow-sm border ${isSuccess ? 'border-green-100' : 'border-red-100'}`}>
            {isSuccess ? (
              <CheckCircle2 size={44} className="text-green-600" />
            ) : (
              <AlertTriangle size={44} className="text-red-600" />
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 text-center">
          <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">
            {title}
          </h3>
          <p className="text-sm font-bold text-gray-400 mt-3 leading-relaxed px-2">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mt-8">
            <button 
              onClick={onConfirm}
              className={`w-full py-4 rounded-2xl font-black text-sm shadow-xl transition transform active:scale-95 ${
                isSuccess 
                ? 'bg-green-600 text-white shadow-green-100 hover:bg-green-700' 
                : 'bg-red-600 text-white shadow-red-100 hover:bg-red-700'
              }`}
            >
              {confirmText}
            </button>
            
            <button 
              onClick={onCancel}
              className="w-full bg-gray-50 text-gray-500 py-4 rounded-2xl font-black text-sm hover:bg-gray-100 transition active:scale-95"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;