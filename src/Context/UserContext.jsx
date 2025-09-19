import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // 👉 Login handler
  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    fetchUser(newToken); // fetch user with fresh token
  };

  // 👉 Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // 👉 Fetch user info from backend
  const fetchUser = async (currentToken = token) => {
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      if (res.status === 200) {
        setUser(res.data.user);
      } else {
        logout(); // force logout if not valid
      }
    } catch (err) {
      console.error('❌ Failed to fetch user:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // 👇 Fetch user on initial load
  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
