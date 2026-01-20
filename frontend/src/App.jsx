import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Components & Global UI
import ChatBot from './components/ChatBot'; // IMPORTED
import Navbar from './components/Navbar';
import BroadcastAlert from './components/BroadcastAlert';

// Pages
import Home from './pages/Home';
import DonorRegister from './pages/DonorRegister';
import RequesterRegister from './pages/RequesterRegister';
import Login from './pages/Login';
import PublicProfile from './pages/PublicProfile';
import DonorDashboard from './pages/DonorDashboard';     
import RequesterDashboard from './pages/RequesterDashboard'; 
import BloodRequestForm from './pages/BloodRequestForm';
import DonorMatching from './pages/DonorMatching';
import AdminDashboard from './pages/AdminDashboard'; 
import AdminDetails from './pages/AdminDetails';
import InventoryManager from './pages/InventoryManager';
import AdminAnalytics from './pages/AdminAnalytics';
import CampManager from './pages/CampManager';
import BlockchainView from './pages/BlockchainView';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('lifedrop_user');
    try {
        return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
        return null;
    }
  });

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
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
        <Navbar user={user} handleLogout={handleLogout} />
        
        {/* GLOBAL UI ELEMENTS */}
        <BroadcastAlert />
        <ChatBot /> {/* <--- INTHAI LINE-AH ADD PANNIYIRUKKEN NANBA */}

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

            {/* Find Donors Map & Matching */}
            <Route 
              path="/matching/:id" 
              element={user ? <DonorMatching user={user} /> : <Navigate to="/login" />} 
            />

            {/* Admin Portal - Protected */}
            <Route 
              path="/admin-dashboard" 
              element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/admin/details/:category" 
              element={user && user.role === 'admin' ? <AdminDetails /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/admin/inventory" 
              element={user && user.role === 'admin' ? <InventoryManager /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/admin/analytics" 
              element={user && user.role === 'admin' ? <AdminAnalytics /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/admin/camps" 
              element={user && user.role === 'admin' ? <CampManager /> : <Navigate to="/login" />} 
            />
            <Route path="/blockchain/:id" element={<BlockchainView />} />
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