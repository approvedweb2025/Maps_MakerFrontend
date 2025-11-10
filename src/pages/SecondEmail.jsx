import axios from "axios";
import React, { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";

const SecondEmail = () => {
  const [photos, setPhotos] = useState([]);
  const [photosByYear, setPhotosByYear] = useState({});
  const [photosByDistrict, setPhotosByDistrict] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("year");
  const [modalPhotos, setModalPhotos] = useState([]);
  const [modalTitle, setModalTitle] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [previewImage, setPreviewImage] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      // API call metadata fetch karne ke liye bilkul theek hai
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/photos/getImages/homesinsindh@gmail.com`
      );

      // ✅ TABDEELI KI GAYI HAI: Backend { photos: [...] } bhejta hai, isliye res.data.photos istemal karein
      const rawPhotos = res.data.photos || [];

      const enrichedPhotos = rawPhotos.map((photo) => ({
        ...photo,
        year: new Date(photo.timestamp).getFullYear(),
        district: photo.district || "Unknown",
      }));

      setPhotos(enrichedPhotos);

      const groupBy = (arr, key) =>
        arr.reduce((acc, photo) => {
          const value = photo[key] || "Unknown";
          if (!acc[value]) acc[value] = [];
          acc[value].push(photo);
          return acc;
        }, {});

      setPhotosByYear(groupBy(enrichedPhotos, "year"));
      setPhotosByDistrict(groupBy(enrichedPhotos, "district"));
    } catch (err) {
      console.error("❌ Error fetching photos for SecondEmail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const openModal = (title, images) => {
    setModalTitle(title);
    setModalPhotos(images);
    setShowModal(true);
  };

  const openPreview = (photo) => {
    // ✅ TABDEELI KI GAYI HAI: Image URL banane ke logic ko ek function mein daal diya hai
    const imageUrl = `${import.meta.env.VITE_BASE_URL}/photos/image-data/${photo._id}`;
    setPreviewImage(imageUrl);
    setIsFullscreen(false);
    setZoom(1);
  };

  const ImageGrid = ({ title, images }) => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          {title} ({images.length})
        </h3>
        <button
          onClick={() => openModal(title, images)}
          className="text-sm text-blue-600 hover:underline"
        >
          View All
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {images.slice(0, 6).map((photo) => (
          <img
            key={photo._id}
            src={`${import.meta.env.VITE_BASE_URL}/photos/image-data/${photo._id}`}
            alt={photo.name}
            className="rounded w-full h-28 object-cover cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => openPreview(photo)}
            loading="lazy" // ✅ Behtari: Lazy loading add ki gayi hai
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="px-4 py-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
        Photos by homesindh
      </h1>

      {/* Tabs */}
      <div className="flex gap-4 justify-center mb-6">
        <button
          onClick={() => setActiveTab("year")}
          className={`px-4 py-2 rounded font-medium ${
            activeTab === "year"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-white"
          }`}
        >
          📁 Group by Year
        </button>
        <button
          onClick={() => setActiveTab("district")}
          className={`px-4 py-2 rounded font-medium ${
            activeTab === "district"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-white"
          }`}
        >
          🏙️ Group by District
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-center text-gray-500">Loading photos...</p>
      ) : photos.length === 0 ? (
        <p className="text-center text-gray-500">No photos found.</p>
      ) : activeTab === "year" ? (
        Object.entries(photosByYear)
          .sort((a, b) => b[0] - a[0])
          .map(([year, yearPhotos]) => (
            <ImageGrid key={year} title={year} images={yearPhotos} />
          ))
      ) : (
        Object.entries(photosByDistrict)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([district, districtPhotos]) => (
            <ImageGrid key={district} title={district} images={districtPhotos} />
          ))
      )}

      {/* Modal for "View All" */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto p-4 relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {modalTitle} ({modalPhotos.length} photos)
              </h2>
              <IoClose
                className="text-gray-700 dark:text-white text-2xl cursor-pointer"
                onClick={() => setShowModal(false)}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {modalPhotos.map((photo) => (
                <img
                  key={photo._id}
                  src={`${import.meta.env.VITE_BASE_URL}/photos/image-data/${photo._id}`}
                  alt={photo.name}
                  className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => openPreview(photo)}
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Single Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => setPreviewImage(null)}>
          <div
            className={`relative flex items-center justify-center ${
              isFullscreen ? "w-screen h-screen" : "w-[90vw] h-[90vh] max-w-4xl max-h-4xl"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <IoClose
              size={32}
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 text-white cursor-pointer z-20 bg-black/50 rounded-full p-1"
            />
            <div className="absolute bottom-4 right-4 flex gap-2 z-20">
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</button>
              <button onClick={() => setZoom((z) => Math.min(z + 0.2, 3))} className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm">➕</button>
              <button onClick={() => setZoom((z) => Math.max(z - 0.2, 1))} className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm">➖</button>
            </div>
            <div className="w-full h-full overflow-hidden flex items-center justify-center">
              <img
                src={previewImage}
                alt="Preview"
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

export default SecondEmail;
