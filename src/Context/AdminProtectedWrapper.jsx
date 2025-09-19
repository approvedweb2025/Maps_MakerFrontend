import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from './UserContext';

const AdminProtectedWrapper = ({ children }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(null); // null | true | false

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = user?.name;

    if (!token || !username) {
      navigate('/login');
      return;
    }

    const checkAdmin = async () => {
      try {
        const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/getadmin`, {
          username,
        });

        if (res.status === 200) {
          if (res.data === 'admin') {
            setIsAdmin(true);
          } else {
            navigate('/home');
          }
        }
      } catch (error) {
        console.error('Admin check failed:', error);
        navigate('/home');
      }
    };

    checkAdmin();
  }, [user, navigate]);

  if (isAdmin !== true) return null;

  return <>{children}</>;
};

export default AdminProtectedWrapper;
