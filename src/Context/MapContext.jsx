// src/Context/MapContext.jsx
import { createContext, useContext, useState } from 'react';

const MapContext = createContext();

export const MapProvider = ({ children }) => {
  const [mapCenter, setMapCenter] = useState({ lat: 30.3753, lng: 69.3451 }); // Default: Pakistan
  const [mapZoom, setMapZoom] = useState(6); // Default zoom level

  return (
    <MapContext.Provider value={{ mapCenter, setMapCenter, mapZoom, setMapZoom }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => useContext(MapContext);
