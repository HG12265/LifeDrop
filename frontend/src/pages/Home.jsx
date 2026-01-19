import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Users } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in duration-700">
      <section className="py-20 text-center px-4">
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight">
          Give Blood, <span className="text-red-600">Save Life.</span>
        </h1>
        <p className="mt-6 text-gray-600 max-w-2xl mx-auto text-lg">
          Connect with blood donors in your area instantly. Your simple act can be someone's second chance.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => navigate('/register-requester')} className="bg-red-600 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl hover:scale-105 transition">
            Request Blood
          </button>
          <button onClick={() => navigate('/register-donor')} className="bg-white border-2 border-red-600 text-red-600 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-red-50 transition">
            Become a Donor
          </button>
        </div>
      </section>

      <section className="bg-white py-16 px-6 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto rounded-3xl shadow-sm mb-20">
        <div className="text-center p-6">
          <MapPin className="mx-auto text-red-600 mb-4" size={40}/>
          <h3 className="font-bold text-xl mb-2">Live Map</h3>
          <p className="text-gray-500">Find real-time locations of donors near you.</p>
        </div>
        <div className="text-center p-6">
          <Heart className="mx-auto text-red-600 mb-4" size={40}/>
          <h3 className="font-bold text-xl mb-2">Verified Donors</h3>
          <p className="text-gray-500">All donors go through an eligibility screening.</p>
        </div>
        <div className="text-center p-6">
          <Users className="mx-auto text-red-600 mb-4" size={40}/>
          <h3 className="font-bold text-xl mb-2">Quick Contact</h3>
          <p className="text-gray-500">Connect directly via phone with potential donors.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;