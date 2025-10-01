// // components/Sidebar.jsx
// import { Link, useLocation, useNavigate } from 'react-router-dom';
// import { MdOutlineDashboard } from "react-icons/md";
// import { IoMdImages } from "react-icons/io";
// import { FaGoogleDrive, FaRegUser, FaUser, FaUserPlus } from "react-icons/fa";
// import { CiHome, CiSettings } from "react-icons/ci";
// import { useUser } from '../Context/UserContext';
// import { allowedEmails } from '../../../backend/config/allowedEmail';


// const Sidebar = () => {
//     const { user } = useUser()
//     const location = useLocation()
//     const navigate = useNavigate()
//     return (
//         <div className="w-64 h-full dark:bg-zinc-800 bg-gray-100 flex flex-col gap-6  text-gray-700 dark:text-gray-200 p-6">
//             <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
//             <nav className="flex flex-col gap-6 ">

//                 <Link className={`flex items-center gap-2 text-lg font-roboto  text-gray-400
//                     }`} to="/home"><CiHome size={22} />Home</Link>
//                 {(user?.role === 'admin' || user?.permissions?.includes('MyInfo')) && (
//                     <Link
//                         to="/dashboard/MyInfo"
//                         className={`flex items-center gap-2 text-lg font-roboto  ${location.pathname.endsWith('/MyInfo') ? 'dark:text-white text-blue-500  font-semibold' : 'text-gray-400'
//                             }`}
//                     >
//                         <FaRegUser size={21} />
//                         My Info
//                     </Link>
//                 )}
//                 {(user?.role === 'admin' || user?.permissions?.includes('Overviews')) && (
//                     <Link className={`flex items-center gap-2 text-lg font-roboto  ${location.pathname.endsWith('/Overviews') ? 'dark:text-white text-blue-500  font-semibold' : 'text-gray-400'
//                         }`} to="/dashboard/Overviews"><MdOutlineDashboard size={22} />Overview</Link>
//                 )}

//                 {(user?.role === 'admin' || user?.permissions?.includes('Images')) && (
//                     <Link className={`flex items-center gap-2 text-lg font-roboto  ${location.pathname.endsWith('/Images') ? 'dark:text-white text-blue-500  font-semibold' : 'text-gray-400'
//                         }`} to="/dashboard/Images"><IoMdImages size={22} />Images</Link>
//                 )}
//                 <Link className={`flex items-center gap-2 text-lg font-roboto  ${location.pathname.endsWith('/1st-Email') || location.pathname.endsWith('/2nd-Email') || location.pathname.endsWith('/3rd-Email') ? 'dark:text-white text-blue-500  font-semibold' : 'text-gray-400'
//                     }`} to="/dashboard/ImagesByEmails/1st-Email"><IoMdImages size={22} />Images By Emails</Link>

//                 {(user?.role === 'admin' || user?.permissions?.includes('Requests')) && (
//                     <Link className={`flex items-center gap-2 text-lg font-roboto  ${location.pathname.endsWith('/Permissions-Users') || location.pathname.endsWith('/Add-Users') || location.pathname.endsWith('/Pending-Users') || location.pathname.endsWith('/Approved-Users') || location.pathname.endsWith('/Denied-Users') ? 'dark:text-white text-blue-500  font-semibold' : 'text-gray-400'
//                         }`} to="/dashboard/Requests/Permissions-Users"><FaUserPlus size={22} />Users Managment</Link>
//                 )}





//             </nav>

//         </div>
//     );
// };

// export default Sidebar;


import { NavLink } from 'react-router-dom';
import { MdOutlineDashboard } from "react-icons/md";
import { IoMdImages } from "react-icons/io";
import { FaRegUser, FaUserPlus } from "react-icons/fa";
import { CiHome } from "react-icons/ci";
import { useUser } from '../Context/UserContext';

const Sidebar = () => {
  const { user } = useUser();

  return (
    <div className="w-64 h-full dark:bg-zinc-800 bg-gray-100 flex flex-col gap-6 text-gray-700 dark:text-gray-200 p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <nav className="flex flex-col gap-6">
        {/* Home (always visible) */}
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `flex items-center gap-2 text-lg font-roboto transition-colors ${
              isActive ? 'dark:text-white text-blue-500 font-semibold' : 'text-gray-400 hover:text-blue-400'
            }`
          }
        >
          <CiHome size={22} /> Home
        </NavLink>

        {/* My Info */}
        {(user?.role === 'admin' || user?.permissions?.includes('MyInfo')) && (
          <NavLink
            to="/dashboard/MyInfo"
            className={({ isActive }) =>
              `flex items-center gap-2 text-lg font-roboto transition-colors ${
                isActive ? 'dark:text-white text-blue-500 font-semibold' : 'text-gray-400 hover:text-blue-400'
              }`
            }
          >
            <FaRegUser size={21} /> My Info
          </NavLink>
        )}

        {/* Overview */}
        {(user?.role === 'admin' || user?.permissions?.includes('Overviews')) && (
          <NavLink
            to="/dashboard/Overviews"
            className={({ isActive }) =>
              `flex items-center gap-2 text-lg font-roboto transition-colors ${
                isActive ? 'dark:text-white text-blue-500 font-semibold' : 'text-gray-400 hover:text-blue-400'
              }`
            }
          >
            <MdOutlineDashboard size={22} /> Overview
          </NavLink>
        )}

        {/* Images */}
        {(user?.role === 'admin' || user?.permissions?.includes('Images')) && (
          <NavLink
            to="/dashboard/Images"
            className={({ isActive }) =>
              `flex items-center gap-2 text-lg font-roboto transition-colors ${
                isActive ? 'dark:text-white text-blue-500 font-semibold' : 'text-gray-400 hover:text-blue-400'
              }`
            }
          >
            <IoMdImages size={22} /> Images
          </NavLink>
        )}

        {/* Images By Emails (🔑 condition added) */}
        {(user?.role === 'admin' || user?.permissions?.includes('ImagesByEmails')) && (
          <NavLink
            to="/dashboard/ImagesByEmails/1st-Email"
            className={({ isActive }) =>
              `flex items-center gap-2 text-lg font-roboto transition-colors ${
                isActive ? 'dark:text-white text-blue-500 font-semibold' : 'text-gray-400 hover:text-blue-400'
              }`
            }
          >
            <IoMdImages size={22} /> Images By Emails
          </NavLink>
        )}

        {/* Users Management */}
        {(user?.role === 'admin' || user?.permissions?.includes('Requests')) && (
          <NavLink
            to="/dashboard/Requests/Permissions-Users"
            className={({ isActive }) =>
              `flex items-center gap-2 text-lg font-roboto transition-colors ${
                isActive ? 'dark:text-white text-blue-500 font-semibold' : 'text-gray-400 hover:text-blue-400'
              }`
            }
          >
            <FaUserPlus size={22} /> Users Management
          </NavLink>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
