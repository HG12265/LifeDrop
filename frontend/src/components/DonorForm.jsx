import React, { useState } from 'react';

const DonorForm = () => {
  const [formData, setFormData] = useState({
    name: '', bloodGroup: '', phone: '', lat: null, lng: null
  });

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData({ ...formData, lat: position.coords.latitude, lng: position.coords.longitude });
        alert("Location Captured!");
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('http://localhost:5000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const result = await response.json();
    alert(result.message);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-red-500">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Be a Hero 💧</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input 
          className="border p-2 rounded" 
          type="text" placeholder="Full Name" 
          onChange={(e) => setFormData({...formData, name: e.target.value})} required 
        />
        <select 
          className="border p-2 rounded"
          onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})} required
        >
          <option value="">Select Blood Group</option>
          <option value="A+">A+</option>
          <option value="B+">B+</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </select>
        <input 
          className="border p-2 rounded" 
          type="text" placeholder="Phone Number" 
          onChange={(e) => setFormData({...formData, phone: e.target.value})} required 
        />
        
        <button 
          type="button" 
          onClick={getLocation}
          className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
        >
          📍 Get My Location
        </button>

        {formData.lat && <p className="text-xs text-green-600">Location pinned!</p>}

        <button 
          type="submit" 
          className="bg-red-600 text-white py-2 rounded font-bold hover:bg-red-700 transition"
        >
          Register as Donor
        </button>
      </form>
    </div>
  );
};

export default DonorForm;