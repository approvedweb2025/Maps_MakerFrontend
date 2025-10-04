import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';
import axios from 'axios';
import { useUser } from '../Context/UserContext';
import { FaDirections } from 'react-icons/fa';
import { useMap } from '../Context/MapContext';
import { buildApiUrl } from '../config/api';

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
  const [isLoading, setIsLoading] = useState(false);
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

  // ✅ Build a reliable display URL: Cloudinary → GridFS stream → Google Drive
  const buildPhoto = (img, emailKey) => {
    const isObjectId = /^[a-f0-9]{24}$/i.test(String(img.fileId || ''));
    const primaryUrl = img.cloudinaryUrl
      ? img.cloudinaryUrl
      : (isObjectId
        ? buildApiUrl(`/photos/file/${img.fileId}`)
        : `https://drive.google.com/uc?export=view&id=${img.driveFileId || img.fileId}`);
    return { ...img, emailKey, url: primaryUrl };
  };

  // Fetch images from backend
  const fetchPhotos = {
    FirstEmail: async () => {
      try {
        console.log('🔄 FirstEmail: API URL:', buildApiUrl('/photos/get1stEmailPhotos'));
        const res = await axios.get(buildApiUrl('/photos/get1stEmailPhotos'));
        console.log("✅ FirstEmail: Response status:", res.status);
        console.log("✅ FirstEmail: Response data:", res.data);
        const images = res.data.photos || res.data; // Handle both formats
        console.log("✅ FirstEmail: Processed images:", images.length);
        
        return images.map(img => buildPhoto(img, 'FirstEmail'));
      } catch (err) {
        console.error('❌ Error fetching First Email photos:', err);
        console.error('❌ Error details:', err.response?.data || err.message);
        return []; // Return empty array instead of mock data
      }
    },
    SecondEmail: async () => {
      try {
        console.log('🔄 SecondEmail: API URL:', buildApiUrl('/photos/get2ndEmailPhotos'));
        const res = await axios.get(buildApiUrl('/photos/get2ndEmailPhotos'));
        console.log("✅ SecondEmail: Response status:", res.status);
        console.log("✅ SecondEmail: Response data:", res.data);
        const images = res.data.photos || res.data; // Handle both formats
        console.log("✅ SecondEmail: Processed images:", images.length);
        
        return images.map(img => buildPhoto(img, 'SecondEmail'));
      } catch (err) {
        console.error('❌ Error fetching Second Email photos:', err);
        console.error('❌ Error details:', err.response?.data || err.message);
        return []; // Return empty array instead of mock data
      }
    },
    ThirdEmail: async () => {
      try {
        console.log('🔄 ThirdEmail: API URL:', buildApiUrl('/photos/get3rdEmailPhotos'));
        const res = await axios.get(buildApiUrl('/photos/get3rdEmailPhotos'));
        console.log("✅ ThirdEmail: Response status:", res.status);
        console.log("✅ ThirdEmail: Response data:", res.data);
        const images = res.data.photos || res.data; // Handle both formats
        console.log("✅ ThirdEmail: Processed images:", images.length);
        
        return images.map(img => buildPhoto(img, 'ThirdEmail'));
      } catch (err) {
        console.error('❌ Error fetching Third Email photos:', err);
        console.error('❌ Error details:', err.response?.data || err.message);
        return []; // Return empty array instead of mock data
      }
    },
  };

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoading(true);
        console.log("🔄 Fetching images - User:", user);
        console.log("🔄 Selected filter:", selectedFilter);
        
        // First try the email-specific approach
        let all = [];
        const permissions = [];
        
        // For now, let's always show all emails to debug
        permissions.push('FirstEmail', 'SecondEmail', 'ThirdEmail');
        
        console.log("🔄 Permissions:", permissions);

        for (const emailKey of permissions) {
          if (selectedFilter === 'All' || selectedFilter === emailKey) {
            console.log(`🔄 Fetching ${emailKey} images...`);
            const data = await fetchPhotos[emailKey]();
            console.log(`✅ ${emailKey} returned ${data.length} images`);
            all.push(...data);
          }
        }
        
        // If no images found, try the fallback approach (same as Images.jsx)
        if (all.length === 0) {
          console.log("🔄 No images from email endpoints, trying fallback...");
          try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get-photos`);
            if (response.status === 200) {
              const fallbackImages = (response.data.photos || []).map((p) => ({
                ...p,
                emailKey: p.uploadedBy === 'mhuzaifa8519@gmail.com' ? 'FirstEmail' :
                         p.uploadedBy === 'mhuzaifa86797@gmail.com' ? 'SecondEmail' :
                         p.uploadedBy === 'muhammadjig8@gmail.com' ? 'ThirdEmail' : 'FirstEmail',
                url: p.cloudinaryUrl || `${import.meta.env.VITE_BASE_URL}/photos/file/${p.fileId}`
              }));
              
              // Filter by selected filter
              if (selectedFilter === 'All') {
                all = fallbackImages;
              } else {
                all = fallbackImages.filter(img => img.emailKey === selectedFilter);
              }
              console.log(`✅ Fallback returned ${all.length} images`);
            }
          } catch (fallbackErr) {
            console.error("❌ Fallback also failed:", fallbackErr);
          }
        }
        
        console.log(`🎯 Total images loaded: ${all.length}`);
        setImages(all);
      } catch (err) {
        console.error("❌ Failed to fetch images:", err);
      } finally {
        setIsLoading(false);
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
      <div className="absolute z-10 top-2 left-1/2 transform -translate-x-1/2 flex gap-3 p-3 items-center bg-white/90 dark:bg-zinc-800/90 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Loading...
          </div>
        )}
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Images: {images.length}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-500">
          Filter: {selectedFilter} | User: {user?.email || 'No user'}
        </div>
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="border px-3 py-1.5 dark:bg-zinc-700 bg-white dark:text-white text-black text-center rounded text-sm font-medium"
        >
          {filters.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
        </button>
        <button
          onClick={() => {
            console.log("🔄 Manual refresh triggered");
            window.location.reload();
          }}
          className="px-4 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium transition-colors"
        >
          Refresh
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
