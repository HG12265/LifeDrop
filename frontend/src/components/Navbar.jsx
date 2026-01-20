import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Droplet, User, LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = ({ user, handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();
    navigate('/');
  };

  // User role-padi correct-ana dashboard path-ah kandupidiika
  const getDashboardPath = () => {
    if (!user) return "/login";
    if (user.role === 'admin') return "/admin-dashboard";
    if (user.role === 'donor') return "/donor-dashboard";
    return "/requester-dashboard";
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50 shadow-sm px-4 h-20 flex items-center">
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-red-50 p-2 rounded-xl group-hover:bg-red-100 transition">
            <Droplet className="text-red-600 fill-red-600" size={28} />
          </div>
          <span className="text-2xl font-black text-gray-800 tracking-tighter">LifeDrop</span>
        </Link>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="font-bold text-gray-600 hover:text-red-600 transition">Home</Link>
          
          {user ? (
            <div className="flex items-center gap-6">
              {/* "Find Donors"-ku badhula ippo stylish-ana Dashboard link */}
              <Link 
                to={getDashboardPath()} 
                className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-black transition shadow-lg"
              >
                <LayoutDashboard size={18} />
                My Dashboard
              </Link>
              
              <div className="flex items-center gap-3 border-l pl-6 border-gray-100">
                <div className="text-right">
                   <p className="text-[10px] font-black text-gray-400 uppercase leading-none">Logged in as</p>
                   <p className="text-sm font-black text-red-600 leading-tight">{user.name}</p>
                </div>
                <button 
                  onClick={onLogout} 
                  className="bg-gray-50 p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Logout"
                >
                  <LogOut size={20}/>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
               <Link to="/login" className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-red-100 hover:bg-red-700 transition active:scale-95">
                 LOGIN
               </Link>
            </div>
          )}
        </div>

        {/* MOBILE BUTTON */}
        <button className="md:hidden p-2 text-gray-600" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28}/> : <Menu size={28}/>}
        </button>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {isOpen && (
        <div className="absolute top-20 left-0 w-full bg-white border-b shadow-2xl p-6 flex flex-col gap-4 md:hidden animate-in slide-in-from-top duration-300">
          <Link to="/" onClick={()=>setIsOpen(false)} className="font-black p-4 text-gray-700 hover:bg-gray-50 rounded-2xl">Home</Link>
          
          {user ? (
             <>
               <Link to={getDashboardPath()} onClick={()=>setIsOpen(false)} className="font-black p-4 bg-slate-900 text-white rounded-2xl flex items-center gap-3">
                 <LayoutDashboard size={20} /> My Dashboard
               </Link>
               <div className="p-4 border-t border-gray-50 flex justify-between items-center mt-2">
                 <p className="font-black text-red-600">{user.name}</p>
                 <button onClick={()=>{onLogout(); setIsOpen(false)}} className="font-black text-gray-400 flex items-center gap-2">
                   Logout <LogOut size={18}/>
                 </button>
               </div>
             </>
          ) : (
             <Link to="/login" onClick={()=>setIsOpen(false)} className="bg-red-600 text-center text-white p-5 rounded-[24px] font-black shadow-xl">
               LOGIN / SIGN UP
             </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;