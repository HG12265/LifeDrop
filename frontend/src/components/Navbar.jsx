import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Droplet, LogOut, LayoutDashboard, Home, UserCircle } from 'lucide-react';

const Navbar = ({ user, handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll aagumbodhu navbar background maara
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const onLogout = () => {
    handleLogout();
    setIsOpen(false);
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
      scrolled ? 'bg-white/80 backdrop-blur-xl shadow-xl h-20' : 'bg-white h-24'
    } flex items-center border-b border-gray-100`}>
      <div className="max-w-7xl mx-auto w-full px-6 flex justify-between items-center">
        
        
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-red-600 p-2.5 rounded-2xl shadow-lg shadow-red-200 group-hover:scale-110 transition-transform duration-300">
            <Droplet className="text-white fill-white" size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">LifeDrop</span>
            <span className="text-[8px] font-black text-red-600 uppercase tracking-[0.3em]">Saving Lives</span>
          </div>
        </Link>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-10">
          <div className="flex items-center gap-8 border-r pr-8 border-gray-100 h-10">
              <Link to="/" className={`text-sm font-black uppercase tracking-widest transition-colors ${isActive('/') ? 'text-red-600' : 'text-slate-400 hover:text-slate-900'}`}>Home</Link>
                {/* SWAPPED 'Camps' with 'Contact' */}
                <Link to="/contact" className={`text-sm font-black uppercase tracking-widest transition-colors ${isActive('/contact') ? 'text-red-600' : 'text-slate-400 hover:text-slate-900'}`}>Contact</Link>
              </div>
          
          {user ? (
            <div className="flex items-center gap-6">
              <Link 
                to={getDashboardPath()} 
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-red-600 transition-all duration-300 shadow-xl shadow-slate-200 uppercase tracking-widest"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              
              <div className="flex items-center gap-4 bg-slate-50 p-1.5 pr-4 rounded-2xl border border-gray-100">
                <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                   <UserCircle size={24} />
                </div>
                <div>
                   <p className="text-[9px] font-black text-gray-400 uppercase leading-none">Hero</p>
                   <p className="text-sm font-black text-slate-800 leading-tight truncate max-w-[100px]">{user.name}</p>
                </div>
                <button onClick={onLogout} className="ml-2 text-gray-300 hover:text-red-600 transition-colors">
                  <LogOut size={18}/>
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="bg-red-600 text-white px-10 py-3.5 rounded-2xl font-black text-xs shadow-2xl shadow-red-200 hover:bg-slate-900 transition-all duration-500 uppercase tracking-widest">
              Join as Hero
            </Link>
          )}
        </div>

        {/* MOBILE TOGGLE */}
        <button className="md:hidden bg-slate-50 p-3 rounded-2xl text-slate-900 border border-slate-100" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24}/> : <Menu size={24}/>}
        </button>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {isOpen && (
        <div className="fixed inset-0 top-0 left-0 w-full h-screen bg-white z-[2000] flex flex-col p-8 animate-in slide-in-from-right duration-500">
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 p-2 rounded-xl text-white"><Droplet size={20}/></div>
              <span className="text-xl font-black italic">LifeDrop</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="bg-slate-100 p-3 rounded-2xl"><X size={24}/></button>
          </div>

          <div className="flex flex-col gap-4">
             <Link to="/" onClick={()=>setIsOpen(false)} className="text-4xl font-black text-slate-900 border-b pb-6 border-slate-50">Home</Link>
             {user ? (
               <>
                 <Link to={getDashboardPath()} onClick={()=>setIsOpen(false)} className="text-4xl font-black text-red-600 border-b pb-6 border-slate-50 flex items-center justify-between">
                    Dashboard <ArrowRight size={30}/>
                 </Link>
                 <Link to="/contact" onClick={()=>setIsOpen(false)} className="text-4xl font-black text-slate-900 border-b pb-6 border-slate-50">Contact</Link>
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