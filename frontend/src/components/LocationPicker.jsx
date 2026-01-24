import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet'; // 1. Leaflet instance-ah import pannunga
import 'leaflet/dist/leaflet.css';

// --- LEAFLET MARKER BUG FIX START ---
// Vite bundling appo tholaura icons-ah namma direct-ah import panroam
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

const LocationPicker = ({ position, setPosition }) => {
  
  function LocationMarker() {
    const map = useMapEvents({
      click(e) {
        setPosition(e.latlng);
        map.flyTo(e.latlng, map.getZoom());
      },
    });

    const eventHandlers = useMemo(
      () => ({
        dragend(e) {
          const marker = e.target;
          if (marker != null) {
            setPosition(marker.getLatLng());
          }
        },
      }),
      [setPosition]
    );

    return position === null ? null : (
      <Marker
        draggable={true}
        eventHandlers={eventHandlers}
        position={position}
      ></Marker>
    );
  }

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (error) => {
          alert("Error getting location. Please check browser permissions.");
          console.error(error);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Pin Location</label>
        </div>
        <button 
          type="button"
          onClick={handleCurrentLocation}
          className="text-[10px] bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full font-black border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm uppercase tracking-tighter"
        >
          Use Current Location
        </button>
      </div>

      <div className="h-64 w-full rounded-[32px] overflow-hidden border-4 border-white shadow-2xl relative">
        <MapContainer center={[13.0827, 80.2707]} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker />
        </MapContainer>
      </div>

      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center">
         <p className="text-[9px] font-bold text-slate-400 uppercase">
            Coordinates: <span className="text-slate-800">{position.lat.toFixed(4)}, {position.lng.toFixed(4)}</span>
         </p>
         <p className="text-[8px] font-black text-red-400 italic">Drag marker to adjust</p>
      </div>
    </div>
  );
};

export default LocationPicker;