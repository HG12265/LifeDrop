import React from 'react';
import { Link } from 'react-router-dom';
import { Droplet, Heart, Github, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    // Padding top kammi panni irukken (pt-12 -> pt-6)
    <footer className="bg-white border-t border-gray-100 pt-6 pb-6 px-6 mt-auto">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Tier: Compact Content */}
        {/* Margin bottom kammi panni irukken (mb-10 -> mb-4) */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-1">
          
          {/* Brand Area */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2">
              <div className="bg-red-600 p-1 rounded-lg shadow-md shadow-red-100">
                <Droplet className="text-white fill-white" size={16} />
              </div>
              <span className="text-lg font-black text-slate-900 tracking-tighter italic leading-none">LifeDrop</span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Technology for Humanity</p>
          </div>

          {/* Minimal Links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Link to="/" className="hover:text-red-600 transition-colors">Home</Link>
            <Link to="/login" className="hover:text-red-600 transition-colors">Donate</Link>
            <Link to="/login" className="hover:text-red-600 transition-colors">Request</Link>
            <Link to="/admin-dashboard" className="hover:text-red-600 transition-colors">Admin</Link>
            <Link to="/contact" className="hover:text-red-600 transition-colors">Support</Link>
          </div>

          {/* Subtle Socials */}
          <div className="flex gap-4 text-slate-300">
            <Twitter size={16} className="hover:text-red-600 cursor-pointer transition-colors" />
            <Instagram size={16} className="hover:text-red-600 cursor-pointer transition-colors" />
            <Github size={16} className="hover:text-red-600 cursor-pointer transition-colors" />
          </div>
        </div>

        {/* Bottom Tier: Copyright & Status */}
        {/* Padding top kammi panni irukken (pt-8 -> pt-4) */}
        <div className="pt-1 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              © 2026 LifeDrop AI. All Rights Reserved.
            </p>
            <span className="hidden md:block text-slate-200">|</span>
            <p className="text-[9px] font-medium text-slate-400">
              Made with <Heart size={8} className="inline text-red-500 fill-red-500 mx-0.5 mb-0.5" /> in India
            </p>
          </div>

          {/* Live Status Indicator */}
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-black text-green-700 uppercase tracking-tighter">Systems Live</span>
             </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;