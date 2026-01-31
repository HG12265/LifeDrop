import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';

// --- Components & Global UI ---
import Navbar from './components/Navbar';
import Footer from './components/Footer'; 
import ChatBot from './components/ChatBot';
import ConfirmModal from './components/ConfirmModal'; // PUDHU COMPONENT

// --- Pages ---
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
import Contact from './pages/Contact';
import ForgotPassword from './pages/ForgotPassword';

function App() {
  // --- User Session Logic (LocalStorage Sync) ---
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('lifedrop_user');
    try {
        return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
        return null;
    }
  });

  // Modal State
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('lifedrop_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('lifedrop_user');
    }
  }, [user]);

  // Trigger Modal
  const handleLogoutTrigger = () => {
    setShowLogoutConfirm(true);
  };

  // Final Logout Action
  const finalizeLogout = () => {
    setUser(null);
    localStorage.removeItem('lifedrop_user');
    setShowLogoutConfirm(false);
    toast.success("Logged out successfully!");
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
        
        {/* Fixed & Global UI Elements */}
        <Navbar user={user} handleLogout={handleLogoutTrigger} />
        <Toaster richColors position="top-center" />
        <ChatBot />

        {/* CUSTOM LOGOUT CONFIRMATION MODAL */}
        <ConfirmModal 
          isOpen={showLogoutConfirm}
          title="Confirm Logout"
          message="Are you sure you want to sign out? You will need to login again to access your dashboard and alerts."
          confirmText="YES, LOGOUT"
          cancelText="STAY LOGGED IN"
          onConfirm={finalizeLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />

        {/* Main Content Area */}
        <main className="flex-grow pt-24 md:pt-28">
          <Routes>
            {/* 1. Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/register-donor" element={<DonorRegister />} />
            <Route path="/register-requester" element={<RequesterRegister />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/profile/:id" element={<PublicProfile />} />
            <Route path="/blockchain/:id" element={<BlockchainView />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* 2. Donor Protected Routes */}
            <Route 
              path="/donor-dashboard" 
              element={user && user.role === 'donor' ? <DonorDashboard user={user} /> : <Navigate to="/login" />} 
            />

            {/* 3. Requester Protected Routes */}
            <Route 
              path="/requester-dashboard" 
              element={user && user.role === 'requester' ? <RequesterDashboard user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
             path="/new-request" 
             element={user && user.role === 'requester' ? <BloodRequestForm user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/matching/:id" 
              element={user ? <DonorMatching user={user} /> : <Navigate to="/login" />} 
            />

            {/* 4. Admin Portal Protected Routes */}
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

            {/* Catch-all: Redirect to Home */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* Premium Footer Component */}
        <Footer />
        
      </div>
    </Router>
  );
}

export default App;