import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';
import axios from 'axios';
import { useUser } from '../Context/UserContext';
import { FaDirections, FaTimes } from 'react-icons/fa';
import { useMap } from '../Context/MapContext';

const containerStyle = { width: '100%', height: '100vh' };
const pakistanBounds = { north: 37.0, south: 23.5, west: 60.9, east: 77.0 };

const darkMapStyle = [
  // Aapka dark map style aisy hi rahega
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
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

  const fetchPhotos = {
    FirstEmail: async () => {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get1stEmailPhotos`);
      // ✅ TABDEELI KI GAYI HAI: Backend { photos: [...] } bhejta hai, isliye res.data.photos istemal karein
      return res.data.photos.map(img => ({
        ...img,
        emailKey: 'FirstEmail',
        url: `${import.meta.env.VITE_BASE_URL}/photos/image-data/${img._id}`
      }));
    },
    SecondEmail: async () => {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get2ndEmailPhotos`);
      // ✅ TABDEELI KI GAYI HAI: res.data.photos istemal karein
      return res.data.photos.map(img => ({
        ...img,
        emailKey: 'SecondEmail',
        url: `${import.meta.env.VITE_BASE_URL}/photos/image-data/${img._id}`
      }));
    },
    ThirdEmail: async () => {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get3rdEmailPhotos`);
      // ✅ TABDEELI KI GAYI HAI: res.data.photos istemal karein
      return res.data.photos.map(img => ({
        ...img,
        emailKey: 'ThirdEmail',
        url: `${import.meta.env.VITE_BASE_URL}/photos/image-data/${img._id}`
      }));
    },
  };

  useEffect(() => {
    const fetchImages = async () => {
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
        // Yahan aap user ko error message dikha sakte hain
      }
    };
    if (user) { // Sirf user ke login hone par data fetch karein
      fetchImages();
    }
  }, [user, selectedFilter]);

  const filters = ['All'];
  if (user?.role === 'admin' || user?.permissions?.includes('FirstEmail')) filters.push('FirstEmail');
  if (user?.role === 'admin' || user?.permissions?.includes('SecondEmail')) filters.push('SecondEmail');
  if (user?.role === 'admin' || user?.permissions?.includes('ThirdEmail')) filters.push('ThirdEmail');

  const heatmapData = images.map(img => new window.google.maps.LatLng(img.latitude, img.longitude));

  return (
    <div className="h-screen w-full relative">
      {/* Controls */}
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

      {/* Google Map */}
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
          {/* Markers */}
          {mapReady && images.map((img) => (
            <Marker
              key={img._id} // Database ID hamesha unique hoti hai
              position={{ lat: img.latitude, lng: img.longitude }}
              onClick={() => setSelectedImage({ ...img, zoom: false })}
              icon={markerIcons[img.emailKey] || markerIcons.FirstEmail}
            />
          ))}

          {/* Heatmap */}
          {mapReady && showHeatmap && heatmapData.length > 0 && (
            <HeatmapLayer data={heatmapData} options={{ radius: 50 }} />
          )}

          {/* InfoWindow */}
          {selectedImage && (
            <InfoWindow
              position={{ lat: selectedImage.latitude, lng: selectedImage.longitude }}
              onCloseClick={() => setSelectedImage(null)}
            >
              <div className="w-fit max-w-sm p-2 rounded-md bg-white shadow-lg text-gray-800">
                <div className="relative group">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.name}
                    onClick={() => setPreviewImage(selectedImage.url)}
                    className={`w-full object-contain rounded cursor-pointer transition-transform duration-300 ${selectedImage.zoom ? 'scale-125' : 'scale-100'}`}
                    style={{ height: selectedImage.zoom ? '300px' : '160px' }}
                  />
                  <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setSelectedImage(prev => ({ ...prev, zoom: true }))} className="bg-black/70 text-white px-2 py-1 rounded text-xs hover:bg-black">+</button>
                    <button onClick={() => setSelectedImage(prev => ({ ...prev, zoom: false }))} className="bg-black/70 text-white px-2 py-1 rounded text-xs hover:bg-black">−</button>
                  </div>
                </div>

                <div className="mt-2 text-sm space-y-1">
                  <p><span className="font-semibold">GPS:</span> {selectedImage.latitude}, {selectedImage.longitude}</p>
                  <div>
                    <p><span className="font-semibold">District:</span> {selectedImage.district || 'N/A'}</p>
                    <p><span className="font-semibold">Village:</span> {selectedImage.village || 'N/A'}</p>
                    <p><span className="font-semibold">Tehsil:</span> {selectedImage.tehsil || 'N/A'}</p>
                    <p><span className="font-semibold">Country:</span> {selectedImage.country || 'N/A'}</p>
                  </div>
                  <p className="text-xs"><span className="uppercase font-semibold">Uploaded by:</span> {selectedImage.uploadedBy}</p>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedImage.latitude},${selectedImage.longitude}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded">
                    Get Directions <FaDirections />
                  </a>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)} className="absolute -top-3 -right-3 bg-white text-black rounded-full p-2 hover:bg-gray-200 transition z-10">
              <FaTimes />
            </button>
            <img src={previewImage} alt="Preview" className="w-full h-auto max-h-[90vh] object-contain rounded-lg shadow-lg" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
