import React, { useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';

const CloudinaryOrganizer = () => {
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [isCreatingFolders, setIsCreatingFolders] = useState(false);
  const [isCreatingFoldersSimple, setIsCreatingFoldersSimple] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const organizeImages = async () => {
    try {
      setIsOrganizing(true);
      setError(null);
      setResult(null);

      console.log('🔄 Starting Cloudinary image organization...');
      
      const response = await axios.post(buildApiUrl('/photos/organize-cloudinary-images'));
      
      console.log('✅ Organization completed:', response.data);
      setResult(response.data);
      
    } catch (err) {
      console.error('❌ Organization failed:', err);
      setError(err.response?.data || err.message || 'Organization failed');
    } finally {
      setIsOrganizing(false);
    }
  };

  const createFolders = async () => {
    try {
      setIsCreatingFolders(true);
      setError(null);
      setResult(null);

      console.log('🔄 Creating Cloudinary folders...');
      
      const response = await axios.post(buildApiUrl('/photos/create-folders'));
      
      console.log('✅ Folders created:', response.data);
      setResult(response.data);
      
    } catch (err) {
      console.error('❌ Create folders failed:', err);
      setError(err.response?.data || err.message || 'Create folders failed');
    } finally {
      setIsCreatingFolders(false);
    }
  };

  const createFoldersSimple = async () => {
    try {
      setIsCreatingFoldersSimple(true);
      setError(null);
      setResult(null);

      console.log('🔄 Creating Cloudinary folders (simple approach)...');
      
      const response = await axios.post(buildApiUrl('/photos/create-folders-simple'));
      
      console.log('✅ Folders created:', response.data);
      setResult(response.data);
      
    } catch (err) {
      console.error('❌ Create folders simple failed:', err);
      setError(err.response?.data || err.message || 'Create folders simple failed');
    } finally {
      setIsCreatingFoldersSimple(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        🗂️ Cloudinary Image Organizer
      </h2>
      
      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This tool will organize your Cloudinary images into three folders:
        </p>
        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
          <li><strong>first-email</strong> - for mhuzaifa8519@gmail.com</li>
          <li><strong>second-email</strong> - for mhuzaifa86797@gmail.com</li>
          <li><strong>third-email</strong> - for muhammadjig8@gmail.com</li>
        </ul>
        <p className="text-gray-600 dark:text-gray-400 mt-4">
          It will also update your database with the correct Cloudinary URLs and metadata.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={createFoldersSimple}
          disabled={isOrganizing || isCreatingFolders || isCreatingFoldersSimple}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isOrganizing || isCreatingFolders || isCreatingFoldersSimple
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isCreatingFoldersSimple ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating Folders...
            </span>
          ) : (
            '📁 Create Folders (Simple)'
          )}
        </button>
        
        <button
          onClick={createFolders}
          disabled={isOrganizing || isCreatingFolders || isCreatingFoldersSimple}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isOrganizing || isCreatingFolders || isCreatingFoldersSimple
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-700 text-white'
          }`}
        >
          {isCreatingFolders ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating Folders...
            </span>
          ) : (
            '📁 Create Folders (Advanced)'
          )}
        </button>
        
        <button
          onClick={organizeImages}
          disabled={isOrganizing || isCreatingFolders || isCreatingFoldersSimple}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isOrganizing || isCreatingFolders || isCreatingFoldersSimple
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isOrganizing ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Organizing...
            </span>
          ) : (
            '🚀 Organize Images'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">❌ Error</h3>
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {result && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
          <h3 className="text-green-800 dark:text-green-200 font-semibold mb-2">✅ Organization Complete</h3>
          <div className="text-green-700 dark:text-green-300 space-y-1">
            <p><strong>Total processed:</strong> {result.totalProcessed}</p>
            <p><strong>New records created:</strong> {result.totalCreated}</p>
            <p><strong>Records updated:</strong> {result.totalUpdated}</p>
            <p><strong>Errors:</strong> {result.totalErrors}</p>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500 dark:text-gray-400">
        <p><strong>Note:</strong> This process may take a few minutes depending on the number of images.</p>
        <p>After organization, refresh your pages to see the updated images.</p>
      </div>
    </div>
  );
};

export default CloudinaryOrganizer;
