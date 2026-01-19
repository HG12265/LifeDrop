import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import DonorRegister from './pages/DonorRegister';
import RequesterRegister from './pages/RequesterRegister';
import Login from './pages/Login';
import DonorMap from './components/DonorMap';
import PublicProfile from './pages/PublicProfile';
import DonorDashboard from './pages/DonorDashboard';     
import RequesterDashboard from './pages/RequesterDashboard'; 
import BloodRequestForm from './pages/BloodRequestForm';
import DonorMatching from './pages/DonorMatching';
import AdminDashboard from './pages/AdminDashboard'; 
import AdminDetails from './pages/AdminDetails';

function App() {
  // Initial state-ah localStorage-la irundhu edukkuroam
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('lifedrop_user');
    
    try {
        return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
        return null;
    }
  });

  // User state maarum pothu localStorage-la update panroam
  useEffect(() => {
    if (user) {
      localStorage.setItem('lifedrop_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('lifedrop_user');
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('lifedrop_user');
    alert("Logged out!");
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar user={user} handleLogout={handleLogout} />
        
        <main className="flex-grow pt-4">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/register-donor" element={<DonorRegister />} />
            <Route path="/register-requester" element={<RequesterRegister />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/profile/:id" element={<PublicProfile />} />

            {/* Donor Dashboard - Protected */}
            <Route 
              path="/donor-dashboard" 
              element={user && user.role === 'donor' ? <DonorDashboard user={user} /> : <Navigate to="/login" />} 
            />

            {/* Requester Dashboard - Protected */}
            <Route 
              path="/requester-dashboard" 
              element={user && user.role === 'requester' ? <RequesterDashboard user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
             path="/new-request" 
             element={user && user.role === 'requester' ? <BloodRequestForm user={user} /> : <Navigate to="/login" />} 
            />

            {/* Find Donors Map - Protected */}
            <Route 
              path="/find" 
              element={user ? <DonorMap user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/matching/:id" 
              element={user ? <DonorMatching user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/admin-dashboard" 
              element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/admin/details/:category" 
              element={user && user.role === 'admin' ? <AdminDetails /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>

        <footer className="bg-white border-t py-8 text-center text-gray-400 text-sm mt-10">
          <p>© 2024 LifeDrop - Every Drop Counts 💧</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;