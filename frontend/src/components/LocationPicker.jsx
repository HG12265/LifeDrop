import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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
    navigator.geolocation.getCurrentPosition((pos) => {
      setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-bold text-gray-700">📍 Pin Your Location</label>
        <button 
          type="button"
          onClick={handleCurrentLocation}
          className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold border border-blue-100"
        >
          Use Current Location
        </button>
      </div>
      <div className="h-60 w-full rounded-2xl overflow-hidden border-2 border-gray-100 shadow-inner">
        <MapContainer center={[13.0827, 80.2707]} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker />
        </MapContainer>
      </div>
      <p className="text-[10px] text-gray-400">Lat: {position.lat.toFixed(4)} | Lng: {position.lng.toFixed(4)} (Drag marker to adjust)</p>
    </div>
  );
};

export default LocationPicker;