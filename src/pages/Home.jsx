// import React, { useEffect, useState, useRef, useCallback } from 'react';
// import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
// import axios from 'axios';
// import { darkMapStyle } from '../../utils/mapStyles';
// import { useUser } from '../Context/UserContext';
// import { FaDirections } from 'react-icons/fa';
// import { useMap } from '../Context/MapContext';

// const containerStyle = {
//   width: '100%',
//   height: '100vh',
// };

// const pakistanBounds = {
//   north: 37.0,
//   south: 23.5,
//   west: 60.9,
//   east: 77.0,
// };

// const getBase64Image = async (url) => {
//   const res = await fetch(url);
//   const blob = await res.blob();
//   return new Promise((resolve) => {
//     const reader = new FileReader();
//     reader.onloadend = () => resolve(reader.result);
//     reader.readAsDataURL(blob);
//   });
// };

// const getColorByEmail = (email) => {
//   switch (email) {
//     case 'mhuzaifa8519@gmail.com':
//       return '#3B82F6';
//     case 'mhuzaifa86797@gmail.com':
//       return '#10B981';
//     case 'muhammadjig8@gmail.com':
//       return '#F97316';
//     default:
//       return '#EF4444';
//   }
// };

// const getCustomMarkerIcon = (base64Img, strokeColor) => {
//   if (!window.google?.maps?.Size || !window.google?.maps?.Point) return null;

//   const pin = `
//     <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44">
//       <circle cx="22" cy="22" r="20" fill="#ffffff" stroke="${strokeColor}" stroke-width="4"/>
//       <clipPath id="circleView"><circle cx="22" cy="22" r="18" /></clipPath>
//       <image href="${base64Img}" x="4" y="4" width="36" height="36" clip-path="url(#circleView)" preserveAspectRatio="xMidYMid slice"/>
//     </svg>
//   `;

//   return {
//     url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(pin),
//     scaledSize: new window.google.maps.Size(44, 44),
//     anchor: new window.google.maps.Point(22, 22),
//   };
// };

// const extractComponent = (components = [], type) => {
//   const comp = components.find((c) => c.types.includes(type));
//   return comp?.long_name;
// };

// const parsePlaceDetails = (components = []) => {
//   // District in Pakistan often comes as administrative_area_level_2
//   const district =
//     extractComponent(components, 'administrative_area_level_2') ||
//     extractComponent(components, 'administrative_area_level_1') ||
//     '';
//   // Tehsil sometimes in administrative_area_level_3 or sublocality
//   const tehsil =
//     extractComponent(components, 'administrative_area_level_3') ||
//     extractComponent(components, 'sublocality_level_1') ||
//     '';
//   const place =
//     extractComponent(components, 'locality') ||
//     extractComponent(components, 'sublocality') ||
//     extractComponent(components, 'neighborhood') ||
//     '';
//   const country = extractComponent(components, 'country') || '';
//   return { district, tehsil, place, country };
// };

