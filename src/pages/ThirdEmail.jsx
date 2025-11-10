import axios from "axios";
import React, { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";

const ThirdEmail = () => {
  const [photos, setPhotos] = useState([]);
  const [groupedByYearAndDistrict, setGroupedByYearAndDistrict] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [activeYear, setActiveYear] = useState('');
  const [activeDistrict, setActiveDistrict] = useState('');
  
  // Preview states
  const [previewImage, setPreviewImage] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const getImages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/getImages/demo@gmail.com`);
      
      // ✅ Aapka yeh logic pehle se hi theek tha!
      const fetchedPhotos = response.data.photos || [];

      const photosWithMetadata = fetchedPhotos.map((photo) => {
        const year = new Date(photo.timestamp).getFullYear();
        return {
          ...photo,
          district: photo.district || 'Unknown',
          year: isNaN(year) ? 'Unknown Year' : String(year),
        };
      });

      setPhotos(photosWithMetadata);

      const grouped = photosWithMetadata.reduce((acc, photo) => {
        const { year, district } = photo;
        if (!acc[year]) acc[year] = {};
        if (!acc[year][district]) acc[year][district] = [];
        acc[year][district].push(photo);
        return acc;
      }, {});

      setGroupedByYearAndDistrict(grouped);
    } catch (err) {
      console.error('❌ Error fetching photos for ThirdEmail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getImages();
  }, []);

  const openDistrictModal = (year, district) => {
    setActiveYear(year);
    setActiveDistrict(district);
    setShowDistrictModal(true);
  };

  const closeDistrictModal = () => {
    setShowDistrictModal(false);
  };

  const openPreviewModal = (photo) => {
    // ✅ Behtari: Image URL banane ka logic ek alag function mein
    const imageUrl = `${import.meta.env.VITE_BASE_URL}/photos/image-data/${photo._id}`;
    setPreviewImage(imageUrl);
    setIsFullscreen(false);
    setZoom(1);
  };

  const renderTimestamp = (lastCheckedAt) => {
    // ... (aapka pehle wala code, ismein koi tabdeeli nahi)
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
      <div className="flex lg:flex-row flex-col items-center mb-8 justify-between gap-4 py-5 px-4 rounded-lg dark:bg-zinc-800 bg-gray-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-roboto uppercase text-gray-800 dark:text-white">
            Photos by demo ({photos.length})
          </h1>
          {photos.length > 0 && (
            <p className="text-sm mt-1 dark:text-gray-300">
              Fetched By: <span className="font-medium">{photos[0].uploadedBy}</span>
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-center mt-8 text-gray-500">Loading photos...</p>
      ) : photos.length === 0 ? (
        <p className="text-center mt-8 text-gray-500">No photos found for this user.</p>
      ) : (
        Object.entries(groupedByYearAndDistrict)
          .sort(([yearA], [yearB]) => yearB - yearA) // Sort years descending
          .map(([year, districts]) => (
            <div key={year} className="mb-8">
              <h2 className="text-xl font-bold mb-4 dark:text-white">Year: {year}</h2>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Object.entries(districts)
                  .sort(([distA], [distB]) => distA.localeCompare(distB)) // Sort districts alphabetically
                  .map(([districtName, photosInDistrict]) => (
                  <div
                    key={districtName}
                    className="border rounded-lg overflow-hidden shadow hover:shadow-lg cursor-pointer relative group"
                    onClick={() => openDistrictModal(year, districtName)}
                  >
                    <div className="h-40 w-full overflow-hidden">
                      <img
                        src={`${import.meta.env.VITE_BASE_URL}/photos/image-data/${photosInDistrict[0]._id}`}
                        alt={`Thumbnail for ${districtName}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy" // ✅ Behtari: Lazy loading add ki gayi hai
                      />
                    </div>
                    <div className="p-3 bg-white dark:bg-zinc-800">
                      <p className="font-semibold text-sm truncate dark:text-white">{districtName}</p>
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

      {/* District Images Modal */}
      {showDistrictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto p-4 bg-black bg-opacity-60">
          <div className="relative max-w-4xl w-full bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 max-h-[90vh] overflow-y-auto">
            <IoClose
              size={28}
              onClick={closeDistrictModal}
              className="absolute top-3 right-3 text-gray-700 dark:text-gray-200 cursor-pointer z-10"
            />
            <h3 className="text-xl font-semibold mb-4 dark:text-white">
              {activeDistrict} ({groupedByYearAndDistrict[activeYear]?.[activeDistrict]?.length || 0} images)
            </h3>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {groupedByYearAndDistrict[activeYear]?.[activeDistrict]?.map((photo) => (
                <div key={photo._id} className="relative rounded overflow-hidden shadow group">
                  <img
                    src={`${import.meta.env.VITE_BASE_URL}/photos/image-data/${photo._id}`}
                    alt={photo.name}
                    className="w-full h-32 object-cover cursor-pointer"
                    onClick={() => openPreviewModal(photo)}
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-60 text-white p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    {renderTimestamp(photo.lastCheckedAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ✅ TABDEELI KI GAYI HAI: Single Image Preview Modal ko behtar banaya gaya hai */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => setPreviewImage(null)}>
          <div
            className={`relative flex items-center justify-center w-[90vw] h-[90vh] max-w-4xl max-h-4xl ${
              isFullscreen ? "w-screen h-screen max-w-full max-h-full" : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <IoClose size={32} onClick={() => setPreviewImage(null)} className="absolute top-2 right-2 text-white cursor-pointer z-20 bg-black/50 rounded-full p-1" />
            <div className="absolute bottom-4 right-4 flex gap-2 z-20">
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</button>
              <button onClick={() => setZoom((z) => Math.min(z + 0.2, 3))} className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm">➕</button>
              <button onClick={() => setZoom((z) => Math.max(z - 0.2, 1))} className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm">➖</button>
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

export default ThirdEmail;
