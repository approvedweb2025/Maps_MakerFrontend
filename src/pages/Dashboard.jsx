// pages/Dashboard.jsx
import { Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Overview from './Overview';
import UserRequest from './UserRequest';
import Images from './Images';
import Settings from './Settings';

const Dashboard = () => {
    return (
        <div className="flex bg-white dark:bg-zinc-900">
            <div className="hidden lg:block">
                <Sidebar />
            </div>
            <div className="flex-1  bg-white dark:bg-zinc-900 	text-gray-700 dark:text-gray-200 min-h-screen">
                <Outlet />
            </div>
        </div>
    );
};

export default Dashboard;
