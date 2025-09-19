import React, { useState } from 'react'
import { useUser } from '../Context/UserContext'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import toast from 'react-hot-toast'
import axios from 'axios'

const Settings = () => {
  const { user } = useUser()
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState(user?.name);
  const [showPassword, setShowPassword] = useState(false)




  const handleSubmit = async (e) => {
    e.preventDefault(); // prevent page reload

    const token = localStorage.getItem('token');

    // Prepare the update payload
    const updateData = { username };
    if (password.trim() !== '') {
      updateData.password = password;
    }

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/users/user/${user._id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        toast.success('Admin updated successfully!');
        setPassword('')
      }
    } catch (err) {
      console.error('Update failed:', err);
      toast.error(err.response?.data?.message || err.message);
    }
  };
  return (
    <div className='flex items-center justify-center h-full'>
    <form onSubmit={handleSubmit} className="w-full max-w-md sm:max-w-lg">
      <div className="flex flex-col gap-4 rounded-md px-4 py-5 dark:bg-zinc-800 bg-gray-200 shadow-md">

        {/* Role */}
        <div className="hover:bg-green-500/30 dark:bg-zinc-900 bg-gray-100 rounded-md px-3 py-1 w-fit text-center uppercase text-sm font-medium">
          {user.name}
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1">
          <h1 className="uppercase font-semibold tracking-wider font-roboto text-sm">Username:</h1>
          <div className="w-full dark:bg-zinc-900 bg-gray-100 text-zinc-600 rounded px-4 py-2 text-sm">
            {user.name}
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <h1 className="uppercase font-semibold tracking-wider font-roboto text-sm">Email:</h1>
          <div className="w-full dark:bg-zinc-900 bg-gray-100 text-zinc-600 rounded px-4 py-2 text-sm">
            {user.email}
          </div>
        </div>

        {/* Update Password */}
        <div className="flex flex-col gap-2">
          <h1 className="uppercase font-semibold tracking-wider font-roboto text-sm">Update Admin Password:</h1>
          <div className="flex items-center w-full dark:bg-zinc-900 bg-gray-100 rounded px-2 text-zinc-600 border-2 border-transparent focus-within:border-blue-600 transition">
            <input
              placeholder={user.password}
              className="flex-1 px-4 py-2 bg-transparent outline-none font-roboto placeholder-gray-500 text-sm"
              autoComplete="current-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {showPassword ? (
              <FaEyeSlash
                className="cursor-pointer"
                size={20}
                onClick={() => setShowPassword(false)}
              />
            ) : (
              <FaEye
                className="cursor-pointer"
                size={20}
                onClick={() => setShowPassword(true)}
              />
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-2 text-white bg-blue-500 hover:bg-blue-600 rounded text-sm font-medium"
        >
          Update {user.name} Details
        </button>
      </div>
    </form>
    </div>
  );
};


export default Settings