import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const AddUsers = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    statusaccess: 'approved',
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/users/userbyadmin`,
        formData
      );

      if (response.status === 200) {
        toast.success(response.data.message);
        setFormData({
          name: '',
          email: '',
          password: '',
          statusaccess: 'approved',
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Something went wrong';
      toast.error(errorMessage);
      console.error('Error creating user:', errorMessage);
    }
  };

  return (
    <div className="flex justify-center items-center px-4 pt-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md sm:max-w-lg md:max-w-xl bg-gray-200 dark:bg-zinc-800 p-6 sm:p-8 rounded-xl shadow-md space-y-6"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-center dark:text-white text-gray-800">
          Add New User
        </h2>

        {/* Username */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
            Username
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            autoComplete="username"
            className="w-full px-3 py-2 rounded border focus:outline-none focus:ring focus:border-blue-400 dark:bg-zinc-900 dark:text-white"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            className="w-full px-3 py-2 rounded border focus:outline-none focus:ring focus:border-blue-400 dark:bg-zinc-900 dark:text-white"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
            Password
          </label>
          <div className="relative flex items-center border rounded px-3 py-2 dark:bg-zinc-900 focus-within:border-blue-400 focus-within:ring">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              className="flex-1 bg-transparent outline-none text-sm dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Enter password"
            />
            {showPassword ? (
              <FaEyeSlash
                size={18}
                className="text-gray-500 dark:text-gray-300 cursor-pointer ml-2"
                onClick={() => setShowPassword(false)}
              />
            ) : (
              <FaEye
                size={18}
                className="text-gray-500 dark:text-gray-300 cursor-pointer ml-2"
                onClick={() => setShowPassword(true)}
              />
            )}
          </div>
        </div>

        {/* Access Status */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
            Access Status
          </label>
          <select
            name="statusaccess"
            value={formData.statusaccess}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded border focus:outline-none focus:ring focus:border-blue-400 dark:bg-zinc-900 dark:text-white"
          >
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-semibold transition"
        >
          Add User
        </button>
      </form>
    </div>
  );
};

export default AddUsers;
