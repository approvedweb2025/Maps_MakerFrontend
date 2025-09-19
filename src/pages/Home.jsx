import React, { useEffect, useState, useRef, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, HeatmapLayer } from '@react-google-maps/api';
import axios from 'axios';
import { useUser } from '../Context/UserContext';
import { FaDirections, FaBell, FaTimes, FaArrowLeft, FaArrowRight, FaPlus, FaMinus, FaUndo } from 'react-icons/fa';
import { useMap } from '../Context/MapContext';

const containerStyle = { width: '100%', height: '100vh' };
const pakistanBounds = { north: 37.0, south: 23.5, west: 60.9, east: 77.0 };
const GEOTAG_PRECISION = 5; // Decimal places for rounding (approx. 1 meter precision)

// Dark map style
const darkMapStyle = [
  { "featureType": "all", "elementType": "geometry", "stylers": [{ "color": "#1e1e1e" }] },
  { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "color": "#000000" }, { "weight": 2 }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#3a3a3a" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#444444" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0e1626" }] }
];

// Marker icons
const markerIcons = {
  FirstEmail: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  SecondEmail: "http://maps.google.com/mapfiles/kml/pal3/icon21.png",
  ThirdEmail: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
};

// Address parsing helpers
const extractComponent = (components = [], type) => components.find(c => c.types.includes(type))?.long_name;
const parsePlaceDetails = (components = []) => {
  const district = extractComponent(components, 'administrative_area_level_2') || extractComponent(components, 'administrative_area_level_1') || '';
  const tehsil = extractComponent(components, 'administrative_area_level_3') || extractComponent(components, 'sublocality_level_1') || '';
  const place = extractComponent(components, 'locality') || extractComponent(components, 'sublocality') || extractComponent(components, 'neighborhood') || '';
  const country = extractComponent(components, 'country') || '';
  return { district, tehsil, place, country };
};

