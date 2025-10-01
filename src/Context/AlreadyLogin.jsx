import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AlreadyLogin = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      // Prevent double navigation during strict mode
      setTimeout(() => {
        navigate('/home');
      }, 0);
    } else {
      setChecking(false);
    }
  }, [navigate]);

  if (checking) {
    return <h1>Loading...</h1>;
  }

  return <>{children}</>;
};

export default AlreadyLogin;
