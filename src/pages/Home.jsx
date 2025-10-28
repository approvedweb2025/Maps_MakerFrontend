import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';
import axios from 'axios';
import { useUser } from '../Context/UserContext';
import { FaDirections, FaTimes } from 'react-icons/fa';
import { IoClose } from "react-icons/io5"; // ✅ Naya Icon import kiya hai
import { useMap } from '../Context/MapContext';

// --- Styles aur constants waise hi rahenge ---
const containerStyle = { width: '100%', height: 'calc(100vh - 50px)' }; // Thori height adjust ki hai
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

const Home = () => {
  // --- Purane States ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const { user } = useUser();
  const { mapCenter, mapZoom } = useMap();

  // --- ✅ Naye States (Images.jsx se) ---
  const [viewMode, setViewMode] = useState('map'); // 'map' ya 'grid'
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    );
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    return () => observer.disconnect();
  }, []);

  const fetchPhotos = {
    // ... aapka fetchPhotos ka object bilkul waise hi rahega
    FirstEmail: async () => {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get1stEmailPhotos`);
      return res.data.photos.map(img => ({ ...img, emailKey: 'FirstEmail', url: `${import.meta.env.VITE_BASE_URL}/photos/image-data/${img._id}` }));
    },
    SecondEmail: async () => {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get2ndEmailPhotos`);
      return res.data.photos.map(img => ({ ...img, emailKey: 'SecondEmail', url: `${import.meta.env.VITE_BASE_URL}/photos/image-data/${img._id}` }));
    },
    ThirdEmail: async () => {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get3rdEmailPhotos`);
      return res.data.photos.map(img => ({ ...img, emailKey: 'ThirdEmail', url: `${import.meta.env.VITE_BASE_URL}/photos/image-data/${img._id}` }));
    },
  };

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true); // Loading shuru
      let all = [];
      const permissions = [];
      if (user?.role === 'admin') {
        permissions.push('FirstEmail', 'SecondEmail', 'ThirdEmail');
      } else {
        if (user?.permissions?.includes('FirstEmail')) permissions.push('FirstEmail');
        if (user?.permissions?.includes('SecondEmail')) permissions.push('SecondEmail');
        if (user?.permissions?.includes('ThirdEmail')) permissions.push('ThirdEmail');
      }

      try {
        for (const emailKey of permissions) {
          if (selectedFilter === 'All' || selectedFilter === emailKey) {
            const data = await fetchPhotos[emailKey]();
            all.push(...data);
          }
        }
        setImages(all);
      } catch (error) {
        console.error("Failed to fetch images:", error);
      } finally {
        setLoading(false); // Loading khatam
      }
    };
    if (user) {
      fetchImages();
    }
  }, [user, selectedFilter]);

  const filters = ['All'];
  if (user?.role === 'admin' || user?.permissions?.includes('FirstEmail')) filters.push('FirstEmail');
  if (user?.role === 'admin' || user?.permissions?.includes('SecondEmail')) filters.push('SecondEmail');
  if (user?.role === 'admin' || user?.permissions?.includes('ThirdEmail')) filters.push('ThirdEmail');

  const heatmapData = images.map(img => new window.google.maps.LatLng(img.latitude, img.longitude));

  // ✅ Naya Function: Advanced modal kholne ke liye
  const openPreviewModal = (imageUrl) => {
    setPreviewImage(imageUrl);
    setIsFullscreen(false);
    setZoom(1);
  };

  return (
    <div className="h-screen w-full relative">
      {/* Controls */}
      <div className="absolute z-10 top-2 left-1/2 transform -translate-x-1/2 flex items-center gap-2 p-2 bg-white/80 dark:bg-zinc-900/80 rounded-lg shadow-md">
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="border px-3 py-1.5 dark:bg-zinc-800 bg-gray-100 dark:text-white text-black text-center rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {filters.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
        </button>

        {/* ✅ Naya Button: View switch karne ke liye */}
        <button
          onClick={() => setViewMode(viewMode === 'map' ? 'grid' : 'map')}
          className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          {viewMode === 'map' ? 'Grid View' : 'Map View'}
        </button>
      </div>

      {/* Conditional Rendering: Map ya Grid dikhayein */}
      {viewMode === 'map' ? (
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={['visualization']}>
          <GoogleMap
            key={`${mapCenter.lat}-${mapCenter.lng}-${mapZoom}`}
            mapContainerStyle={{ width: '100%', height: '100vh' }}
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
                <div className="w-fit max-w-sm p-2 rounded-md bg-white shadow-lg text-gray-800">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.name}
                    onClick={() => openPreviewModal(selectedImage.url)} // ✅ Yahan naya modal function call kiya hai
                    className="w-full h-40 object-contain rounded cursor-pointer"
                  />
                  <div className="mt-2 text-sm space-y-1">
                    <p><span className="font-semibold">GPS:</span> {selectedImage.latitude.toFixed(5)}, {selectedImage.longitude.toFixed(5)}</p>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedImage.latitude},${selectedImage.longitude}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded">
                      Directions <FaDirections />
                    </a>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      ) : (
        // ✅ Naya Hissa: Image Grid View (Images.jsx se liya gaya)
        <div className="pt-20 px-4 pb-4 max-h-[100vh] overflow-y-auto">
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 mt-8">Loading photos...</p>
          ) : images.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No images found for the selected filter.</p>
          ) : (
            <div className="w-full grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {images.map((img) => (
                <div
                  key={img._id}
                  className="aspect-square overflow-hidden rounded-lg shadow-md relative group cursor-pointer"
                  onClick={() => openPreviewModal(img.url)}
                >
                  <img
                    src={img.url}
                    alt={img.name || 'Image'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-60 text-white p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="truncate font-semibold">Uploaded by: {img.uploadedBy}</p>
                    <p>District: {img.district || 'N/A'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ✅ Naya Hissa: Advanced Image Preview Modal (Images.jsx se liya gaya) */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={() => setPreviewImage(null)}>
          <div
            className={`relative flex items-center justify-center w-full h-full max-w-5xl max-h-5xl p-4 ${isFullscreen ? "w-screen h-screen max-w-full max-h-full" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <IoClose size={32} onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 text-white cursor-pointer z-20 bg-black/50 rounded-full p-1" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              <button onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))} className="bg-black/50 text-white w-10 h-10 rounded-full text-lg">－</button>
              <button onClick={() => setZoom((z) => Math.min(z + 0.2, 5))} className="bg-black/50 text-white w-10 h-10 rounded-full text-lg">＋</button>
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="bg-black/50 text-white px-4 py-2 rounded-full text-sm">{isFullscreen ? "Exit" : "Fullscreen"}</button>
            </div>
            <div className="w-full h-full overflow-hidden flex items-center justify-center">
              <img
                src={previewImage}
                alt="Full preview"
                style={{ transform: `scale(${zoom})` }}
                className="transition-transform duration-200 max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
