import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IoMdArrowDropdown, IoMdImages } from "react-icons/io";
import { IoIosLogOut } from "react-icons/io";
import { IoClose } from "react-icons/io5";
import { MdOutlineDashboard } from 'react-icons/md';
import { FaUserPlus } from 'react-icons/fa';
import { useUser } from '../Context/UserContext';
import { RxHamburgerMenu } from "react-icons/rx";
import { useMap } from '../Context/MapContext';

const Navbar = ({ darkMode, setDarkMode }) => {
    const location = useLocation();
    const [LoginPage, setLoginPage] = useState(false);
    const [searchActive, setSearchActive] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const token = localStorage.getItem('token');
    const navigate = useNavigate();
    const [admin, setAdmin] = useState('');
    const [showmenu, setShowmenu] = useState(false);
    const { logout, user, loading } = useUser();
    const { setMapCenter, setMapZoom } = useMap();

    useEffect(() => {
        setLoginPage(location.pathname === '/login');
    }, [location.pathname]);

    const handleLogout = async () => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/logout`);
            if (response.status === 200) {
                localStorage.removeItem('token');
                navigate('/login');
                logout();
            }
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    useEffect(() => {
        if (user?.name) {
            const checkAdmin = async () => {
                try {
                    const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/getadmin`, {
                        username: user.name,
                    });
                    if (response.status === 200) {
                        setAdmin(response.data);
                    }
                } catch (err) {
                    console.error(err.message);
                }
            };
            checkAdmin();
        }
    }, [user]);

    const handleSearchChange = async (e) => {
        const query = e.target.value;
        setSearchTerm(query);

        if (!query.trim()) {
            setSuggestions([]);
            return;
        }

        try {
            const geoApiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&components=country:PK&key=${import.meta.env.VITE_GEOCODING_API_KEY}`;
            const response = await axios.get(geoApiUrl);
            const results = response.data.results;
            const places = results.map(item => item.formatted_address);
            setSuggestions(places);
        } catch (error) {
            console.error("Geocoding error:", error);
            setSuggestions([]);
        }
    };

    return (
        <div className="w-full flex flex-col bg-white border-b-2 border-gray-200 dark:bg-zinc-900 items-center justify-between shadow-lg">
            <div className='w-full py-3 px-3 sm:px-4 flex lg:gap-6 gap-2 items-center justify-between'>
                {/* Left Hamburger Menu */}
                <div>
                    {token && (
                        <div className="relative">
                            <div className='flex items-center gap-5 text-gray-400'>
                            <h1
                                onClick={() => setShowmenu(!showmenu)}
                                className="font-inter text-xs sm:text-sm md:text-base lg:text-lg flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                <RxHamburgerMenu size={22} className='mr-1' />
                            </h1>
                            <Link className='lg:flex gap-2 hover:text-white items-center hidden' to={'/dashboard'}><MdOutlineDashboard />DASHBOARD</Link>

                            </div>

                            {showmenu && (
                                <div className="absolute rounded-md left-0 shadow-lg bg-gray-100 dark:bg-zinc-800 w-40 sm:w-48 px-3 py-2 flex flex-col gap-4 text-gray-700 dark:text-gray-200 font-inter z-50 text-sm">
                                    <div className="flex items-center justify-end">
                                        <IoClose onClick={() => setShowmenu(false)} className="cursor-pointer hover:text-gray-600" size={20} />
                                    </div>
                                    <h1 className=' text-lg'>{user?.name}</h1>
                                    <Link onClick={() => setShowmenu(false)} to="/home" className="hover:text-gray-600 lg:hidden border-b border-gray-400">Home</Link>
                                    {(user?.role === 'admin' || user?.permissions?.includes('Dashboard')) && (
                                        <Link  onClick={() => setShowmenu(false)}  to="/dashboard" className="hover:text-gray-600 lg:hidden border-b border-gray-400">Dashboard</Link>
                                    )}
                                    {(user?.role === 'admin' || user?.permissions?.includes('Overviews')) && (
                                        <Link onClick={() => setShowmenu(false)}  to="/dashboard/Overviews" className="hover:text-gray-600 lg:hidden border-b border-gray-400">Overview</Link>
                                    )}
                                    {(user?.role === 'admin' || user?.permissions?.includes('Images')) && (
                                        <Link onClick={() => setShowmenu(false)}  to="/dashboard/Images" className="hover:text-gray-600 border-b lg:hidden border-gray-400">Images</Link>
                                    )}
                                    {(user?.role === 'admin' || user?.permissions?.includes('ImagesByEmails')) && (
                                        <Link onClick={() => setShowmenu(false)}  to="/dashboard/ImagesByEmails/1st-Email" className="hover:text-gray-600 border-b lg:hidden border-gray-400">ImagesByEmails</Link>
                                    )}
                                    {(user?.role === 'admin' || user?.permissions?.includes('Requests')) && (
                                        <Link onClick={() => setShowmenu(false)}  to="/dashboard/Requests/Permissions-Users" className="hover:text-gray-600 lg:hidden border-b border-gray-400">User Requests</Link>
                                    )}
                                    <button
                                        onClick={() => { setShowmenu(false); handleLogout(); }}
                                        className="bg-blue-500 rounded-md flex items-center gap-2 py-2 px-3 text-white hover:bg-blue-600 transition"
                                    >
                                        Logout <IoIosLogOut size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Middle: Search Box */}
                {location.pathname.endsWith('/home') && (
                    <div className="relative dark:bg-zinc-800 bg-gray-300 rounded-xl px-4 py-4 w-full dark:text-white">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => setSearchActive(true)}
                            onBlur={() => setTimeout(() => setSearchActive(false), 200)} // Delay to allow click
                            className="bg-transparent w-full h-full outline-none"
                            placeholder="Search Places"
                        />
                        {searchActive && suggestions.length > 0 && (
                            <div className="absolute mt-1 rounded-b-xl px-3 py-2 flex flex-col gap-2 left-0 right-0 dark:bg-zinc-800 dark:text-white text-black bg-white z-10 max-h-60 overflow-y-auto">
                                {suggestions.map((place, index) => (
                                    <div
                                        key={index}
                                        onClick={async () => {
                                            setSearchTerm(place);
                                            try {
                                                const geoRes = await axios.get(
                                                    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(place)}&key=${import.meta.env.VITE_GEOCODING_API_KEY}`
                                                );
                                                const location = geoRes.data.results[0].geometry.location;

                                                // First set center immediately
                                                setMapCenter({ lat: location.lat, lng: location.lng });

                                                // Then set zoom after slight delay to allow smooth render
                                                setTimeout(() => {
                                                    setMapZoom(18); // Zoom-in
                                                }, 100); // 100ms is usually enough
                                            } catch (err) {
                                                console.error("Error fetching coordinates:", err);
                                            }
                                        }}

                                        className="cursor-pointer hover:bg-gray-200 dark:hover:bg-zinc-700 p-2 rounded"
                                    >
                                        {place}
                                    </div>
                                ))}

                            </div>
                        )}
                    </div>
                )}

                {/* Right: Dark Mode & Auth */}
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className={`w-12 sm:w-14 h-7 sm:h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${darkMode ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                        <div
                            className={`w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${darkMode ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'}`}
                        ></div>
                    </button>

                    {!token && (
                        LoginPage ? (
                            <Link to="/" className="bg-blue-500 py-2 sm:py-3 px-3 sm:px-4 text-white text-xs sm:text-sm md:text-base rounded hover:bg-blue-600 transition-all">
                                Register
                            </Link>
                        ) : (
                            <Link to="/login" className="bg-blue-500 py-2 sm:py-3 px-3 sm:px-4 text-white text-xs sm:text-sm md:text-base rounded hover:bg-blue-600 transition-all">
                                Login
                            </Link>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default Navbar;