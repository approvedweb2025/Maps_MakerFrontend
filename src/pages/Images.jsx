import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { Link } from 'react-router-dom';

const Images = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Behtari: Preview ke liye states ko doosre components jaisa bana diya hai
  const [previewImage, setPreviewImage] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const getImages = async () => {
    try {
      setLoading(true);
      // ✅ Aapka yeh logic pehle se hi theek tha!
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get-photos`);
      if (response.status === 200) {
        setPhotos(response.data.photos || []);
      }
    } catch (err) {
      console.error('❌ Error fetching all photos:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getImages();
  }, []);

  const openPreviewModal = (photo) => {
    const imageUrl = `${import.meta.env.VITE_BASE_URL}/photos/image-data/${photo._id}`;
    setPreviewImage(imageUrl);
    setIsFullscreen(false);
    setZoom(1);
  };

  const renderTimestamp = (lastCheckedAt) => {
    if (!lastCheckedAt) return <p>Never checked</p>;
    const lastCheckedTime = new Date(lastCheckedAt);
    const now = new Date();
    const diffInMs = now.getTime() - lastCheckedTime.getTime();
    const diffInMinutes = diffInMs / (1000 * 60);
    const diffInHours = diffInMinutes / 60;

    if (diffInMinutes < 1) return <p>Just now</p>;
    if (diffInMinutes < 60) return <p>{Math.floor(diffInMinutes)}m ago</p>;
    return <p>{Math.floor(diffInHours)}h ago</p>;
  };

  return (
    <div className="px-4 py-3 max-h-[100vh] overflow-y-auto">
      {/* Header */}
      <div className="w-full">
        <div className="flex flex-row items-center mb-6 justify-between gap-4 py-5 px-4 rounded-lg dark:bg-zinc-800 bg-gray-200">
          <h1 className="text-xl sm:text-2xl font-roboto uppercase text-gray-800 dark:text-white">
            All Images ({photos.length})
          </h1>
          <Link
            to="/dashboard/Overviews"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm sm:text-base"
          >
            Go to Overview
          </Link>
        </div>
      </div>

      {/* Image Grid */}
      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-8">Loading photos...</p>
      ) : photos.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No images found.</p>
      ) : (
        <div className="w-full grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo._id}
              className="aspect-square overflow-hidden rounded-lg shadow-md relative group cursor-pointer"
              onClick={() => openPreviewModal(photo)}
            >
              <img
                src={`${import.meta.env.VITE_BASE_URL}/photos/image-data/${photo._id}`}
                alt={photo.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy" // ✅ Behtari: Lazy loading
              />
              <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-60 text-white p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="truncate font-semibold">{photo.name}</p>
                <p>{renderTimestamp(photo.lastCheckedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Behtari: Image Preview Modal ko doosre components jaisa bana diya hai */}
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

export default Images;
