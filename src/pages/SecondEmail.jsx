import axios from "axios";
import React, { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { buildApiUrl } from "../config/api";

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
      console.log("🔄 SecondEmail: Fetching photos...");
      
      let rawPhotos = [];
      
      // Try the specific email endpoint first
      try {
        const res = await axios.get(
          buildApiUrl('/photos/get2ndEmailPhotos')
        );
        console.log("✅ SecondEmail API response:", res.data);
        rawPhotos = res.data.photos || [];
        console.log(`📊 SecondEmail: Found ${rawPhotos.length} photos from specific endpoint`);
      } catch (endpointErr) {
        console.log("⚠️ Specific endpoint failed, trying fallback...", endpointErr.message);
        
        // Fallback to general endpoint and filter
        try {
          const fallbackRes = await axios.get(buildApiUrl('/photos/get-photos'));
          if (fallbackRes.status === 200) {
            rawPhotos = (fallbackRes.data.photos || []).filter(p => p.uploadedBy === 'mhuzaifa86797@gmail.com');
            console.log(`📊 SecondEmail: Found ${rawPhotos.length} photos from fallback`);
          }
        } catch (fallbackErr) {
          console.error("❌ Fallback also failed:", fallbackErr);
          rawPhotos = []; // Return empty array instead of mock data
        }
      }

      const enrichedPhotos = rawPhotos.map((photo) => ({
        ...photo,
        year: new Date(photo.timestamp).getFullYear(),
        district: photo.district || "Unknown",
        // Build proper image URL with Cloudinary fallback
        url: photo.cloudinaryUrl || 
             (photo.fileId && /^[a-f0-9]{24}$/i.test(photo.fileId) 
               ? buildApiUrl(`/photos/file/${photo.fileId}`)
               : photo.driveFileId 
                 ? `https://drive.google.com/uc?export=view&id=${photo.driveFileId}`
                 : photo.fileId 
                   ? `https://drive.google.com/uc?export=view&id=${photo.fileId}`
                   : '')
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
      console.log(`🎯 SecondEmail: Processed ${enrichedPhotos.length} photos`);
      
      // Debug: Log first few photo URLs
      if (enrichedPhotos.length > 0) {
        console.log("🔍 SecondEmail: Sample photo URLs:", enrichedPhotos.slice(0, 3).map(p => ({ 
          name: p.name, 
          url: p.url, 
          cloudinaryUrl: p.cloudinaryUrl,
          fileId: p.fileId,
          driveFileId: p.driveFileId 
        })));
      }
    } catch (err) {
      console.error("❌ Error fetching photos:", err);
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
        {images.slice(0, 6).map((photo) => (
          <div key={photo.fileId} className="relative">
            <img
              src={photo.url}
              alt={photo.name}
              className="rounded w-full h-28 object-cover cursor-pointer"
              onClick={() => {
                setPreviewImage(photo.url);
                setIsFullscreen(false);
                setZoom(1);
              }}
              onError={(e) => {
                console.log(`❌ SecondEmail: Image failed to load: ${photo.url}`);
                // Fallback to Google Drive if Cloudinary fails
                const fallbackId = photo.driveFileId || photo.fileId;
                if (fallbackId) {
                  console.log(`🔄 SecondEmail: Trying fallback URL for ${photo.name}`);
                  e.currentTarget.src = `https://drive.google.com/uc?export=view&id=${fallbackId}`;
                } else {
                  console.log(`❌ SecondEmail: No fallback available for ${photo.name}`);
                }
              }}
            />
            {!photo.url && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded">
                <span className="text-gray-500 text-sm">Loading...</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="px-4 py-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
        Second Email Photos (mhuzaifa86797@gmail.com)
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
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No photos found for this email</p>
          <p className="text-gray-400 text-sm">Check the browser console for debugging information</p>
        </div>
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

      {/* Modal */}
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
              {modalPhotos.map((photo) => (
                <img
                  key={photo.fileId}
                  src={photo.url}
                  alt={photo.name}
                  className="w-full h-32 object-cover rounded cursor-pointer"
                  onClick={() => {
                    setPreviewImage(photo.url);
                    setIsFullscreen(false);
                    setZoom(1);
                  }}
                  onError={(e) => {
                    console.log(`❌ SecondEmail Modal: Image failed to load: ${photo.url}`);
                    // Fallback to Google Drive if Cloudinary fails
                    const fallbackId = photo.driveFileId || photo.fileId;
                    if (fallbackId) {
                      console.log(`🔄 SecondEmail Modal: Trying fallback URL for ${photo.name}`);
                      e.currentTarget.src = `https://drive.google.com/uc?export=view&id=${fallbackId}`;
                    } else {
                      console.log(`❌ SecondEmail Modal: No fallback available for ${photo.name}`);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Single Image Preview */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div
            className={`relative flex items-center justify-center ${
              isFullscreen ? "w-screen h-screen" : "w-[300px] h-[300px] lg:w-[500px] lg:h-[500px]"
            }`}
          >
            <IoClose
              size={28}
              onClick={() => {
                setPreviewImage(null);
                setIsFullscreen(false);
                setZoom(1);
              }}
              className="absolute top-2 right-2 text-white cursor-pointer z-20"
            />
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

export default SecondEmail;
