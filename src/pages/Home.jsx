import React, { useEffect, useState, useMemo } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';
import axios from 'axios';
import { useUser } from '../Context/UserContext';
import { FaDirections } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5'; // ✅ IoClose icon import kiya gaya
import { useMap } from '../Context/MapContext';

// --- Component Styles (koi tabdeeli nahi) ---
const containerStyle = { width: '100%', height: '100vh' };
const pakistanBounds = { north: 37.0, south: 23.5, west: 60.9, east: 77.0 };
const darkMapStyle = [
  { featureType: "all", elementType: "geometry", stylers: [{ color: "#1e1e1e" }] },
  { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#000000" }, { weight: 2 }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#3a3a3a" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#444444" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] }
];
const markerIcons = {
  FirstEmail: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  SecondEmail: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
  ThirdEmail: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
};

// --- Main Home Component ---
const Home = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // ✅ Loading aur Error states add ki gayi hain
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ SecondEmail.jsx se behtar image preview modal states li gayi hain
  const [previewImage, setPreviewImage] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const [mapReady, setMapReady] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const { user } = useUser();
  const { mapCenter, mapZoom } = useMap();

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    );
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // ✅ Data fetch karne wale functions mein error handling daali gayi hai
    const fetchPhotos = {
      FirstEmail: async () => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get1stEmailPhotos`);
          return res.data.map(img => ({ ...img, emailKey: 'FirstEmail' }));
        } catch (err) {
          console.error("Error fetching FirstEmail photos:", err);
          throw new Error("Failed to load FirstEmail data.");
        }
      },
      SecondEmail: async () => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get2ndEmailPhotos`);
          return res.data.map(img => ({ ...img, emailKey: 'SecondEmail' }));
        } catch (err) {
          console.error("Error fetching SecondEmail photos:", err);
          throw new Error("Failed to load SecondEmail data.");
        }
      },
      ThirdEmail: async () => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get3rdEmailPhotos`);
          return res.data.map(img => ({ ...img, emailKey: 'ThirdEmail' }));
        } catch (err) {
          console.error("Error fetching ThirdEmail photos:", err);
          throw new Error("Failed to load ThirdEmail data.");
        }
      },
    };

    const fetchAllImages = async () => {
      setLoading(true);
      setError(null);
      try {
        const permissions = [];
        if (user?.role === 'admin') {
          permissions.push('FirstEmail', 'SecondEmail', 'ThirdEmail');
        } else {
          if (user?.permissions?.includes('FirstEmail')) permissions.push('FirstEmail');
          if (user?.permissions?.includes('SecondEmail')) permissions.push('SecondEmail');
          if (user?.permissions?.includes('ThirdEmail')) permissions.push('ThirdEmail');
        }
        
        const filteredPermissions = permissions.filter(p => selectedFilter === 'All' || selectedFilter === p);
        
        const promises = filteredPermissions.map(key => fetchPhotos[key]());
        const results = await Promise.all(promises);
        
        setImages(results.flat());
      } catch (err) {
        setError(err.message || "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAllImages();
    }
  }, [user, selectedFilter]);

  // ✅ SecondEmail.jsx se preview modal open karne ka function liya gaya
  const openPreview = (photoUrl) => {
    setPreviewImage(photoUrl);
    setIsFullscreen(false);
    setZoom(1);
  };
  
  const filters = ['All'];
  if (user?.role === 'admin' || user?.permissions?.includes('FirstEmail')) filters.push('FirstEmail');
  if (user?.role === 'admin' || user?.permissions?.includes('SecondEmail')) filters.push('SecondEmail');
  if (user?.role === 'admin' || user?.permissions?.includes('ThirdEmail')) filters.push('ThirdEmail');

  // ✅ Performance behtar karne ke liye useMemo ka istemal
  const heatmapData = useMemo(() => {
    if (!mapReady || !window.google) return [];
    return images.map(img => new window.google.maps.LatLng(img.latitude, img.longitude));
  }, [images, mapReady]);


  return (
    <div className="h-screen w-full relative">
      {/* --- Loading aur Error Overlays --- */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50">
          <p className="text-white text-lg">Loading Photos...</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-red-900 bg-opacity-80">
          <p className="text-white text-lg">Error: {error}</p>
        </div>
      )}

      {/* --- Controls --- */}
      <div className="absolute z-10 top-2 left-1/2 transform -translate-x-1/2 flex gap-2 p-2">
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="border px-3 py-1 dark:bg-zinc-800 bg-white dark:text-white text-black text-center rounded text-sm"
        >
          {filters.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
        </button>
      </div>

      {/* --- Google Map --- */}
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={['visualization']}>
        <GoogleMap
          key={`${mapCenter.lat}-${mapCenter.lng}-${mapZoom}`}
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={mapZoom}
          onLoad={() => setMapReady(true)}
          options={{
            styles: isDarkMode ? darkMapStyle : undefined,
            disableDefaultUI: false,
            restriction: { latLngBounds: pakistanBounds, strictBounds: true },
            gestureHandling: 'greedy'
          }}
        >
          {mapReady && images.map((img) => (
            <Marker
              key={img._id}
              position={{ lat: img.latitude, lng: img.longitude }}
              onClick={() => setSelectedImage(img)}
              icon={markerIcons[img.emailKey] || markerIcons.FirstEmail}
            />
          ))}

          {mapReady && showHeatmap && heatmapData.length > 0 && (
            <HeatmapLayer data={heatmapData} options={{ radius: 50 }} />
          )}

          {selectedImage && (
            <InfoWindow
              position={{ lat: selectedImage.latitude, lng: selectedImage.longitude }}
              onCloseClick={() => setSelectedImage(null)}
            >
              <div className="w-fit max-w-sm p-2 rounded-md bg-white shadow-lg">
                <img
                  // ✅ Image URL ab a_id se banega
                  src={`${import.meta.env.VITE_BASE_URL}/photos/image-data/${selectedImage._id}`}
                  alt={selectedImage.name}
                  onClick={() => openPreview(`${import.meta.env.VITE_BASE_URL}/photos/image-data/${selectedImage._id}`)}
                  className="w-full h-40 object-cover rounded cursor-pointer"
                  loading="lazy" // ✅ Lazy loading add ki gayi hai
                />
                <div className="mt-2 text-sm space-y-1">
                  <p className="text-gray-500">
                    <span className="font-semibold text-black">District:</span> {selectedImage.district || '—'}
                  </p>
                  <p className="text-xs text-gray-400 uppercase">
                    Uploaded by: {selectedImage.uploadedBy}
                  </p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedImage.latitude},${selectedImage.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded"
                  >
                    Get Directions <FaDirections />
                  </a>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>

      {/* ✅ SecondEmail.jsx se liya gaya behtar fullscreen/zoomable Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => setPreviewImage(null)}>
          <div
            className={`relative flex items-center justify-center ${isFullscreen ? "w-screen h-screen" : "w-[90vw] h-[90vh] max-w-4xl max-h-4xl"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <IoClose
              size={32}
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 text-white cursor-pointer z-20 bg-black/50 rounded-full p-1"
            />
            <div className="absolute bottom-4 right-4 flex gap-2 z-20">
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</button>
              <button onClick={() => setZoom((z) => Math.min(z + 0.2, 3))} className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm">➕</button>
              <button onClick={() => setZoom((z) => Math.max(z - 0.2, 1))} className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm">➖</button>
            </div>
            <div className="w-full h-full overflow-hidden flex items-center justify-center">
              <img
                src={previewImage}
                alt="Preview"
                style={{ transform: `scale(${zoom})` }}
                className="transition-transform duration-200 max-w-full max-h-full object-contain"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
