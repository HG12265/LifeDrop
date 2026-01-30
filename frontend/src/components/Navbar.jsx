import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Droplet, LogOut, LayoutDashboard, UserCircle, Bell, Megaphone } from 'lucide-react';
import { API_URL } from '../config';

const Navbar = ({ user, handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [alerts, setAlerts] = useState([]);
  
  const navigate = useNavigate();
  const location = useLocation();

  // User-oda first name mattum edukka
  const firstName = user?.name ? user.name.split(' ')[0] : "";

  const fetchAlerts = () => {
    if (user) {
      fetch(`${API_URL}/api/broadcasts`)
        .then(res => res.json())
        .then(data => setAlerts(data))
        .catch(err => console.error("Alert fetch error:", err));
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, [user]);

  const onLogout = () => {
    handleLogout();
    setIsOpen(false);
    setShowNotifs(false);
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return "/login";
    if (user.role === 'admin') return "/admin-dashboard";
    if (user.role === 'donor') return "/donor-dashboard";
    return "/requester-dashboard";
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`fixed top-0 w-full z-[1000] transition-all duration-500 ${
      scrolled ? 'bg-white/90 backdrop-blur-xl shadow-lg h-20' : 'bg-white h-24'
    } flex items-center border-b border-gray-100`}>
      <div className="max-w-7xl mx-auto w-full px-6 flex justify-between items-center relative">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-red-600 p-2.5 rounded-2xl shadow-lg shadow-red-200 group-hover:rotate-12 transition-transform duration-300">
            <Droplet className="text-white fill-white" size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none italic">LifeDrop</span>
            <span className="text-[8px] font-black text-red-600 uppercase tracking-[0.3em]">Saving Lives</span>
          </div>
        </Link>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-5"> {/* Reduced overall gap */}
          <div className="flex items-center gap-6 border-r pr-6 border-gray-100 h-10">
            <Link to="/" className={`text-sm font-black uppercase tracking-widest transition-colors ${
              isActive('/') ? 'text-red-600' : 'text-slate-400 hover:text-slate-900'
            }`}>Home</Link>
            <Link to="/contact" className={`text-sm font-black uppercase tracking-widest transition-colors ${
              isActive('/contact') ? 'text-red-600' : 'text-slate-400 hover:text-slate-900'
            }`}>Contact</Link>
          </div>
          
          {user && (
            <div className="relative">
              <button 
                onClick={() => setShowNotifs(!showNotifs)}
                className={`p-2.5 rounded-xl transition-all duration-300 ${showNotifs ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              >
                <Bell size={20} />
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full border-2 border-white flex items-center justify-center animate-bounce">
                    {alerts.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-4">
              <Link 
                to={getDashboardPath()} 
                className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[10px] hover:bg-red-600 transition-all duration-300 shadow-lg uppercase tracking-widest"
              >
                <LayoutDashboard size={14} />
                Dashboard
              </Link>
              
              {/* USER INFO WITH FIRST NAME */}
              <div className="flex items-center gap-2 bg-slate-50 p-1 pr-3 rounded-2xl border border-gray-100">
                <div className="bg-white w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                   <UserCircle size={20} />
                </div>
                <p className="text-xs font-black text-slate-800 leading-tight truncate max-w-[70px]">{firstName}</p>
                <button onClick={onLogout} className="ml-1 text-gray-300 hover:text-red-600 transition-colors">
                  <LogOut size={16}/>
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black text-xs shadow-2xl shadow-red-200 hover:bg-slate-900 transition-all duration-500 uppercase tracking-widest">
              Join as Hero
            </Link>
          )}
        </div>

        {/* MOBILE TOGGLE SECTION */}
        <div className="md:hidden flex items-center gap-3">
           {user && (
             <button 
                onClick={() => setShowNotifs(!showNotifs)} 
                className={`relative p-3 rounded-xl transition-all ${showNotifs ? 'bg-red-600 text-white' : 'bg-slate-50 text-slate-600'}`}
             >
                <Bell size={22} />
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
                    {alerts.length}
                  </span>
                )}
             </button>
           )}
           <button className="bg-slate-50 p-3 rounded-xl text-slate-900 border border-slate-100" onClick={() => setIsOpen(!isOpen)}>
             {isOpen ? <X size={24}/> : <Menu size={24}/>}
           </button>
        </div>

        {/* --- CENTERED NOTIFICATION DROPDOWN --- */}
        {showNotifs && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[90vw] md:w-96 bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in duration-300 z-[1100]">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <h4 className="font-black text-xs uppercase tracking-widest italic">Emergency Alerts</h4>
              <button onClick={() => setShowNotifs(false)} className="p-1 hover:bg-white/10 rounded-lg"><X size={18}/></button>
            </div>
            <div className="max-h-96 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {alerts.length > 0 ? alerts.map((a) => (
                <div key={a.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-3 items-start group">
                  <div className="bg-red-50 p-2 rounded-xl text-red-600"><Megaphone size={16}/></div>
                  <p className="text-xs font-bold text-gray-600 leading-relaxed">{a.message}</p>
                </div>
              )) : (
                <div className="py-10 text-center">
                  <Bell size={30} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No new messages</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MOBILE MENU OVERLAY */}
      {isOpen && (
        <div className="fixed inset-0 top-0 left-0 w-full h-screen bg-white z-[2000] flex flex-col p-8 animate-in slide-in-from-right duration-500">
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 p-2 rounded-xl text-white shadow-lg shadow-red-200"><Droplet size={20}/></div>
              <span className="text-xl font-black italic">LifeDrop</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="bg-slate-100 p-3 rounded-2xl"><X size={24}/></button>
          </div>

          <div className="flex flex-col gap-4">
             <Link to="/" onClick={()=>setIsOpen(false)} className="text-4xl font-black text-slate-900 border-b pb-6 border-slate-50">Home</Link>
             <Link to="/contact" onClick={()=>setIsOpen(false)} className="text-4xl font-black text-slate-900 border-b pb-6 border-slate-50">Contact</Link>
             {user ? (
               <>
                 <Link to={getDashboardPath()} onClick={()=>setIsOpen(false)} className="text-4xl font-black text-red-600 border-b pb-6 border-slate-50 flex items-center justify-between">
                    Dashboard <ArrowRight size={30}/>
                 </Link>
                 <div className="mt-auto bg-slate-900 p-8 rounded-[40px] text-white flex flex-col gap-6">
                    <div>
                      <p className="text-xs font-bold opacity-40 uppercase mb-1">Logged in Hero</p>
                      <h4 className="text-2xl font-black">{user.name}</h4>
                    </div>
                    <button onClick={onLogout} className="bg-red-600 w-full py-4 rounded-2xl font-black text-sm uppercase">Logout Account</button>
                 </div>
               </>
             ) : (
               <Link to="/login" onClick={()=>setIsOpen(false)} className="bg-red-600 text-white p-8 rounded-[40px] text-center text-2xl font-black mt-12 shadow-2xl shadow-red-200">
                 Login / Signup
               </Link>
             )}
          </div>
        </div>
      )}
    </nav>
  );
};

const ArrowRight = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
);

export default Navbar;