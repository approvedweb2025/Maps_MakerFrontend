import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Gallery = () => {
  const [photos, setPhotos] = useState([]);
  const [imageUrls, setImageUrls] = useState({});
  const [loading, setLoading] = useState(true);


  // Fetch photo metadata from your database Use in Both Methods cloudinary and normal but reloading
  const getImages = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get-photos`);
      if (response.status === 200) {
        setPhotos(response.data.photos);
      }
    } catch (err) {
      console.error('Error fetching photos:', err.message);
    } finally {
      setLoading(false);
    }
  };


  // use in both methods
  useEffect(() => {
    getImages();
  }, []);



  // Using in both method reloded or Cloudinary Method
  return (
    <div className="px-4 py-3">
      <h2 className="text-xl font-bold mb-4">Your Google Photos</h2>

      {loading ? (
        <p>Loading photos...</p>
      ) : (
        <div className="w-full grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {photos.map(photo => (
            <div key={photo.fileId} className="aspect-square overflow-hidden rounded-lg shadow-md relative">
              {/* ✅ Show the local image from uploads folder */}
              {photo.fileId ? (
                <img
                  src={`${import.meta.env.VITE_BASE_URL}/uploads/${photo.fileId}.jpg`}
                  alt={photo.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <p>Image not available</p>
                </div>
              )}

              <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-60 text-white p-2 text-sm">
                {photo.hoursSinceLastCheck === null ? (
                  <p>Never checked</p>
                ) : photo.hoursSinceLastCheck < 1 ? (
                  <p>Last checked: Just now</p>
                ) : (
                  <p>Last checked: {Math.floor(photo.hoursSinceLastCheck)} hour(s) ago</p>
                )}
              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );




};

export default Gallery;
