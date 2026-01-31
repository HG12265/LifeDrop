import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';

// --- MARKER BUG FIX ---
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// 1. Intha component thaan map-ah automatic-ah move pannum
const MapRecenter = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      // flyTo use panna smooth-ah antha location-ku map pogum
      map.flyTo([position.lat, position.lng], 15, {
        animate: true,
        duration: 1.5 // 1.5 seconds travel time
      });
    }
  }, [position, map]);
  return null;
};

const LocationPicker = ({ position, setPosition }) => {
  
  // Map-la click panna marker move aaga
  function LocationMarker() {
    useMapEvents({
      click(e) {
        setPosition(e.latlng);
      },
    });

    return position === null ? null : (
      <Marker
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            if (marker != null) {
              setPosition(marker.getLatLng());
            }
          },
        }}
        position={position}
      ></Marker>
    );
  }

  // 2. Improved Accuracy Geolocation Logic
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      return toast.error("Geolocation is not supported by your browser.");
    }

    const options = {
      enableHighAccuracy: true, // GPS use panni accurate-ah edukka
      timeout: 10000,           // 10 seconds wait pannum
      maximumAge: 0             // Cache panna location-ah edukkaama fresh-ah edukka
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setPosition(newPos); // State update aagum pothu MapRecenter trigger aagum
      },
      (err) => {
        toast.error("Error: " + err.message + ". Please enable GPS/Location.");
      },
      options
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">📍 Pin Your Location</label>
        <button 
          type="button"
          onClick={handleCurrentLocation}
          className="text-[10px] bg-blue-600 text-white px-4 py-1.5 rounded-full font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition active:scale-95"
        >
          USE MY CURRENT LOCATION
        </button>
      </div>

      <div className="h-64 w-full rounded-[32px] overflow-hidden border-4 border-white shadow-2xl z-0">
        <MapContainer 
          center={[position.lat, position.lng]} 
          zoom={13} 
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* Map-ah move panna intha helper component mukkiyam */}
          <MapRecenter position={position} />
          
          <LocationMarker />
        </MapContainer>
      </div>
      
      <div className="flex justify-center">
        <p className="text-[9px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 uppercase tracking-tighter">
          Lat: {position.lat.toFixed(4)} | Lng: {position.lng.toFixed(4)} (Drag marker to adjust)
        </p>
      </div>
    </div>
  );
};

export default LocationPicker;