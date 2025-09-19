import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthProtectedWrapper = ({ children }) => {
  const [tokenChecked, setTokenChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      navigate('/login');
    } else {
      setTokenChecked(true);
    }
  }, [navigate]);

  if (!tokenChecked) {
    return <h1>Loading...</h1>;
  }

  return <>{children}</>;
};

export default AuthProtectedWrapper;
