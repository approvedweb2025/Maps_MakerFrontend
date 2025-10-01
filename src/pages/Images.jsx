import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { IoClose } from 'react-icons/io5';
import { Link } from 'react-router-dom';


// For both method cloudinary or reloaded method
const Images = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImage, setShowImage] = useState(false);
  const [activeImage, setActiveImage] = useState('');

  // 📦 Fetch image metadata from backend
  const getImages = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get-photos`);
      if (response.status === 200) {
        // Normalize URLs: prefer cloudinaryUrl, then backend file, then drive
        const normalized = (response.data.photos || []).map((p) => ({
          ...p,
          displayUrl: p.cloudinaryUrl
            ? p.cloudinaryUrl
            : `${import.meta.env.VITE_BASE_URL}/photos/file/${p.fileId}`,
        }));
        setPhotos(normalized);
      }
    } catch (err) {
      console.error('❌ Error fetching photos:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 📥 Load images on mount
  useEffect(() => {
    getImages();
  }, []);

  return (
    <div className="px-4 py-3 max-h-[100vh] overflow-y-auto">
      {/* 🧾 Header */}
      <div className="w-full">
        <div className="flex flex-row items-center mb-2 justify-between gap-4 py-5 px-4 rounded-lg dark:bg-zinc-800 bg-gray-200">
          <h1 className="text-xl sm:text-2xl font-roboto uppercase text-gray-800 dark:text-white">
            Fetched Images ({photos?.length})
          </h1>
          <Link
            to="/dashboard/Overviews"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm sm:text-base"
          >
            Overview
          </Link>
        </div>
      </div>

      {/* 🖼️ Image Grid */}
      {loading ? (
        <p>Loading photos...</p>
      ) : (
        <div className="w-full grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.fileId}
              className="aspect-square overflow-hidden rounded-lg shadow-md relative"
            >
              <img
                src={photo.displayUrl}
                onError={(e) => {
                  const id = photo.driveFileId || photo.fileId;
                  if (id) e.currentTarget.src = `https://drive.google.com/uc?export=view&id=${id}`;
                }}
                onClick={() => {
                  setActiveImage(photo.displayUrl);
                  setShowImage(true);
                }}
                alt={photo.name}
                className="w-full h-full object-cover cursor-pointer"
              />

              {/* ⏱️ Timestamp */}
              <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-60 text-white p-2 text-xs">
                {photo?.lastCheckedAt == null ? (
                  <p>Never checked</p>
                ) : (() => {
                  const lastCheckedTime = new Date(photo.lastCheckedAt);
                  const now = new Date();
                  const diffInMs = now - lastCheckedTime;
                  const diffInHours = diffInMs / (1000 * 60 * 60);

                  if (diffInHours < 1) return <p>Just now</p>;
                  return <p>{Math.floor(diffInHours)} hour(s) ago</p>;
                })()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🔍 Fullscreen Image Modal */}
      {showImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="relative w-[300px] h-[300px] lg:w-[500px] lg:h-[500px]">
            <IoClose
              size={28}
              onClick={() => {
                setShowImage(false);
                setActiveImage('');
              }}
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

export default Images;
