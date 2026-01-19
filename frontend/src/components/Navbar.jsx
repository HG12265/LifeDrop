import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Droplet, User, LogOut } from 'lucide-react';

const Navbar = ({ user, handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50 shadow-sm px-4 h-20 flex items-center">
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
        
        <Link to="/" className="flex items-center gap-2">
          <Droplet className="text-red-600 fill-red-600" size={30} />
          <span className="text-2xl font-black text-gray-800">LifeDrop</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="font-bold text-gray-600 hover:text-red-600">Home</Link>
          <Link to="/find" className="font-bold text-gray-600 hover:text-red-600">Find Donors</Link>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold bg-red-50 text-red-600 px-3 py-1 rounded-full">{user.name}</span>
              <button onClick={onLogout} className="text-gray-500 hover:text-red-600"><LogOut size={20}/></button>
            </div>
          ) : (
            <Link to="/login" className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold">Login</Link>
          )}
        </div>

        {/* Mobile Button */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28}/> : <Menu size={28}/>}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-20 left-0 w-full bg-white border-b shadow-lg p-6 flex flex-col gap-4 md:hidden">
          <Link to="/" onClick={()=>setIsOpen(false)} className="font-bold p-2">Home</Link>
          <Link to="/find" onClick={()=>setIsOpen(false)} className="font-bold p-2">Find Donors</Link>
          {user ? (
             <button onClick={()=>{onLogout(); setIsOpen(false)}} className="text-left font-bold p-2 text-red-600">Logout</button>
          ) : (
             <Link to="/login" onClick={()=>setIsOpen(false)} className="bg-red-600 text-center text-white py-3 rounded-xl font-bold">Login</Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;