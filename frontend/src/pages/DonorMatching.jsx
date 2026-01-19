import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { ShieldCheck, MapPin, Send, ArrowLeft, Heart, Activity, Phone } from 'lucide-react';

const DonorMatching = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState({ request: null, matches: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`http://localhost:5000/api/match-donors/${id}`)
            .then(res => res.json())
            .then(val => {
                setData(val);
                setLoading(false);
            })
            .catch(err => console.error("Fetch error:", err));
    }, [id]);

    const sendRequest = async (donorId) => {
        try {
            const res = await fetch('http://localhost:5000/api/send-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ donor_id: donorId, request_id: id })
            });
            const result = await res.json();
            alert(result.message);
        } catch (err) {
            alert("Failed to send request.");
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-red-600 mb-4"></div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight italic">MATCHING NEARBY HEROES...</h2>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* LEFT: MAP VIEW */}
            <div className="h-[450px] lg:h-[650px] rounded-[48px] overflow-hidden shadow-2xl border-8 border-white sticky top-24">
                <MapContainer center={[data.request.lat, data.request.lng]} zoom={12} style={{height: '100%'}}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[data.request.lat, data.request.lng]}>
                        <Popup>🚨 Emergency Location</Popup>
                    </Marker>
                    <Circle center={[data.request.lat, data.request.lng]} radius={10000} pathOptions={{color: 'red', fillOpacity: 0.05}} />
                    
                    {data.matches.map(donor => (
                        <Marker key={donor.unique_id} position={[donor.lat, donor.lng]}>
                            <Popup>
                                <div className="text-center font-bold">
                                    {donor.name} <br/>
                                    <span className="text-red-600">{donor.match}% Match</span>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* RIGHT: DONOR LIST */}
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                    <div>
                        <h2 className="text-3xl font-black text-gray-800 tracking-tighter italic">Heroes Found</h2>
                        <p className="text-sm font-bold text-red-600 uppercase tracking-widest">Blood Group: {data.request.blood}</p>
                    </div>
                    <button onClick={() => navigate('/requester-dashboard')} className="bg-gray-50 p-3 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600 transition">
                        <ArrowLeft size={24} />
                    </button>
                </div>

                <div className="grid gap-5">
                    {data.matches.map(donor => (
                        <div key={donor.unique_id} className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl transition group">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center group-hover:bg-red-50 transition">
                                        <Heart className="text-red-600" fill={donor.match > 80 ? 'currentColor' : 'none'} size={28} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-800 text-xl">{donor.name}</h4>
                                        <div className="flex flex-col gap-1 mt-1">
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-black text-gray-400 flex items-center gap-1 uppercase">
                                                    <MapPin size={12}/> {donor.distance} KM
                                                </span>
                                                <span className="text-[10px] font-black text-gray-400 flex items-center gap-1 uppercase border-l pl-4">
                                                    <Activity size={12}/> {donor.healthScore}% Health
                                                </span>
                                            </div>
                                            {/* CALL LINK - Now safe with Phone import */}
                                            <a href={`tel:${donor.phone}`} className="text-xs font-bold text-blue-600 flex items-center gap-1 mt-1 hover:underline">
                                                <Phone size={12} fill="currentColor"/> {donor.phone}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-black text-green-600">{donor.match}%</div>
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Match</p>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between border-t pt-4">
                                <p className="text-xs font-bold text-gray-400 tracking-widest">ID: #{donor.unique_id}</p>
                                <button 
                                    onClick={() => sendRequest(donor.unique_id)}
                                    className="bg-gray-900 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 hover:bg-red-600 transition active:scale-95"
                                >
                                    <Send size={16} /> SEND REQUEST
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DonorMatching;