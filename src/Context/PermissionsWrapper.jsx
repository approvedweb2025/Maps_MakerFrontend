import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../Context/UserContext';

const PermissionWrapper = ({ children, required }) => {
  const { user, loading: userLoading } = useUser(); // Get user and loading state
  const navigate = useNavigate();
  const location = useLocation();

  const [userRole, setUserRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [permLoading, setPermLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return; // Wait for user context to finish loading

    if (!user || !user.name) {
      navigate('/login');
      return;
    }

    const fetchPermissions = async () => {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/users/getadminwrapper`,
          { username: user.name }
        );

        if (res.status === 200) {
          setUserRole(res.data.role);
          setPermissions(res.data.permissions || []);
        }
      } catch (err) {
        console.error('Error fetching permissions:', err);
        navigate('/home');
      } finally {
        setPermLoading(false);
      }
    };

    fetchPermissions();
  }, [user, userLoading, navigate]);

  // Show nothing while loading user or permissions
  if (userLoading || permLoading) return null;

  // const hasAccess = userRole === 'admin' || permissions.includes(required);

  const hasAccess = () => {
  const { user } = useUser();

  return (requiredPermission) => {
    if (!user) return false;
    return user.role === 'admin' || user.permissions?.includes(requiredPermission);
  };
};

  if (location.pathname === '/dashboard') {
    return <Navigate to="/dashboard/MyInfo" replace />;
  }

  return hasAccess ? children : <Navigate to="/home" replace />;
};

export default PermissionWrapper;
