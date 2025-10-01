// import axios from 'axios';
// import React, { useEffect, useState, useRef, useCallback } from 'react';
// import { IoClose } from 'react-icons/io5';

// const ThirdEmail = () => {
//   const [photos, setPhotos] = useState([]);
//   const [groupedByDistrict, setGroupedByDistrict] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [showDistrictModal, setShowDistrictModal] = useState(false);
//   const [activeDistrict, setActiveDistrict] = useState('');
//   const [showImage, setShowImage] = useState(false);
//   const [activeImage, setActiveImage] = useState('');
//   const geocodeCache = useRef(new Map());

//   const getDistrictForCoords = useCallback(async (latitude, longitude) => {
//     const key = `${latitude},${longitude}`;
//     if (geocodeCache.current.has(key)) {
//       return geocodeCache.current.get(key);
//     }

//     try {
//       const res = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
//         params: {
//           latlng: `${latitude},${longitude}`,
//           key: import.meta.env.VITE_GEOCODING_API_KEY,
//         },
//       });

//       if (res.data.status === 'OK' && Array.isArray(res.data.results) && res.data.results.length) {
//         const components = res.data.results[0].address_components || [];
//         const districtComponent =
//           components.find((c) => c.types.includes('administrative_area_level_2')) ||
//           components.find((c) => c.types.includes('administrative_area_level_1'));
//         const districtName = districtComponent ? districtComponent.long_name : 'Unknown';
//         geocodeCache.current.set(key, districtName);
//         return districtName;
//       }
//     } catch (err) {
//       console.error('Geocoding error:', err);
//     }
//     geocodeCache.current.set(key, 'Unknown');
//     return 'Unknown';
//   }, []);

//   const getImages = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/getImages/muhammadjig8@gmail.com`);
//       if (response.status === 200) {
//         const fetched = response.data.photos || [];

//         // Deduplicate geocode calls
//         const coordPromises = {};
//         for (const photo of fetched) {
//           const coordKey = `${photo.latitude},${photo.longitude}`;
//           if (!coordPromises[coordKey]) {
//             coordPromises[coordKey] = getDistrictForCoords(photo.latitude, photo.longitude);
//           }
//         }

//         const coordToDistrict = {};
//         await Promise.all(
//           Object.entries(coordPromises).map(async ([coordKey, promise]) => {
//             const district = await promise;
//             coordToDistrict[coordKey] = district;
//           })
//         );

//         const withDistrict = fetched.map((p) => {
//           const coordKey = `${p.latitude},${p.longitude}`;
//           return {
//             ...p,
//             district: coordToDistrict[coordKey] || 'Unknown',
//           };
//         });

//         setPhotos(withDistrict);

//         const grouped = withDistrict.reduce((acc, photo) => {
//           const d = photo.district || 'Unknown';
//           if (!acc[d]) acc[d] = [];
//           acc[d].push(photo);
//           return acc;
//         }, {});
//         setGroupedByDistrict(grouped);
//       }
//     } catch (err) {
//       console.error('❌ Error fetching photos:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     getImages();
//   }, [getDistrictForCoords]);

//   const openDistrict = (districtName) => {
//     setActiveDistrict(districtName);
//     setShowDistrictModal(true);
//   };

//   const closeDistrictModal = () => {
//     setShowDistrictModal(false);
//     setActiveDistrict('');
//   };

//   const openImage = (url) => {
//     setActiveImage(url);
//     setShowImage(true);
//   };

//   const closeImage = () => {
//     setShowImage(false);
//     setActiveImage('');
//   };

//   const renderTimestamp = (lastCheckedAt) => {
//     if (lastCheckedAt == null) return <p>Never checked</p>;
//     const lastCheckedTime = new Date(lastCheckedAt);
//     const now = new Date();
//     const diffInMs = now - lastCheckedTime;
//     const diffInHours = diffInMs / (1000 * 60 * 60);
//     if (diffInHours < 1) return <p>Just now</p>;
//     return <p>{Math.floor(diffInHours)} hour(s) ago</p>;
//   };

