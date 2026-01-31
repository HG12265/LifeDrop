import React, { useEffect, useState } from 'react';
import { API_URL } from '../config'; 
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { ShieldCheck, MapPin, Send, ArrowLeft, Heart, Activity, Phone } from 'lucide-react';

// --- LEAFLET MARKER BUG FIX START ---
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});
// --- LEAFLET MARKER BUG FIX END ---

const DonorMatching = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState({ request: null, matches: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/api/match-donors/${id}`)
            .then(res => res.json())
            .then(val => {
                setData(val);
                setLoading(false);
            })
            .catch(err => console.error("Fetch error:", err));
    }, [id]);

    const sendRequest = async (donorId) => {
        try {
            const res = await fetch(`${API_URL}/api/send-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ donor_id: donorId, request_id: id })
            });
            const result = await res.json();
            toast.success(result.message);
        } catch (err) {
            toast.error("Failed to send request.");
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-red-600 mb-4"></div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight italic uppercase">Scanning for Heroes...</h2>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
            
            {/* LEFT: MAP VIEW - Responsive Sticky Logic Applied */}
            <div className="h-[350px] md:h-[450px] lg:h-[calc(100vh-150px)] rounded-[32px] md:rounded-[48px] overflow-hidden shadow-2xl border-4 md:border-8 border-white lg:sticky lg:top-28 z-10">
                <MapContainer center={[data.request.lat, data.request.lng]} zoom={12} style={{height: '100%', width: '100%'}}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    
                    {/* Requester Marker */}
                    <Marker position={[data.request.lat, data.request.lng]}>
                        <Popup>🚨 Emergency Location</Popup>
                    </Marker>
                    <Circle center={[data.request.lat, data.request.lng]} radius={10000} pathOptions={{color: 'red', fillOpacity: 0.05}} />
                    
                    {/* Donor Markers */}
                    {data.matches.map(donor => (
                        <Marker key={donor.unique_id} position={[donor.lat, donor.lng]}>
                            <Popup>
                                <div className="text-center font-bold">
                                    <p className="text-red-600 font-black">{donor.blood}</p>
                                    <p className="text-xs">{donor.name}</p>
                                    <p className="text-[10px] text-green-600">{donor.match}% Match</p>
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
                        <h2 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tighter italic text-red-600 uppercase">Heroes Found</h2>
                        <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Requesting {data.request.blood} Group</p>
                    </div>
                    <button onClick={() => navigate('/requester-dashboard')} className="bg-slate-50 p-3 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600 transition shadow-sm">
                        <ArrowLeft size={24} />
                    </button>
                </div>

                <div className="grid gap-5">
                    {data.matches.length > 0 ? data.matches.map(donor => (
                        <div key={donor.unique_id} className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className="bg-slate-50 w-14 h-14 md:w-16 md:h-16 rounded-3xl flex items-center justify-center group-hover:bg-red-50 transition border border-transparent group-hover:border-red-100">
                                        <Heart className="text-red-600" fill={donor.match > 85 ? 'currentColor' : 'none'} size={24} />
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="font-black text-gray-800 text-lg md:text-xl leading-none">{donor.name}</h4>
                                            <span className={`text-[7px] md:text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${donor.isExact ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {donor.isExact ? 'Exact Match' : 'Compatible'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex flex-col gap-1 mt-2">
                                            <p className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                Donor Group: <span className="text-red-600 font-bold">{donor.blood}</span>
                                            </p>
                                            <div className="flex items-center gap-2 md:gap-3 mt-1">
                                                <span className="text-[8px] md:text-[9px] font-black text-gray-400 flex items-center gap-1 uppercase bg-slate-50 px-2 py-1 rounded-lg">
                                                    <MapPin size={10} className="text-red-500"/> {donor.distance} KM
                                                </span>
                                                <span className="text-[8px] md:text-[9px] font-black text-gray-400 flex items-center gap-1 uppercase bg-slate-50 px-2 py-1 rounded-lg border-l-2 border-green-500">
                                                    <Activity size={10} className="text-green-500"/> {donor.healthScore}%
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="bg-slate-100 p-1 rounded-full text-slate-400">
                                                    <Phone size={10} />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 tracking-widest italic">{donor.phone}</span>
                                                <span className="text-[7px] font-black bg-slate-800 text-white px-2 py-0.5 rounded-full tracking-widest uppercase opacity-20">Masked</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className={`text-2xl md:text-3xl font-black ${donor.match > 80 ? 'text-green-600' : 'text-orange-500'}`}>{donor.match}%</div>
                                    <p className="text-[8px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest italic leading-none">Match</p>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between border-t border-dashed border-gray-100 pt-5">
                                <p className="text-[8px] md:text-[9px] font-bold text-gray-300 tracking-[0.2em] uppercase italic">ID: #{donor.unique_id}</p>
                                <button 
                                    onClick={() => sendRequest(donor.unique_id)}
                                    className="bg-slate-900 text-white px-6 md:px-10 py-3 md:py-3.5 rounded-[20px] font-black text-[10px] md:text-xs shadow-xl flex items-center gap-2 hover:bg-red-600 transition-all duration-300 transform active:scale-95 shadow-slate-200 uppercase tracking-widest"
                                >
                                    <Send size={14} /> Send Request
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="bg-white p-10 md:p-20 rounded-[48px] border-2 border-dashed border-gray-100 text-center flex flex-col items-center animate-pulse">
                            <ShieldCheck size={60} className="text-gray-100 mb-4" />
                            <p className="text-gray-400 font-black uppercase tracking-widest">No compatible donors found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DonorMatching;