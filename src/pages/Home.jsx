import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';
import axios from 'axios';
import { useUser } from '../Context/UserContext';
import { FaDirections } from 'react-icons/fa';
import { useMap } from '../Context/MapContext';

const containerStyle = { width: '100%', height: '100vh' };
const pakistanBounds = { north: 37.0, south: 23.5, west: 60.9, east: 77.0 };

// 👇 Libraries constant to avoid reloading warning
const libraries = ['visualization'];

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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const { user } = useUser();
  const { mapCenter, mapZoom } = useMap();

  // Dark mode observer
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    );
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    return () => observer.disconnect();
  }, []);

  // ✅ Fetch images from backend (GridFS version)
  const fetchPhotos = {
    FirstEmail: async () => {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get1stEmailPhotos`, { withCredentials: true });
      return res.data.map(img => {
        // Prefer Cloudinary when available
        const isObjectId = /^[a-f0-9]{24}$/i.test(String(img.fileId || ''));
        const primaryUrl = img.cloudinaryUrl
          ? img.cloudinaryUrl
          : (isObjectId
            ? `${import.meta.env.VITE_BASE_URL}/photos/file/${img.fileId}`
            : `https://drive.google.com/uc?export=view&id=${img.driveFileId || img.fileId}`);
        return {
          ...img,
          emailKey: 'FirstEmail',
          url: primaryUrl,
        };
      });
    },
    SecondEmail: async () => {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get2ndEmailPhotos`, { withCredentials: true });
      return res.data.map(img => {
        const isObjectId = /^[a-f0-9]{24}$/i.test(String(img.fileId || ''));
        const primaryUrl = img.cloudinaryUrl
          ? img.cloudinaryUrl
          : (isObjectId
            ? `${import.meta.env.VITE_BASE_URL}/photos/file/${img.fileId}`
            : `https://drive.google.com/uc?export=view&id=${img.driveFileId || img.fileId}`);
        return {
          ...img,
          emailKey: 'SecondEmail',
          url: primaryUrl,
        };
      });
    },
    ThirdEmail: async () => {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get3rdEmailPhotos`, { withCredentials: true });
      return res.data.map(img => {
        const isObjectId = /^[a-f0-9]{24}$/i.test(String(img.fileId || ''));
        const primaryUrl = img.cloudinaryUrl
          ? img.cloudinaryUrl
          : (isObjectId
            ? `${import.meta.env.VITE_BASE_URL}/photos/file/${img.fileId}`
            : `https://drive.google.com/uc?export=view&id=${img.driveFileId || img.fileId}`);
        return {
          ...img,
          emailKey: 'ThirdEmail',
          url: primaryUrl,
        };
      });
    },
  };

  useEffect(() => {
    const fetchImages = async () => {
      try {
        let all = [];
        const permissions = [];

        if (user?.role === 'admin') {
          permissions.push('FirstEmail', 'SecondEmail', 'ThirdEmail');
        } else if (user && Array.isArray(user?.permissions)) {
          if (user.permissions.includes('FirstEmail')) permissions.push('FirstEmail');
          if (user.permissions.includes('SecondEmail')) permissions.push('SecondEmail');
          if (user.permissions.includes('ThirdEmail')) permissions.push('ThirdEmail');
        } else {
          // No user or no explicit permissions → show all by default
          permissions.push('FirstEmail', 'SecondEmail', 'ThirdEmail');
        }

        for (const emailKey of permissions) {
          if (selectedFilter === 'All' || selectedFilter === emailKey) {
            const data = await fetchPhotos[emailKey]();
            all.push(...data);
          }
        }
        setImages(all);
      } catch (err) {
        console.error("❌ Failed to fetch images:", err);
      }
    };

    fetchImages();
  }, [user, selectedFilter]);

  const filters = ['All'];
  if (user?.role === 'admin' || user?.permissions?.includes('FirstEmail')) filters.push('FirstEmail');
  if (user?.role === 'admin' || user?.permissions?.includes('SecondEmail')) filters.push('SecondEmail');
  if (user?.role === 'admin' || user?.permissions?.includes('ThirdEmail')) filters.push('ThirdEmail');

  const heatmapData = (typeof window !== 'undefined' && window.google && mapReady)
    ? images.map(img => new window.google.maps.LatLng(img.latitude, img.longitude))
    : [];

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

      <LoadScript
        googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
        libraries={libraries}
      >
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
          {mapReady && images.map((img, index) => (
            <Marker
              key={index}
              position={{ lat: img.latitude, lng: img.longitude }}
              onClick={() => setSelectedImage(img)}
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
              <div className="w-fit max-w-sm p-2 rounded-md bg-white shadow-lg">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.name}
                  className="w-full h-40 object-scale-down rounded"
                  onError={(e) => {
                    const fallbackId = selectedImage.driveFileId || selectedImage.fileId;
                    if (fallbackId) {
                      e.currentTarget.src = `https://drive.google.com/uc?export=view&id=${fallbackId}`;
                    }
                  }}
                />
                <div className="mt-2 text-sm space-y-1">
                  <p className="text-gray-400">
                    <span className="font-semibold text-black">GPS:</span> {selectedImage.latitude}, {selectedImage.longitude}
                  </p>
                  <div className="text-gray-400">
                    <p><span className="font-semibold text-black">District:</span> {selectedImage.district || '—'}</p>
                    <p><span className="font-semibold text-black">Village:</span> {selectedImage.village || '—'}</p>
                    <p><span className="font-semibold text-black">Tehsil:</span> {selectedImage.tehsil || '—'}</p>
                    <p><span className="font-semibold text-black">Country:</span> {selectedImage.country || '—'}</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    <span className="uppercase font-semibold text-black">Uploaded by:</span> {selectedImage.uploadedBy}
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
    </div>
  );
};

export default Home;
