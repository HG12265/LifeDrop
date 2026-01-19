import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet default icon fix (Markers mobile-la theriya idhu mukkiyam)
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const DonorMap = () => {
    const [donors, setDonors] = useState([]);

    useEffect(() => {
        // Backend-la irundhu donors data-va fetch pannuvom
        fetch('http://localhost:5000/donors')
            .then(res => res.json())
            .then(data => setDonors(data))
            .catch(err => console.error("Error fetching donors:", err));
    }, []);

    return (
        <div className="h-[400px] w-full rounded-lg overflow-hidden shadow-inner border-2 border-red-200">
            <MapContainer center={[13.0827, 80.2707]} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                {donors.map((donor, index) => (
                    <Marker key={index} position={[donor.lat, donor.lng]}>
                        <Popup>
                            <div className="text-center">
                                <h3 className="font-bold text-red-600 text-lg">{donor.bloodGroup}</h3>
                                <p className="text-sm font-semibold">{donor.name}</p>
                                <a 
                                    href={`tel:${donor.phone}`} 
                                    className="mt-2 inline-block bg-green-500 text-white px-3 py-1 rounded-full text-xs"
                                >
                                    📞 Call Now
                                </a>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default DonorMap;