// Modal component for displaying images with carousel and zoom
const ImageModal = ({ images, placeDetails, loadingLocation, onClose, emailKey }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1); // Default zoom level (1x)
  const imageRef = useRef(null);

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 3)); // Max zoom: 3x
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 1)); // Min zoom: 1x
  };

  const handleZoomReset = () => {
    setZoomLevel(1); // Reset to 1x
  };

  // Handle mouse wheel for zooming
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Handle pinch-to-zoom
  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.pageX - touch2.pageX,
        touch1.pageY - touch2.pageY
      );
      if (!imageRef.current.lastTouchDistance) {
        imageRef.current.lastTouchDistance = distance;
      } else {
        const delta = distance - imageRef.current.lastTouchDistance;
        setZoomLevel((prev) => {
          const newZoom = prev + delta * 0.005;
          return Math.max(1, Math.min(newZoom, 3)); // Clamp between 1x and 3x
        });
        imageRef.current.lastTouchDistance = distance;
      }
    }
  };

  const handleTouchEnd = () => {
    imageRef.current.lastTouchDistance = null;
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setZoomLevel(1); // Reset zoom when changing images
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoomLevel(1); // Reset zoom when changing images
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-30">
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Images {emailKey === 'FirstEmail' ? 'in Time Frame' : 'at Location'}
          </h2>
          <button onClick={onClose} className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
            <FaTimes className="text-xl" />
          </button>
        </div>
        <div className="relative mb-4">
          {images.length > 1 ? (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 z-10"
              >
                <FaArrowLeft />
              </button>
              <div
                className="w-full h-96 overflow-hidden flex items-center justify-center"
                onWheel={handleWheel}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                ref={imageRef}
              >
                <img
                  src={images[currentIndex].url}
                  alt={images[currentIndex].name}
                  className="object-contain rounded-lg"
                  style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s' }}
                />
              </div>
              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 z-10"
              >
                <FaArrowRight />
              </button>
              <div className="flex justify-center mt-2">
                {images.map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setZoomLevel(1); // Reset zoom when switching images
                    }}
                    className={`w-3 h-3 mx-1 rounded-full cursor-pointer ${idx === currentIndex ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                  />
                ))}
              </div>
            </>
          ) : (
            <div
              className="w-full h-96 overflow-hidden flex items-center justify-center"
              onWheel={handleWheel}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              ref={imageRef}
            >
              <img
                src={images[0].url}
                alt={images[0].name}
                className="object-contain rounded-lg"
                style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s' }}
              />
            </div>
          )}
          <div className="flex justify-center gap-2 mt-2">
            <button
              onClick={handleZoomIn}
              className="bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
              aria-label="Zoom In"
            >
              <FaPlus />
            </button>
            <button
              onClick={handleZoomOut}
              className="bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
              aria-label="Zoom Out"
            >
              <FaMinus />
            </button>
            <button
              onClick={handleZoomReset}
              className="bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
              aria-label="Reset Zoom"
            >
              <FaUndo />
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
            <span className="font-semibold text-gray-900 dark:text-white">Uploaded by:</span> {images[currentIndex].uploadedBy}
            <br />
            <span className="font-semibold text-gray-900 dark:text-white">Taken at:</span> {new Date(images[currentIndex].timestamp).toLocaleString()}
          </p>
        </div>
        <div className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
          <p className="flex gap-2 items-center">
            <span className="font-semibold text-gray-900 dark:text-white">GPS:</span>
            {images[0].latitude.toFixed(6)}, {images[0].longitude.toFixed(6)}
          </p>
          {loadingLocation ? (
            <p className="text-sm">Loading location...</p>
          ) : (
            <>
              <p><span className="font-semibold text-gray-900 dark:text-white">District Name:</span> {placeDetails.district || '—'}</p>
              <p><span className="font-semibold text-gray-900 dark:text-white">Village Name:</span> {placeDetails.place || '—'}</p>
              <p><span className="font-semibold text-gray-900 dark:text-white">Tehsil Name:</span> {placeDetails.tehsil || '—'}</p>
              <p><span className="font-semibold text-gray-900 dark:text-white">Country:</span> {placeDetails.country || '—'}</p>
            </>
          )}
        </div>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${images[0].latitude},${images[0].longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
        >
          Get Directions <FaDirections />
        </a>
      </div>
    </div>
  );
};

// Navbar component
const Navbar = ({ filters, selectedFilter, setSelectedFilter, showHeatmap, setShowHeatmap, uniqueCounts }) => {
  const [notifications, setNotifications] = useState(0);

  const handleNotificationClick = () => {
    console.log('Notifications clicked. Implement notification panel or logic here.');
  };

  const legendItems = [
    { emailKey: 'FirstEmail', icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png', label: `Peenay Ka Pani (${uniqueCounts.FirstEmail || 0} time frames)`, isIcon: true },
    { emailKey: 'SecondEmail', icon: 'http://maps.google.com/mapfiles/kml/pal3/icon21.png', label: `Homes in Sindh (${uniqueCounts.SecondEmail || 0} unique locations)`, isIcon: true },
    { emailKey: 'ThirdEmail', icon: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png', label: `Third Email (${uniqueCounts.ThirdEmail || 0} unique locations)`, isIcon: true },
  ];

  return (
    <nav className="fixed top-0 left-40 right-0 z-20 bg-white dark:bg-zinc-800 shadow-md p-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h3 className="font-semibold text-black dark:text-white text-sm">Legend</h3>
        <ul className="flex gap-3">
          {legendItems
            .filter(item => filters.includes(item.emailKey) || filters.includes('All'))
            .map(item => (
              <li key={item.emailKey} className="flex items-center gap-2">
                {item.isIcon ? (
                  <img
                    src={item.icon}
                    alt={`${item.label} icon`}
                    className="w-4 h-4 object-contain"
                  />
                ) : (
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                )}
                <span className="text-black dark:text-white text-sm">{item.label}</span>
              </li>
            ))}
        </ul>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={handleNotificationClick}
          className="relative text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Notifications"
        >
          <FaBell className="text-lg" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="border px-3 py-1 dark:bg-zinc-800 bg-white dark:text-white text-black text-center rounded text-sm"
        >
          {filters.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
        </button>
      </div>
    </nav>
  );
};

const Home = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [images, setImages] = useState([]);
  const [selectedGeotagImages, setSelectedGeotagImages] = useState([]);
  const [placeDetails, setPlaceDetails] = useState({ district: '', place: '', tehsil: '', country: '' });
  const [mapReady, setMapReady] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [uniqueCounts, setUniqueCounts] = useState({ FirstEmail: 0, SecondEmail: 0, ThirdEmail: 0 });
  const [clusters, setClusters] = useState([]);
  const { user } = useUser();
  const { mapCenter, mapZoom } = useMap();
  const geocodeCache = useRef(new Map());

  // Function to get rounded geotag key for location-based clustering
  const getRoundedKey = (lat, lng) => {
    const factor = 10 ** GEOTAG_PRECISION;
    const roundedLat = Math.round(lat * factor) / factor;
    const roundedLng = Math.round(lng * factor) / factor;
    return `${roundedLat},${roundedLng}`;
  };

  // Dark mode sync
  useEffect(() => {
    const observer = new MutationObserver(() => setIsDarkMode(document.documentElement.classList.contains('dark')));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    return () => observer.disconnect();
  }, []);

  // Fetch images
  const fetchPhotos = {
    FirstEmail: async () => {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get1stEmailPhotos`);
      return res.data.map(img => ({ ...img, emailKey: 'FirstEmail', url: `${import.meta.env.VITE_BASE_URL}/Uploads/${img.fileId}.jpg` }));
    },
    SecondEmail: async () => {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get2ndEmailPhotos`);
      return res.data.map(img => ({ ...img, emailKey: 'SecondEmail', url: `${import.meta.env.VITE_BASE_URL}/Uploads/${img.fileId}.jpg` }));
    },
    ThirdEmail: async () => {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get3rdEmailPhotos`);
      return res.data.map(img => ({ ...img, emailKey: 'ThirdEmail', url: `${import.meta.env.VITE_BASE_URL}/Uploads/${img.fileId}.jpg` }));
    },
  };

  useEffect(() => {
    const fetchImages = async () => {
      let all = [];
      const permissions = [];
      if (user?.role === 'admin') permissions.push('FirstEmail', 'SecondEmail', 'ThirdEmail');
      else {
        if (user?.permissions?.includes('FirstEmail')) permissions.push('FirstEmail');
        if (user?.permissions?.includes('SecondEmail')) permissions.push('SecondEmail');
        if (user?.permissions?.includes('ThirdEmail')) permissions.push('ThirdEmail');
      }
      for (const emailKey of permissions) {
        if (selectedFilter === 'All' || selectedFilter === emailKey) {
          const data = await fetchPhotos[emailKey]();
          all.push(...data);
        }
      }
      setImages(all);
    };
    fetchImages();
  }, [user, selectedFilter]);

  // Compute clusters and unique counts when images change
  useEffect(() => {
    const clusterMap = {};
    const counts = { FirstEmail: new Set(), SecondEmail: new Set(), ThirdEmail: new Set() };

    const getTimeBucket = (timestamp) => {
      const date = new Date(timestamp);
      const minutes = date.getTime() / (1000 * 60);
      return Math.floor(minutes / 20) * 20; // Group into 20-minute intervals
    };

    images.forEach(img => {
      if (!img.timestamp) {
        console.warn(`Image with fileId ${img.fileId} has no timestamp and will be skipped.`);
        return;
      }
      let clusterKey;
      if (img.emailKey === 'FirstEmail') {
        const timeBucket = getTimeBucket(img.timestamp);
        clusterKey = `${img.emailKey}_${timeBucket}`;
        counts[img.emailKey].add(timeBucket);
      } else {
        const roundedKey = getRoundedKey(img.latitude, img.longitude);
        clusterKey = `${img.emailKey}_${roundedKey}`;
        counts[img.emailKey].add(roundedKey);
      }
      
      if (!clusterMap[clusterKey]) {
        clusterMap[clusterKey] = [];
      }
      clusterMap[clusterKey].push(img);
    });

    const clusterList = Object.values(clusterMap).map(group => {
      const sortedImages = group.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      return {
        rep: sortedImages[0],
        images: sortedImages.slice(0, 3) // Limit to 3 images per cluster
      };
    });

    setClusters(clusterList);
    setUniqueCounts({
      FirstEmail: counts.FirstEmail.size,
      SecondEmail: counts.SecondEmail.size,
      ThirdEmail: counts.ThirdEmail.size,
    });
  }, [images]);

  const fetchPlaceDetails = useCallback(async (latitude, longitude) => {
    const cacheKey = `${latitude},${longitude}`;
    if (geocodeCache.current.has(cacheKey)) return geocodeCache.current.get(cacheKey);
    try {
      setLoadingLocation(true);
      const res = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', { params: { latlng: `${latitude},${longitude}`, key: import.meta.env.VITE_GEOCODING_API_KEY } });
      if (res.data.status === 'OK' && res.data.results.length > 0) {
        const parsed = parsePlaceDetails(res.data.results[0].address_components || []);
        geocodeCache.current.set(cacheKey, parsed);
        return parsed;
      }
      return { district: '', place: 'Unknown Location', tehsil: '', country: '' };
    } catch {
      return { district: '', place: 'Error fetching location', tehsil: '', country: '' };
    } finally {
      setLoadingLocation(false);
    }
  }, []);

  useEffect(() => {
    if (selectedGeotagImages.length === 0) {
      setPlaceDetails({ district: '', place: '', tehsil: '', country: '' });
      return;
    }
    const doFetch = async () => {
      const details = await fetchPlaceDetails(selectedGeotagImages[0].latitude, selectedGeotagImages[0].longitude);
      setPlaceDetails(details);
    };
    doFetch();
  }, [selectedGeotagImages, fetchPlaceDetails]);

  const closeModal = () => {
    setSelectedGeotagImages([]);
    setPlaceDetails({ district: '', place: '', tehsil: '', country: '' });
  };

  const filters = ['All'];
  if (user?.role === 'admin' || user?.permissions?.includes('FirstEmail')) filters.push('FirstEmail');
  if (user?.role === 'admin' || user?.permissions?.includes('SecondEmail')) filters.push('SecondEmail');
  if (user?.role === 'admin' || user?.permissions?.includes('ThirdEmail')) filters.push('ThirdEmail');

  const heatmapData = images.map(img => new window.google.maps.LatLng(img.latitude, img.longitude));

  return (
    <div className="h-screen w-full relative">
      <Navbar
        filters={filters}
        selectedFilter={selectedFilter}
        setSelectedFilter={setSelectedFilter}
        showHeatmap={showHeatmap}
        setShowHeatmap={setShowHeatmap}
        uniqueCounts={uniqueCounts}
      />
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={['visualization']}>
        <GoogleMap
          key={`${mapCenter.lat}-${mapCenter.lng}-${mapZoom}`}
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={mapZoom}
          onLoad={() => setMapReady(true)}
          options={{ styles: isDarkMode ? darkMapStyle : undefined, disableDefaultUI: false, restriction: { latLngBounds: pakistanBounds, strictBounds: true }, gestureHandling: 'greedy' }}
        >
          {mapReady && clusters.map(({ rep, images: clusterImages }, index) => (
            <Marker
              key={index}
              position={{ lat: rep.latitude, lng: rep.longitude }}
              onClick={() => setSelectedGeotagImages(clusterImages)}
              icon={markerIcons[rep.emailKey] || markerIcons.FirstEmail}
            />
          ))}
          {mapReady && showHeatmap && heatmapData.length > 0 && (
            <HeatmapLayer data={heatmapData} options={{ radius: 50 }} />
          )}
        </GoogleMap>
      </LoadScript>
      {selectedGeotagImages.length > 0 && (
        <ImageModal
          images={selectedGeotagImages}
          placeDetails={placeDetails}
          loadingLocation={loadingLocation}
          onClose={closeModal}
          emailKey={selectedGeotagImages[0].emailKey}
        />
      )}
    </div>
  );
};

export default Home;