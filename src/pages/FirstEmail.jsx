import axios from "axios";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { IoClose } from "react-icons/io5";

const FirstEmail = () => {
  const [photos, setPhotos] = useState([]);
  const [photosByYear, setPhotosByYear] = useState({});
  const [photosByCity, setPhotosByCity] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState("year");
  const [modalPhotos, setModalPhotos] = useState([]);
  const [modalTitle, setModalTitle] = useState("");
  const [showModal, setShowModal] = useState(false);

  // ✅ Preview states
  const [previewImage, setPreviewImage] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1); // ✅ New zoom state

  const geocodeCache = useRef(new Map());

  const getDistrict = useCallback(async (lat, lng) => {
    const key = `${lat},${lng}`;
    if (geocodeCache.current.has(key)) return geocodeCache.current.get(key);

    try {
      const res = await axios.get(
        "https://maps.googleapis.com/maps/api/geocode/json",
        {
          params: {
            latlng: key,
            key: import.meta.env.VITE_GEOCODING_API_KEY,
          },
        }
      );

      const components = res.data.results?.[0]?.address_components || [];
      const district =
        components.find((c) =>
          c.types.includes("administrative_area_level_2")
        )?.long_name ||
        components.find((c) =>
          c.types.includes("administrative_area_level_1")
        )?.long_name ||
        "Unknown";

      geocodeCache.current.set(key, district);
      return district;
    } catch {
      geocodeCache.current.set(key, "Unknown");
      return "Unknown";
    }
  }, []);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/photos/getImages/peenaykapani@gmail.com`
      );
      const raw = res.data.photos || [];

      const uniqueCoords = {};
      for (const photo of raw) {
        if (photo.latitude != null && photo.longitude != null) {
          const key = `${photo.latitude},${photo.longitude}`;
          if (!uniqueCoords[key]) {
            uniqueCoords[key] = getDistrict(photo.latitude, photo.longitude);
          }
        }
      }

      const coordToDistrict = {};
      await Promise.all(
        Object.entries(uniqueCoords).map(async ([key, promise]) => {
          coordToDistrict[key] = await promise;
        })
      );

      const withMetadata = raw.map((p) => {
        let city = "Unknown";
        if (p.latitude != null && p.longitude != null) {
          const key = `${p.latitude},${p.longitude}`;
          city = coordToDistrict[key] || "Unknown";
        }

        return {
          ...p,
          year: p.timestamp ? new Date(p.timestamp).getFullYear() : "Unknown",
          city,
        };
      });

      setPhotos(withMetadata);

      const yearGrouped = withMetadata.reduce((acc, photo) => {
        const year = photo.year;
        if (!acc[year]) acc[year] = [];
        acc[year].push(photo);
        return acc;
      }, {});
      setPhotosByYear(yearGrouped);

      const cityGrouped = withMetadata.reduce((acc, photo) => {
        const city = photo.city;
        if (!acc[city]) acc[city] = [];
        acc[city].push(photo);
        return acc;
      }, {});
      setPhotosByCity(cityGrouped);
    } catch (err) {
      console.error("Error fetching photos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [getDistrict]);

  const openModal = (title, images) => {
    setModalTitle(title);
    setModalPhotos(images);
    setShowModal(true);
  };

  const ImageGrid = ({ title, images }) => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          {title}
        </h3>
        <button
          onClick={() => openModal(title, images)}
          className="text-sm text-blue-600 hover:underline"
        >
          View All
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {images.slice(0, 6).map((photo) => {
          const url = `${import.meta.env.VITE_BASE_URL}/photos/file/${photo.fileId}`;
          return (
            <img
              key={photo.fileId}
              src={url}
              alt={photo.name}
              className="rounded w-full h-28 object-cover cursor-pointer"
              onClick={() => {
                setPreviewImage(url);
                setIsFullscreen(false);
                setZoom(1);
              }}
            />
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="px-4 py-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
        Uploaded Photos
      </h1>

      {/* Folder Tabs */}
      <div className="flex gap-4 justify-center mb-6">
        <button
          onClick={() => setActiveFolder("year")}
          className={`px-4 py-2 rounded font-medium ${
            activeFolder === "year"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-white"
          }`}
        >
          📁 Photos by Year
        </button>
        <button
          onClick={() => setActiveFolder("city")}
          className={`px-4 py-2 rounded font-medium ${
            activeFolder === "city"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-white"
          }`}
        >
          📁 Photos by City
        </button>
      </div>

      {/* Folder Content */}
      {loading ? (
        <p className="text-center text-gray-500">Loading photos...</p>
      ) : activeFolder === "year" ? (
        Object.entries(photosByYear)
          .sort((a, b) => b[0] - a[0])
          .map(([year, yearPhotos]) => (
            <ImageGrid key={year} title={year} images={yearPhotos} />
          ))
      ) : (
        Object.entries(photosByCity)
          .sort()
          .map(([city, cityPhotos]) => (
            <ImageGrid key={city} title={city} images={cityPhotos} />
          ))
      )}

      {/* Group Modal (View All) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto p-4 relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {modalTitle}
              </h2>
              <IoClose
                className="text-gray-700 dark:text-white text-2xl cursor-pointer"
                onClick={() => setShowModal(false)}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {modalPhotos.map((photo) => {
                const url = `${import.meta.env.VITE_BASE_URL}/photos/file/${photo.fileId}`;
                return (
                  <img
                    key={photo.fileId}
                    src={url}
                    alt={photo.name}
                    className="w-full h-32 object-cover rounded cursor-pointer"
                    onClick={() => {
                      setPreviewImage(url);
                      setIsFullscreen(false);
                      setZoom(1);
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ✅ Single Image Preview Modal with Fullscreen & Zoom */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div
            className={`relative flex items-center justify-center ${
              isFullscreen ? "w-screen h-screen" : "w-[300px] h-[300px] lg:w-[500px] lg:h-[500px]"
            }`}
          >
            {/* Close Button */}
            <IoClose
              size={28}
              onClick={() => {
                setPreviewImage(null);
                setIsFullscreen(false);
                setZoom(1);
              }}
              className="absolute top-2 right-2 text-white cursor-pointer z-20"
            />

            {/* Controls */}
            <div className="absolute bottom-2 right-2 flex gap-2 z-20">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm"
              >
                {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              </button>
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}
                className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm"
              >
                ➕
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(z - 0.2, 1))}
                className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm"
              >
                ➖
              </button>
            </div>

            {/* Image */}
            <img
              src={previewImage}
              alt="Preview"
              style={{ transform: `scale(${zoom})` }}
              className={`transition-transform duration-200 w-full h-full ${
                isFullscreen ? "object-contain" : "object-cover rounded"
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FirstEmail;
