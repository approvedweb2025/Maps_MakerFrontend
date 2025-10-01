import { useState } from 'react';
import axios from 'axios';
import { IoClose } from 'react-icons/io5';
import toast from 'react-hot-toast';

const AdminEditUserModal = ({ onClose, user }) => {
  const [username, setUsername] = useState(user?.name || '');
  const [password, setPassword] = useState('');

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
      toast.success('User updated successfully!');
      onClose();
    }
  } catch (err) {
    console.error('Update failed:', err);
    toast.error(err.response?.data?.message || err.message);
  }
};


  return (
    <div className='fixed inset-0 bg-black/30 z-50 flex items-center justify-center'>
      <div className='bg-white dark:bg-zinc-800 rounded p-4 w-80'>
        <div className='flex justify-end'>
          <IoClose onClick={onClose} className='cursor-pointer text-xl' />
        </div>
        <h2 className='text-lg mb-4 text-center font-semibold'>Edit User</h2>

        <form onSubmit={handleSubmit}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className='w-full p-2 mb-3 border rounded'
            placeholder='Username'
            autoComplete='username'
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='w-full p-2 mb-3 border rounded'
            type='password'
            placeholder='New Password (optional)'
            autoComplete='password'
          />
          <button
            type='submit'
            className='w-full bg-blue-500 text-white p-2 rounded'
          >
            Update
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminEditUserModal;