// const Home = () => {
//   const [isDarkMode, setIsDarkMode] = useState(false);
//   const [images, setImages] = useState([]);
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [placeDetails, setPlaceDetails] = useState({
//     district: '',
//     place: '',
//     tehsil: '',
//     country: '',
//   });
//   const [mapReady, setMapReady] = useState(false);
//   const [selectedFilter, setSelectedFilter] = useState('All');
//   const [loadingLocation, setLoadingLocation] = useState(false);
//   const { user } = useUser();
//   const { mapCenter, mapZoom } = useMap();
//   const geocodeCache = useRef(new Map());

//   useEffect(() => {
//     const observer = new MutationObserver(() => {
//       setIsDarkMode(document.documentElement.classList.contains('dark'));
//     });
//     observer.observe(document.documentElement, {
//       attributes: true,
//       attributeFilter: ['class'],
//     });
//     setIsDarkMode(document.documentElement.classList.contains('dark'));
//     return () => observer.disconnect();
//   }, []);

//   const fetchPhotos = {
//     FirstEmail: async () => {
//       const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get1stEmailPhotos`);
//       return await Promise.all(
//         res.data.map(async (img) => {
//           const base64Image = await getBase64Image(`${import.meta.env.VITE_BASE_URL}/uploads/${img.fileId}.jpg`);
//           return { ...img, base64Image };
//         })
//       );
//     },
//     SecondEmail: async () => {
//       const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get2ndEmailPhotos`);
//       return await Promise.all(
//         res.data.map(async (img) => {
//           const base64Image = await getBase64Image(`${import.meta.env.VITE_BASE_URL}/uploads/${img.fileId}.jpg`);
//           return { ...img, base64Image };
//         })
//       );
//     },
//     ThirdEmail: async () => {
//       const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get3rdEmailPhotos`);
//       return await Promise.all(
//         res.data.map(async (img) => {
//           const base64Image = await getBase64Image(`${import.meta.env.VITE_BASE_URL}/uploads/${img.fileId}.jpg`);
//           return { ...img, base64Image };
//         })
//       );
//     },
//   };

//   useEffect(() => {
//     const fetchImages = async () => {
//       let all = [];
//       const permissions = [];

//       if (user?.role === 'admin') {
//         permissions.push('FirstEmail', 'SecondEmail', 'ThirdEmail');
//       } else {
//         if (user?.permissions?.includes('FirstEmail')) permissions.push('FirstEmail');
//         if (user?.permissions?.includes('SecondEmail')) permissions.push('SecondEmail');
//         if (user?.permissions?.includes('ThirdEmail')) permissions.push('ThirdEmail');
//       }

//       for (const emailKey of permissions) {
//         if (selectedFilter === 'All' || selectedFilter === emailKey) {
//           const data = await fetchPhotos[emailKey]();
//           all.push(...data);
//         }
//       }

//       setImages(all);
//     };

//     fetchImages();
//   }, [user, selectedFilter]);

//   const fetchPlaceDetails = useCallback(
//     async (latitude, longitude) => {
//       const cacheKey = `${latitude},${longitude}`;
//       if (geocodeCache.current.has(cacheKey)) {
//         return geocodeCache.current.get(cacheKey);
//       }

//       try {
//         setLoadingLocation(true);
//         const res = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
//           params: {
//             latlng: `${latitude},${longitude}`,
//             key: import.meta.env.VITE_GEOCODING_API_KEY,
//           },
//         });

//         if (res.data.status === 'OK' && res.data.results?.length > 0) {
//           const components = res.data.results[0].address_components || [];
//           const parsed = parsePlaceDetails(components);
//           geocodeCache.current.set(cacheKey, parsed);
//           return parsed;
//         }
//         return {
//           district: '',
//           place: 'Unknown Location',
//           tehsil: '',
//           country: '',
//         };
//       } catch (e) {
//         return {
//           district: '',
//           place: 'Error fetching location',
//           tehsil: '',
//           country: '',
//         };
//       } finally {
//         setLoadingLocation(false);
//       }
//     },
//     []
//   );

//   useEffect(() => {
//     if (!selectedImage) {
//       setPlaceDetails({
//         district: '',
//         place: '',
//         tehsil: '',
//         country: '',
//       });
//       return;
//     }

//     const doFetch = async () => {
//       const { latitude, longitude } = selectedImage;
//       const details = await fetchPlaceDetails(latitude, longitude);
//       setPlaceDetails(details);
//     };

//     doFetch();
//   }, [selectedImage, fetchPlaceDetails]);

//   const filters = ['All'];
//   if (user?.role === 'admin' || user?.permissions?.includes('FirstEmail')) filters.push('FirstEmail');
//   if (user?.role === 'admin' || user?.permissions?.includes('SecondEmail')) filters.push('SecondEmail');
//   if (user?.role === 'admin' || user?.permissions?.includes('ThirdEmail')) filters.push('ThirdEmail');

//   return (
//     <div className="h-screen w-full relative">
//       <div className="absolute z-10 lg:top-2 top-[80%] left-44 lg:left-1/2  w-60 transform -translate-x-1/2 bg-transparent p-2 rounded shadow-md">
//         <select
//           value={selectedFilter}
//           onChange={(e) => setSelectedFilter(e.target.value)}
//           className="border px-3 py-1 w-full dark:bg-zinc-800 bg-white dark:text-white text-black text-center rounded text-sm"
//         >
//           {filters.map((f) => (
//             <option key={f} value={f}>
//               {f}
//             </option>
//           ))}
//         </select>
//       </div>

//       <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
//         <GoogleMap
//           key={`${mapCenter.lat}-${mapCenter.lng}-${mapZoom}`}
//           mapContainerStyle={containerStyle}
//           center={mapCenter}
//           zoom={mapZoom}
//           onLoad={() => setMapReady(true)}
//           options={{
//             styles: isDarkMode ? darkMapStyle : undefined,
//             disableDefaultUI: false,
//             scrollwheel: true,
//             gestureHandling: 'greedy',
//             restriction: { latLngBounds: pakistanBounds, strictBounds: true },
//           }}
//         >
//           {mapReady &&
//             images.map((img, index) => {
//               const color = getColorByEmail(img.uploadedBy);
//               const icon = getCustomMarkerIcon(img.base64Image, color);
//               if (!icon) return null;
//               return (
//                 <Marker
//                   key={index}
//                   position={{ lat: img.latitude, lng: img.longitude }}
//                   icon={icon}
//                   onClick={() => setSelectedImage(img)}
//                 />
//               );
//             })}

//           {selectedImage && (
//             <InfoWindow
//               position={{
//                 lat: selectedImage.latitude,
//                 lng: selectedImage.longitude,
//               }}
//               onCloseClick={() => {
//                 setSelectedImage(null);
//                 setPlaceDetails({
//                   district: '',
//                   place: '',
//                   tehsil: '',
//                   country: '',
//                 });
//               }}
//             >
//               <div className="w-fit max-w-sm p-2 rounded-md bg-white shadow-lg">
//                 <img
//                   src={`${import.meta.env.VITE_BASE_URL}/uploads/${selectedImage.fileId}.jpg`}
//                   alt={selectedImage.name}
//                   className="w-full h-40 object-cover rounded"
//                 />
//                 <div className="mt-2 text-sm space-y-1">
//                   <p className="text-gray-400 flex gap-2 items-center">
//                     <span className="font-semibold text-black flex">GPS:</span>{' '}
//                     <span className="flex items-center justify-center gap-3">
//                       {selectedImage.latitude}, {selectedImage.longitude}
//                     </span>
//                   </p>

//                   <div className="text-gray-400">
//                     {loadingLocation ? (
//                       <p className="text-sm">Loading location...</p>
//                     ) : (
//                       <>
//                         <p>
//                           <span className="font-semibold text-black">District Name:</span>{' '}
//                           {placeDetails.district || '—'}
//                         </p>
//                         <p>
//                           <span className="font-semibold text-black">Village Name:</span>{' '}
//                           {placeDetails.place || '—'}
//                         </p>
//                         <p>
//                           <span className="font-semibold text-black">Tehsil Name:</span>{' '}
//                           {placeDetails.tehsil || '—'}
//                         </p>
//                         <p>
//                           <span className="font-semibold text-black">Country:</span>{' '}
//                           {placeDetails.country || '—'}
//                         </p>

//                         <p>
//                           Uploaded: {new Date(selectedImage.timestamp).toLocaleDateString()}
//                         </p>
//                       </>
//                     )}
//                   </div>

//                   <p className="text-xs text-gray-400">
//                     <span className="uppercase font-semibold text-black">Uploaded by:</span>{' '}
//                     {selectedImage.uploadedBy}
//                   </p>

//                   <a
//                     href={`https://www.google.com/maps/dir/?api=1&destination=${selectedImage.latitude},${selectedImage.longitude}`}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="mt-2 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded"
//                   >
//                     Get Directions
//                     <FaDirections />
//                   </a>
//                 </div>
//               </div>
//             </InfoWindow>
//           )}
//         </GoogleMap>
//       </LoadScript>
//     </div>
//   );
// };

// export default Home;


// import React, { useEffect, useState, useRef, useCallback } from 'react';
// import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
// import axios from 'axios';
// import { darkMapStyle } from '../../utils/mapStyles';
// import { useUser } from '../Context/UserContext';
// import { FaDirections } from 'react-icons/fa';
// import { useMap } from '../Context/MapContext';

// const containerStyle = {
//   width: '100%',
//   height: '100vh',
// };

// const pakistanBounds = {
//   north: 37.0,
//   south: 23.5,
//   west: 60.9,
//   east: 77.0,
// };

// // address parsing helpers
// const extractComponent = (components = [], type) => {
//   const comp = components.find((c) => c.types.includes(type));
//   return comp?.long_name;
// };

// const parsePlaceDetails = (components = []) => {
//   const district =
//     extractComponent(components, 'administrative_area_level_2') ||
//     extractComponent(components, 'administrative_area_level_1') ||
//     '';
//   const tehsil =
//     extractComponent(components, 'administrative_area_level_3') ||
//     extractComponent(components, 'sublocality_level_1') ||
//     '';
//   const place =
//     extractComponent(components, 'locality') ||
//     extractComponent(components, 'sublocality') ||
//     extractComponent(components, 'neighborhood') ||
//     '';
//   const country = extractComponent(components, 'country') || '';
//   return { district, tehsil, place, country };
// };

// // marker colors
// const markerIcons = {
//   FirstEmail: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",   // 🔵
//   SecondEmail: "http://maps.google.com/mapfiles/ms/icons/green-dot.png", // 🟢
//   ThirdEmail: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png", // 🟠
// };

// const Home = () => {
//   const [isDarkMode, setIsDarkMode] = useState(false);
//   const [images, setImages] = useState([]);
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [placeDetails, setPlaceDetails] = useState({
//     district: '',
//     place: '',
//     tehsil: '',
//     country: '',
//   });
//   const [mapReady, setMapReady] = useState(false);
//   const [selectedFilter, setSelectedFilter] = useState('All');
//   const [loadingLocation, setLoadingLocation] = useState(false);
//   const { user } = useUser();
//   const { mapCenter, mapZoom } = useMap();
//   const geocodeCache = useRef(new Map());

//   // dark mode sync
//   useEffect(() => {
//     const observer = new MutationObserver(() => {
//       setIsDarkMode(document.documentElement.classList.contains('dark'));
//     });
//     observer.observe(document.documentElement, {
//       attributes: true,
//       attributeFilter: ['class'],
//     });
//     setIsDarkMode(document.documentElement.classList.contains('dark'));
//     return () => observer.disconnect();
//   }, []);

//   // API calls for images
//   const fetchPhotos = {
//     FirstEmail: async () => {
//       const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get1stEmailPhotos`);
//       return res.data.map((img) => ({
//         ...img,
//         emailKey: 'FirstEmail',
//         url: `${import.meta.env.VITE_BASE_URL}/uploads/${img.fileId}.jpg`,
//       }));
//     },
//     SecondEmail: async () => {
//       const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get2ndEmailPhotos`);
//       return res.data.map((img) => ({
//         ...img,
//         emailKey: 'SecondEmail',
//         url: `${import.meta.env.VITE_BASE_URL}/uploads/${img.fileId}.jpg`,
//       }));
//     },
//     ThirdEmail: async () => {
//       const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get3rdEmailPhotos`);
//       return res.data.map((img) => ({
//         ...img,
//         emailKey: 'ThirdEmail',
//         url: `${import.meta.env.VITE_BASE_URL}/uploads/${img.fileId}.jpg`,
//       }));
//     },
//   };

//   // fetch based on user permissions
//   useEffect(() => {
//     const fetchImages = async () => {
//       let all = [];
//       const permissions = [];

//       if (user?.role === 'admin') {
//         permissions.push('FirstEmail', 'SecondEmail', 'ThirdEmail');
//       } else {
//         if (user?.permissions?.includes('FirstEmail')) permissions.push('FirstEmail');
//         if (user?.permissions?.includes('SecondEmail')) permissions.push('SecondEmail');
//         if (user?.permissions?.includes('ThirdEmail')) permissions.push('ThirdEmail');
//       }

//       for (const emailKey of permissions) {
//         if (selectedFilter === 'All' || selectedFilter === emailKey) {
//           const data = await fetchPhotos[emailKey]();
//           all.push(...data);
//         }
//       }

//       setImages(all);
//     };

//     fetchImages();
//   }, [user, selectedFilter]);

//   // fetch location details
//   const fetchPlaceDetails = useCallback(
//     async (latitude, longitude) => {
//       const cacheKey = `${latitude},${longitude}`;
//       if (geocodeCache.current.has(cacheKey)) {
//         return geocodeCache.current.get(cacheKey);
//       }

//       try {
//         setLoadingLocation(true);
//         const res = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
//           params: {
//             latlng: `${latitude},${longitude}`,
//             key: import.meta.env.VITE_GEOCODING_API_KEY,
//           },
//         });

//         if (res.data.status === 'OK' && res.data.results?.length > 0) {
//           const components = res.data.results[0].address_components || [];
//           const parsed = parsePlaceDetails(components);
//           geocodeCache.current.set(cacheKey, parsed);
//           return parsed;
//         }
//         return { district: '', place: 'Unknown Location', tehsil: '', country: '' };
//       } catch (e) {
//         return { district: '', place: 'Error fetching location', tehsil: '', country: '' };
//       } finally {
//         setLoadingLocation(false);
//       }
//     },
//     []
//   );

//   // update details when marker selected
//   useEffect(() => {
//     if (!selectedImage) {
//       setPlaceDetails({ district: '', place: '', tehsil: '', country: '' });
//       return;
//     }

//     const doFetch = async () => {
//       const { latitude, longitude } = selectedImage;
//       const details = await fetchPlaceDetails(latitude, longitude);
//       setPlaceDetails(details);
//     };

//     doFetch();
//   }, [selectedImage, fetchPlaceDetails]);

//   // filter dropdown
//   const filters = ['All'];
//   if (user?.role === 'admin' || user?.permissions?.includes('FirstEmail')) filters.push('FirstEmail');
//   if (user?.role === 'admin' || user?.permissions?.includes('SecondEmail')) filters.push('SecondEmail');
//   if (user?.role === 'admin' || user?.permissions?.includes('ThirdEmail')) filters.push('ThirdEmail');

//   return (
//     <div className="h-screen w-full relative">
//       {/* filter dropdown */}
//       <div className="absolute z-10 lg:top-2 top-[80%] left-44 lg:left-1/2 w-60 transform -translate-x-1/2 bg-transparent p-2 rounded shadow-md">
//         <select
//           value={selectedFilter}
//           onChange={(e) => setSelectedFilter(e.target.value)}
//           className="border px-3 py-1 w-full dark:bg-zinc-800 bg-white dark:text-white text-black text-center rounded text-sm"
//         >
//           {filters.map((f) => (
//             <option key={f} value={f}>
//               {f}
//             </option>
//           ))}
//         </select>
//       </div>

//       <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
//         <GoogleMap
//           key={`${mapCenter.lat}-${mapCenter.lng}-${mapZoom}`}
//           mapContainerStyle={containerStyle}
//           center={mapCenter}
//           zoom={mapZoom}
//           onLoad={() => setMapReady(true)}
//           options={{
//             styles: isDarkMode ? darkMapStyle : undefined,
//             disableDefaultUI: false,
//             restriction: { latLngBounds: pakistanBounds, strictBounds: true },
//           }}
//         >
//           {/* markers with colored pins */}
//           {mapReady &&
//             images.map((img, index) => (
//               <Marker
//                 key={index}
//                 position={{ lat: img.latitude, lng: img.longitude }}
//                 onClick={() => setSelectedImage(img)}
//                 icon={markerIcons[img.emailKey] || markerIcons.FirstEmail}
//               />
//             ))}

//           {/* info window */}
//           {selectedImage && (
//             <InfoWindow
//               position={{ lat: selectedImage.latitude, lng: selectedImage.longitude }}
//               onCloseClick={() => {
//                 setSelectedImage(null);
//                 setPlaceDetails({ district: '', place: '', tehsil: '', country: '' });
//               }}
//             >
//               <div className="w-fit max-w-sm p-2 rounded-md bg-white shadow-lg">
//                 <img
//                   src={selectedImage.url}
//                   alt={selectedImage.name}
//                   className="w-full h-40 object-scale-down rounded"
//                 />
//                 <div className="mt-2 text-sm space-y-1">
//                   <p className="text-gray-400 flex gap-2 items-center">
//                     <span className="font-semibold text-black flex">GPS:</span>{' '}
//                     <span className="flex items-center justify-center gap-3">
//                       {selectedImage.latitude}, {selectedImage.longitude}
//                     </span>
//                   </p>

//                   <div className="text-gray-400">
//                     {loadingLocation ? (
//                       <p className="text-sm">Loading location...</p>
//                     ) : (
//                       <>
//                         <p><span className="font-semibold text-black">District Name:</span> {placeDetails.district || '—'}</p>
//                         <p><span className="font-semibold text-black">Village Name:</span> {placeDetails.place || '—'}</p>
//                         <p><span className="font-semibold text-black">Tehsil Name:</span> {placeDetails.tehsil || '—'}</p>
//                         <p><span className="font-semibold text-black">Country:</span> {placeDetails.country || '—'}</p>
//                       </>
//                     )}
//                   </div>

//                   <p className="text-xs text-gray-400">
//                     <span className="uppercase font-semibold text-black">Uploaded by:</span> {selectedImage.uploadedBy}
//                   </p>

//                   <a
//                     href={`https://www.google.com/maps/dir/?api=1&destination=${selectedImage.latitude},${selectedImage.longitude}`}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="mt-2 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded"
//                   >
//                     Get Directions
//                     <FaDirections />
//                   </a>
//                 </div>
//               </div>
//             </InfoWindow>
//           )}
//         </GoogleMap>
//       </LoadScript>
//     </div>
//   );
// };

// export default Home;


// import React, { useEffect, useState, useRef, useCallback } from 'react';
// import { GoogleMap, LoadScript, Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';
// import axios from 'axios';
// import { useUser } from '../Context/UserContext';
// import { FaDirections } from 'react-icons/fa';
// import { useMap } from '../Context/MapContext';

// const containerStyle = { width: '100%', height: '100vh' };
// const pakistanBounds = { north: 37.0, south: 23.5, west: 60.9, east: 77.0 };

// // Dark map style
// const darkMapStyle = [
//   { "featureType": "all", "elementType": "geometry", "stylers": [{ "color": "#1e1e1e" }] },
//   { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#ffffff" }] },
//   { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "color": "#000000" }, { "weight": 2 }] },
//   { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#2c2c2c" }] },
//   { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#3a3a3a" }] },
//   { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#ffffff" }] },
//   { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#444444" }] },
//   { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#2c2c2c" }] },
//   { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0e1626" }] }
// ];

// // Marker icons
// const markerIcons = {
//   FirstEmail: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
//   SecondEmail: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
//   ThirdEmail: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
// };

// // Address parsing helpers
// const extractComponent = (components = [], type) => components.find(c => c.types.includes(type))?.long_name;
// const parsePlaceDetails = (components = []) => {
//   const district = extractComponent(components, 'administrative_area_level_2') || extractComponent(components, 'administrative_area_level_1') || '';
//   const tehsil = extractComponent(components, 'administrative_area_level_3') || extractComponent(components, 'sublocality_level_1') || '';
//   const place = extractComponent(components, 'locality') || extractComponent(components, 'sublocality') || extractComponent(components, 'neighborhood') || '';
//   const country = extractComponent(components, 'country') || '';
//   return { district, tehsil, place, country };
// };

// const Home = () => {
//   const [isDarkMode, setIsDarkMode] = useState(false);
//   const [images, setImages] = useState([]);
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [placeDetails, setPlaceDetails] = useState({ district: '', place: '', tehsil: '', country: '' });
//   const [mapReady, setMapReady] = useState(false);
//   const [selectedFilter, setSelectedFilter] = useState('All');
//   const [loadingLocation, setLoadingLocation] = useState(false);
//   const [showHeatmap, setShowHeatmap] = useState(false);
//   const { user } = useUser();
//   const { mapCenter, mapZoom } = useMap();
//   const geocodeCache = useRef(new Map());

//   // Dark mode sync
//   useEffect(() => {
//     const observer = new MutationObserver(() => setIsDarkMode(document.documentElement.classList.contains('dark')));
//     observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
//     setIsDarkMode(document.documentElement.classList.contains('dark'));
//     return () => observer.disconnect();
//   }, []);

//   // Fetch images
//   const fetchPhotos = {
//     FirstEmail: async () => {
//       const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get1stEmailPhotos`);
//       return res.data.map(img => ({ ...img, emailKey: 'FirstEmail', url: `${import.meta.env.VITE_BASE_URL}/uploads/${img.fileId}.jpg` }));
//     },
//     SecondEmail: async () => {
//       const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get2ndEmailPhotos`);
//       return res.data.map(img => ({ ...img, emailKey: 'SecondEmail', url: `${import.meta.env.VITE_BASE_URL}/uploads/${img.fileId}.jpg` }));
//     },
//     ThirdEmail: async () => {
//       const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get3rdEmailPhotos`);
//       return res.data.map(img => ({ ...img, emailKey: 'ThirdEmail', url: `${import.meta.env.VITE_BASE_URL}/uploads/${img.fileId}.jpg` }));
//     },
//   };

//   useEffect(() => {
//     const fetchImages = async () => {
//       let all = [];
//       const permissions = [];
//       if (user?.role === 'admin') permissions.push('FirstEmail', 'SecondEmail', 'ThirdEmail');
//       else {
//         if (user?.permissions?.includes('FirstEmail')) permissions.push('FirstEmail');
//         if (user?.permissions?.includes('SecondEmail')) permissions.push('SecondEmail');
//         if (user?.permissions?.includes('ThirdEmail')) permissions.push('ThirdEmail');
//       }
//       for (const emailKey of permissions) {
//         if (selectedFilter === 'All' || selectedFilter === emailKey) {
//           const data = await fetchPhotos[emailKey]();
//           all.push(...data);
//         }
//       }
//       setImages(all);
//     };
//     fetchImages();
//   }, [user, selectedFilter]);

//   const fetchPlaceDetails = useCallback(async (latitude, longitude) => {
//     const cacheKey = `${latitude},${longitude}`;
//     if (geocodeCache.current.has(cacheKey)) return geocodeCache.current.get(cacheKey);
//     try {
//       setLoadingLocation(true);
//       const res = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', { params: { latlng: `${latitude},${longitude}`, key: import.meta.env.VITE_GEOCODING_API_KEY } });
//       if (res.data.status === 'OK' && res.data.results.length > 0) {
//         const parsed = parsePlaceDetails(res.data.results[0].address_components || []);
//         geocodeCache.current.set(cacheKey, parsed);
//         return parsed;
//       }
//       return { district: '', place: 'Unknown Location', tehsil: '', country: '' };
//     } catch {
//       return { district: '', place: 'Error fetching location', tehsil: '', country: '' };
//     } finally { setLoadingLocation(false); }
//   }, []);

//   useEffect(() => {
//     if (!selectedImage) { setPlaceDetails({ district: '', place: '', tehsil: '', country: '' }); return; }
//     const doFetch = async () => { const details = await fetchPlaceDetails(selectedImage.latitude, selectedImage.longitude); setPlaceDetails(details); };
//     doFetch();
//   }, [selectedImage, fetchPlaceDetails]);

//   const filters = ['All'];
//   if (user?.role === 'admin' || user?.permissions?.includes('FirstEmail')) filters.push('FirstEmail');
//   if (user?.role === 'admin' || user?.permissions?.includes('SecondEmail')) filters.push('SecondEmail');
//   if (user?.role === 'admin' || user?.permissions?.includes('ThirdEmail')) filters.push('ThirdEmail');

//   // Heatmap data
//   const heatmapData = images.map(img => new window.google.maps.LatLng(img.latitude, img.longitude));

//   return (
//     <div className="h-screen w-full relative">
//       {/* Top center controls */}
//       <div className="absolute z-10 top-2 left-1/2 transform -translate-x-1/2 flex gap-2 bg-transparent p-2 rounded shadow-md">
//         {/* Filter dropdown */}
//         <select value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)} className="border px-3 py-1 dark:bg-zinc-800 bg-white dark:text-white text-black text-center rounded text-sm">
//           {filters.map(f => <option key={f} value={f}>{f}</option>)}
//         </select>

//         {/* Heatmap toggle button */}
//         <button onClick={() => setShowHeatmap(!showHeatmap)} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
//           {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
//         </button>
//       </div>

//       <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={['visualization']}>
//         <GoogleMap
//           key={`${mapCenter.lat}-${mapCenter.lng}-${mapZoom}`}
//           mapContainerStyle={containerStyle}
//           center={mapCenter}
//           zoom={mapZoom}
//           onLoad={() => setMapReady(true)}
//           options={{ styles: isDarkMode ? darkMapStyle : undefined, disableDefaultUI: false, restriction: { latLngBounds: pakistanBounds, strictBounds: true }, gestureHandling: 'greedy' }}
//         >
//           {/* Markers */}
//           {mapReady && images.map((img, index) => (
//             <Marker key={index} position={{ lat: img.latitude, lng: img.longitude }} onClick={() => setSelectedImage(img)} icon={markerIcons[img.emailKey] || markerIcons.FirstEmail} />
//           ))}

//           {/* Heatmap */}
//           {mapReady && showHeatmap && heatmapData.length > 0 && <HeatmapLayer data={heatmapData} options={{ radius: 50 }} />}

//           {/* InfoWindow */}
//           {selectedImage && (
//             <InfoWindow position={{ lat: selectedImage.latitude, lng: selectedImage.longitude }} onCloseClick={() => { setSelectedImage(null); setPlaceDetails({ district: '', place: '', tehsil: '', country: '' }); }}>
//               <div className="w-fit max-w-sm p-2 rounded-md bg-white shadow-lg">
//                 <img src={selectedImage.url} alt={selectedImage.name} className="w-full h-40 object-scale-down rounded" />
//                 <div className="mt-2 text-sm space-y-1">
//                   <p className="text-gray-400 flex gap-2 items-center"><span className="font-semibold text-black flex">GPS:</span> {selectedImage.latitude}, {selectedImage.longitude}</p>
//                   <div className="text-gray-400">
//                     {loadingLocation ? <p className="text-sm">Loading location...</p> :
//                       <>
//                         <p><span className="font-semibold text-black">District Name:</span> {placeDetails.district || '—'}</p>
//                         <p><span className="font-semibold text-black">Village Name:</span> {placeDetails.place || '—'}</p>
//                         <p><span className="font-semibold text-black">Tehsil Name:</span> {placeDetails.tehsil || '—'}</p>
//                         <p><span className="font-semibold text-black">Country:</span> {placeDetails.country || '—'}</p>
//                       </>}
//                   </div>
//                   <p className="text-xs text-gray-400"><span className="uppercase font-semibold text-black">Uploaded by:</span> {selectedImage.uploadedBy}</p>
//                   <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedImage.latitude},${selectedImage.longitude}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded">Get Directions <FaDirections /></a>
//                 </div>
//               </div>
//             </InfoWindow>
//           )}
//         </GoogleMap>
//       </LoadScript>
//     </div>
//   );
// };

// export default Home;


// import React, { useEffect, useState } from 'react';
// import { GoogleMap, LoadScript, Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';
// import axios from 'axios';
// import { useUser } from '../Context/UserContext';
// import { FaDirections } from 'react-icons/fa';
// import { useMap } from '../Context/MapContext';

// const containerStyle = { width: '100%', height: '100vh' };
// const pakistanBounds = { north: 37.0, south: 23.5, west: 60.9, east: 77.0 };

// // Dark map style
// const darkMapStyle = [
//   { featureType: "all", elementType: "geometry", stylers: [{ color: "#1e1e1e" }] },
//   { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
//   { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#000000" }, { weight: 2 }] },
//   { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c2c2c" }] },
//   { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#3a3a3a" }] },
//   { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
//   { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#444444" }] },
//   { featureType: "poi", elementType: "geometry", stylers: [{ color: "#2c2c2c" }] },
//   { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] }
// ];

// // Marker icons
// const markerIcons = {
//   FirstEmail: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
//   SecondEmail: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
//   ThirdEmail: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
// };

// const Home = () => {
//   const [isDarkMode, setIsDarkMode] = useState(false);
//   const [images, setImages] = useState([]);
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [mapReady, setMapReady] = useState(false);
//   const [selectedFilter, setSelectedFilter] = useState('All');
//   const [showHeatmap, setShowHeatmap] = useState(false);
//   const { user } = useUser();
//   const { mapCenter, mapZoom } = useMap();

//   // Dark mode sync
//   useEffect(() => {
//     const observer = new MutationObserver(() =>
//       setIsDarkMode(document.documentElement.classList.contains('dark'))
//     );
//     observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
//     setIsDarkMode(document.documentElement.classList.contains('dark'));
//     return () => observer.disconnect();
//   }, []);

//   // Fetch images from backend (already contains location fields)
//   const fetchPhotos = {
//     FirstEmail: async () => {
//       const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get1stEmailPhotos`);
//       return res.data.map(img => ({
//         ...img,
//         emailKey: 'FirstEmail',
//         url: `${import.meta.env.VITE_BASE_URL}/uploads/${img.fileId}.jpg`
//       }));
//     },
//     SecondEmail: async () => {
//       const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get2ndEmailPhotos`);
//       return res.data.map(img => ({
//         ...img,
//         emailKey: 'SecondEmail',
//         url: `${import.meta.env.VITE_BASE_URL}/uploads/${img.fileId}.jpg`
//       }));
//     },
//     ThirdEmail: async () => {
//       const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get3rdEmailPhotos`);
//       return res.data.map(img => ({
//         ...img,
//         emailKey: 'ThirdEmail',
//         url: `${import.meta.env.VITE_BASE_URL}/uploads/${img.fileId}.jpg`
//       }));
//     },
//   };

//   useEffect(() => {
//     const fetchImages = async () => {
//       let all = [];
//       const permissions = [];
//       if (user?.role === 'admin') permissions.push('FirstEmail', 'SecondEmail', 'ThirdEmail');
//       else {
//         if (user?.permissions?.includes('FirstEmail')) permissions.push('FirstEmail');
//         if (user?.permissions?.includes('SecondEmail')) permissions.push('SecondEmail');
//         if (user?.permissions?.includes('ThirdEmail')) permissions.push('ThirdEmail');
//       }
//       for (const emailKey of permissions) {
//         if (selectedFilter === 'All' || selectedFilter === emailKey) {
//           const data = await fetchPhotos[emailKey]();
//           all.push(...data);
//         }
//       }
//       setImages(all);
//     };
//     fetchImages();
//   }, [user, selectedFilter]);

//   const filters = ['All'];
//   if (user?.role === 'admin' || user?.permissions?.includes('FirstEmail')) filters.push('FirstEmail');
//   if (user?.role === 'admin' || user?.permissions?.includes('SecondEmail')) filters.push('SecondEmail');
//   if (user?.role === 'admin' || user?.permissions?.includes('ThirdEmail')) filters.push('ThirdEmail');

//   // Heatmap data
//   const heatmapData = images.map(img => new window.google.maps.LatLng(img.latitude, img.longitude));

//   return (
//     <div className="h-screen w-full relative">
//       {/* Top controls */}
//       <div className="absolute z-10 top-2 left-1/2 transform -translate-x-1/2 flex gap-2 p-2">
//         <select
//           value={selectedFilter}
//           onChange={(e) => setSelectedFilter(e.target.value)}
//           className="border px-3 py-1 dark:bg-zinc-800 bg-white dark:text-white text-black text-center rounded text-sm"
//         >
//           {filters.map(f => <option key={f} value={f}>{f}</option>)}
//         </select>

//         <button
//           onClick={() => setShowHeatmap(!showHeatmap)}
//           className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
//         >
//           {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
//         </button>
//       </div>

//       <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={['visualization']}>
//         <GoogleMap
//           key={`${mapCenter.lat}-${mapCenter.lng}-${mapZoom}`}
//           mapContainerStyle={containerStyle}
//           center={mapCenter}
//           zoom={mapZoom}
//           onLoad={() => setMapReady(true)}
//           options={{
//             styles: isDarkMode ? darkMapStyle : undefined,
//             disableDefaultUI: false,
//             restriction: { latLngBounds: pakistanBounds, strictBounds: true },
//             gestureHandling: 'greedy'
//           }}
//         >
//           {/* Markers */}
//           {mapReady && images.map((img, index) => (
//             <Marker
//               key={index}
//               position={{ lat: img.latitude, lng: img.longitude }}
//               onClick={() => setSelectedImage(img)}
//               icon={markerIcons[img.emailKey] || markerIcons.FirstEmail}
//             />
//           ))}

//           {/* Heatmap */}
//           {mapReady && showHeatmap && heatmapData.length > 0 && (
//             <HeatmapLayer data={heatmapData} options={{ radius: 50 }} />
//           )}

//           {/* InfoWindow */}
//           {selectedImage && (
//             <InfoWindow
//               position={{ lat: selectedImage.latitude, lng: selectedImage.longitude }}
//               onCloseClick={() => setSelectedImage(null)}
//             >
//               <div className="w-fit max-w-sm p-2 rounded-md bg-white shadow-lg">
//                 <img src={selectedImage.url} alt={selectedImage.name} className="w-full h-40 object-scale-down rounded" />
//                 <div className="mt-2 text-sm space-y-1">
//                   <p className="text-gray-400"><span className="font-semibold text-black">GPS:</span> {selectedImage.latitude}, {selectedImage.longitude}</p>
//                   <div className="text-gray-400">
//                     <p><span className="font-semibold text-black">District Name:</span> {selectedImage.district || '—'}</p>
//                     <p><span className="font-semibold text-black">Village Name:</span> {selectedImage.village || '—'}</p>
//                     <p><span className="font-semibold text-black">Tehsil Name:</span> {selectedImage.tehsil || '—'}</p>
//                     <p><span className="font-semibold text-black">Country:</span> {selectedImage.country || '—'}</p>
//                   </div>
//                   <p className="text-xs text-gray-400">
//                     <span className="uppercase font-semibold text-black">Uploaded by:</span> {selectedImage.uploadedBy}
//                   </p>
//                   <a
//                     href={`https://www.google.com/maps/dir/?api=1&destination=${selectedImage.latitude},${selectedImage.longitude}`}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="mt-2 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded"
//                   >
//                     Get Directions <FaDirections />
//                   </a>
//                 </div>
//               </div>
//             </InfoWindow>
//           )}
//         </GoogleMap>
//       </LoadScript>
//     </div>
//   );
// };

// export default Home;


import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';
import axios from 'axios';
import { useUser } from '../Context/UserContext';
import { FaDirections } from 'react-icons/fa';
import { useMap } from '../Context/MapContext';

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

const Home = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
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

  // Fetch images from backend
  const fetchPhotos = {
    FirstEmail: async () => {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get1stEmailPhotos`);
      return res.data.map(img => ({
        ...img,
        emailKey: 'FirstEmail',
        url: `${import.meta.env.VITE_BASE_URL}/uploads/${img.fileId}.jpg`
      }));
    },
    SecondEmail: async () => {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get2ndEmailPhotos`);
      return res.data.map(img => ({
        ...img,
        emailKey: 'SecondEmail',
        url: `${import.meta.env.VITE_BASE_URL}/uploads/${img.fileId}.jpg`
      }));
    },
    ThirdEmail: async () => {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get3rdEmailPhotos`);
      return res.data.map(img => ({
        ...img,
        emailKey: 'ThirdEmail',
        url: `${import.meta.env.VITE_BASE_URL}/uploads/${img.fileId}.jpg`
      }));
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
                <img src={selectedImage.url} alt={selectedImage.name} className="w-full h-40 object-scale-down rounded" />
                <div className="mt-2 text-sm space-y-1">
                  <p className="text-gray-400"><span className="font-semibold text-black">GPS:</span> {selectedImage.latitude}, {selectedImage.longitude}</p>
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
