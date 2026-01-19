import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RequesterRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ fullName: '', phone: '', email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/register/requester', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if(res.ok) {
      alert("Registration Successful! Please login.");
      navigate('/login');
    }
  };

  return (
    <div className="max-w-md mx-auto p-10 bg-white shadow-2xl rounded-3xl my-20">
      <h2 className="text-3xl font-black text-gray-800 mb-8 text-center">Requester Sign Up</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="text" placeholder="Full Name" className="p-4 border rounded-2xl focus:ring-2 ring-red-200 outline-none" onChange={e => setFormData({...formData, fullName: e.target.value})} required />
        <input type="tel" placeholder="Phone Number" className="p-4 border rounded-2xl focus:ring-2 ring-red-200 outline-none" onChange={e => setFormData({...formData, phone: e.target.value})} required />
        <input type="email" placeholder="Email Address" className="p-4 border rounded-2xl focus:ring-2 ring-red-200 outline-none" onChange={e => setFormData({...formData, email: e.target.value})} required />
        <input type="password" placeholder="Create Password" className="p-4 border rounded-2xl focus:ring-2 ring-red-200 outline-none" onChange={e => setFormData({...formData, password: e.target.value})} required />
        <button type="submit" className="bg-gray-900 text-white py-4 rounded-2xl font-bold mt-4 hover:bg-black transition">
          Create Account
        </button>
      </form>
    </div>
  );
};

export default RequesterRegister;