//   return (
//     <div className="px-4 py-3 max-h-[100vh] overflow-y-auto">
//       {/* Header */}
//       <div className="w-full ">
//         <div className="flex lg:flex-row flex-col items-center mb-2 justify-between gap-4 py-5 px-4 rounded-lg dark:bg-zinc-800 bg-gray-200">
//           <div>
//             <h1 className="text-xl sm:text-2xl font-roboto uppercase text-gray-800 dark:text-white">
//               Fetched Images ({photos?.length})
//             </h1>
//             {photos[0]?.uploadedBy && (
//               <p className="text-sm mt-1">
//                 Fetched By: <span className="font-medium">{photos[0].uploadedBy}</span>
//               </p>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* District Collections */}
//       {loading ? (
//         <p>Loading photos...</p>
//       ) : (
//         <>
//           <div className="mb-6">
//             <h2 className="text-lg font-semibold mb-2">Collections by District</h2>
//             <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
//               {Object.entries(groupedByDistrict).map(([districtName, photosInDistrict]) => (
//                 <div
//                   key={districtName}
//                   className="border rounded-lg overflow-hidden shadow hover:shadow-lg cursor-pointer relative"
//                   onClick={() => openDistrict(districtName)}
//                 >
//                   <div className="h-40 w-full overflow-hidden">
//                     <img
//                       src={`${import.meta.env.VITE_BASE_URL}/uploads/${photosInDistrict[0].fileId}.jpg`}
//                       alt={`Thumbnail ${districtName}`}
//                       className="w-full h-full object-cover"
//                     />
//                   </div>
//                   <div className="p-3 bg-white dark:bg-zinc-800">
//                     <p className="font-semibold text-sm truncate">{districtName}</p>
//                     <p className="text-xs text-gray-500 dark:text-gray-300">
//                       {photosInDistrict.length} image{photosInDistrict.length > 1 ? 's' : ''}
//                     </p>
//                   </div>
//                   <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full px-2 py-1 text-xs">
//                     {photosInDistrict.length}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* District Modal */}
//           {showDistrictModal && activeDistrict && (
//             <div className="fixed inset-0 z-50 flex items-start overflow-auto pt-16 bg-black bg-opacity-60">
//               <div className="relative max-w-4xl mx-auto w-full bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4">
//                 <IoClose
//                   size={28}
//                   onClick={closeDistrictModal}
//                   className="absolute top-3 right-3 text-gray-700 dark:text-gray-200 cursor-pointer"
//                 />
//                 <h3 className="text-xl font-semibold mb-2">
//                   District: {activeDistrict} ({groupedByDistrict[activeDistrict]?.length || 0} image
//                   {groupedByDistrict[activeDistrict]?.length > 1 ? 's' : ''})
//                 </h3>
//                 <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
//                   {groupedByDistrict[activeDistrict]?.map((photo) => (
//                     <div key={photo.fileId} className="relative rounded overflow-hidden shadow">
//                       <img
//                         src={`${import.meta.env.VITE_BASE_URL}/uploads/${photo.fileId}.jpg`}
//                         alt={photo.name}
//                         className="w-full h-32 object-cover cursor-pointer"
//                         onClick={() =>
//                           openImage(`${import.meta.env.VITE_BASE_URL}/uploads/${photo.fileId}.jpg`)
//                         }
//                       />
//                       <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-60 text-white p-1 text-xs">
//                         {renderTimestamp(photo.lastCheckedAt)}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Fullscreen Image Modal */}
//           {showImage && (
//             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
//               <div className="relative w-[300px] h-[300px] lg:w-[500px] lg:h-[500px]">
//                 <IoClose
//                   size={28}
//                   onClick={closeImage}
//                   className="absolute top-2 right-2 text-white cursor-pointer"
//                 />
//                 <img
//                   src={activeImage}
//                   alt="Full preview"
//                   className="w-full h-full object-cover rounded"
//                 />
//               </div>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// export default ThirdEmail;



import axios from 'axios';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { IoClose } from 'react-icons/io5';

const ThirdEmail = () => {
  const [photos, setPhotos] = useState([]);
  const [groupedByYearAndDistrict, setGroupedByYearAndDistrict] = useState({});
  const [loading, setLoading] = useState(true);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [activeYear, setActiveYear] = useState('');
  const [activeDistrict, setActiveDistrict] = useState('');
  const [showImage, setShowImage] = useState(false);
  const [activeImage, setActiveImage] = useState('');
  const geocodeCache = useRef(new Map());

  const getDistrictForCoords = useCallback(async (latitude, longitude) => {
    const key = `${latitude},${longitude}`;
    if (geocodeCache.current.has(key)) {
      return geocodeCache.current.get(key);
    }

    try {
      const res = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          latlng: `${latitude},${longitude}`,
          key: import.meta.env.VITE_GEOCODING_API_KEY,
        },
      });

      if (res.data.status === 'OK' && Array.isArray(res.data.results) && res.data.results.length) {
        const components = res.data.results[0].address_components || [];
        const districtComponent =
          components.find((c) => c.types.includes('administrative_area_level_2')) ||
          components.find((c) => c.types.includes('administrative_area_level_1'));
        const districtName = districtComponent ? districtComponent.long_name : 'Unknown';
        geocodeCache.current.set(key, districtName);
        return districtName;
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }

    geocodeCache.current.set(key, 'Unknown');
    return 'Unknown';
  }, []);

  const getImages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/getImages/muhammadjig8@gmail.com`);
      if (response.status === 200) {
        const fetched = response.data.photos || [];

        const coordPromises = {};
        for (const photo of fetched) {
          const coordKey = `${photo.latitude},${photo.longitude}`;
          if (!coordPromises[coordKey]) {
            coordPromises[coordKey] = getDistrictForCoords(photo.latitude, photo.longitude);
          }
        }

        const coordToDistrict = {};
        await Promise.all(
          Object.entries(coordPromises).map(async ([coordKey, promise]) => {
            const district = await promise;
            coordToDistrict[coordKey] = district;
          })
        );

        const withDistrict = fetched.map((p) => {
          const coordKey = `${p.latitude},${p.longitude}`;
          const year = new Date(p.createdAt).getFullYear();
          return {
            ...p,
            district: coordToDistrict[coordKey] || 'Unknown',
            year: isNaN(year) ? 'Unknown Year' : String(year),
          };
        });

        setPhotos(withDistrict);

        const grouped = withDistrict.reduce((acc, photo) => {
          const year = photo.year;
          const district = photo.district || 'Unknown';

          if (!acc[year]) acc[year] = {};
          if (!acc[year][district]) acc[year][district] = [];

          acc[year][district].push(photo);
          return acc;
        }, {});

        setGroupedByYearAndDistrict(grouped);
      }
    } catch (err) {
      console.error('❌ Error fetching photos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getImages();
  }, [getDistrictForCoords]);

  const openDistrict = (year, district) => {
    setActiveYear(year);
    setActiveDistrict(district);
    setShowDistrictModal(true);
  };

  const closeDistrictModal = () => {
    setShowDistrictModal(false);
    setActiveDistrict('');
    setActiveYear('');
  };

  const openImage = (url) => {
    setActiveImage(url);
    setShowImage(true);
  };

  const closeImage = () => {
    setShowImage(false);
    setActiveImage('');
  };

  const renderTimestamp = (lastCheckedAt) => {
    if (lastCheckedAt == null) return <p>Never checked</p>;
    const lastCheckedTime = new Date(lastCheckedAt);
    const now = new Date();
    const diffInMs = now - lastCheckedTime;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    if (diffInHours < 1) return <p>Just now</p>;
    return <p>{Math.floor(diffInHours)} hour(s) ago</p>;
  };

  return (
    <div className="px-4 py-3 max-h-[100vh] overflow-y-auto">
      <div className="flex lg:flex-row flex-col items-center mb-2 justify-between gap-4 py-5 px-4 rounded-lg dark:bg-zinc-800 bg-gray-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-roboto uppercase text-gray-800 dark:text-white">
            Fetched Images ({photos?.length})
          </h1>
          {photos[0]?.uploadedBy && (
            <p className="text-sm mt-1">
              Fetched By: <span className="font-medium">{photos[0].uploadedBy}</span>
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <p>Loading photos...</p>
      ) : (
        Object.entries(groupedByYearAndDistrict).map(([year, districts]) => (
          <div key={year} className="mb-8">
            <h2 className="text-xl font-bold mb-4">Year: {year}</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Object.entries(districts).map(([districtName, photosInDistrict]) => (
                <div
                  key={districtName}
                  className="border rounded-lg overflow-hidden shadow hover:shadow-lg cursor-pointer relative"
                  onClick={() => openDistrict(year, districtName)}
                >
                  <div className="h-40 w-full overflow-hidden">
                    <img
                      src={`${import.meta.env.VITE_BASE_URL}/photos/file/${photosInDistrict[0].fileId}`}
                      alt={`Thumbnail ${districtName}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const id = photosInDistrict[0].driveFileId || photosInDistrict[0].fileId;
                        if (id) e.currentTarget.src = `https://drive.google.com/uc?export=view&id=${id}`;
                      }}
                    />
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-800">
                    <p className="font-semibold text-sm truncate">{districtName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-300">
                      {photosInDistrict.length} image{photosInDistrict.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full px-2 py-1 text-xs">
                    {photosInDistrict.length}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal */}
      {showDistrictModal && activeDistrict && (
        <div className="fixed inset-0 z-50 flex items-start overflow-auto pt-16 bg-black bg-opacity-60">
          <div className="relative max-w-4xl mx-auto w-full bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4">
            <IoClose
              size={28}
              onClick={closeDistrictModal}
              className="absolute top-3 right-3 text-gray-700 dark:text-gray-200 cursor-pointer"
            />
            <h3 className="text-xl font-semibold mb-2">
              {activeDistrict} ({groupedByYearAndDistrict[activeYear]?.[activeDistrict]?.length || 0} image
              {groupedByYearAndDistrict[activeYear]?.[activeDistrict]?.length > 1 ? 's' : ''})
            </h3>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {groupedByYearAndDistrict[activeYear]?.[activeDistrict]?.map((photo) => (
                <div key={photo.fileId} className="relative rounded overflow-hidden shadow">
                  <img
                    src={`${import.meta.env.VITE_BASE_URL}/photos/file/${photo.fileId}`}
                    alt={photo.name}
                    className="w-full h-32 object-cover cursor-pointer"
                    onError={(e) => {
                      const id = photo.driveFileId || photo.fileId;
                      if (id) e.currentTarget.src = `https://drive.google.com/uc?export=view&id=${id}`;
                    }}
                    onClick={() =>
                      openImage(`${import.meta.env.VITE_BASE_URL}/photos/file/${photo.fileId}`)
                    }
                  />
                  <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-60 text-white p-1 text-xs">
                    {renderTimestamp(photo.lastCheckedAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="relative w-[300px] h-[300px] lg:w-[500px] lg:h-[500px]">
            <IoClose
              size={28}
              onClick={closeImage}
              className="absolute top-2 right-2 text-white cursor-pointer"
            />
            <img
              src={activeImage}
              alt="Full preview"
              className="w-full h-full object-cover rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ThirdEmail;
