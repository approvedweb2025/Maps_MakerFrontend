import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { MdDone } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { FaUserAlt } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import toast from 'react-hot-toast';
import { Link, Outlet } from 'react-router-dom';



const DeniedUsers = () => {
    const [requests, setRequests] = useState([])
    const getDeniedUser = async () => {
        try {

            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/users/denied-request`, {}, {});

            if (response.status == 200) {
                setRequests(response.data.requests)
            }
        } catch (error) {
            console.error(" failed to Fetch Pending Users:", error);
        }

    }

    useEffect(() => {
        getDeniedUser()

    }, [])
    const handleUserStatus = async (Id, status) => {
        try {

            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/status`, {
                Id,
                status
            });

            if (response.status == 200) {
                toast.success(`Status ${status} successfully`)
                getDeniedUser();
            }



        } catch (err) {
            console.error(err)
        }
    }
    return (
        <div>
            {

                requests.length > 0 ? (
                    requests.map((item, index) => (
                        <div
                            key={index}
                            className="w-full rounded-md flex flex-row  sm:items-center justify-between px-4 py-3 mb-4 bg-gray-200 dark:bg-zinc-800 gap-4"
                        >
                            <div className="flex lg:flex-row flex-col     items-start  i gap-4 flex-wrap">
                                <h3 className='text-red-500 p-2 rounded-md bg-red-500/20 text-sm'>Denied</h3>

                                <div className="flex items-center gap-2 text-roboto uppercase">
                                    <FaUserAlt size={20} />
                                    {item.name || 'No Name'}
                                </div>
                                <div className="flex items-center gap-2 text-roboto break-all">
                                    <MdEmail size={20} />
                                    {item.email || 'No Email'}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div
                                    onClick={() => {
                                        handleUserStatus(item._id, 'approved');
                                    }}
                                    className="cursor-pointer text-green-500 rounded-full p-2 text-xl dark:hover:bg-zinc-700 hover:bg-zinc-300 dark:bg-zinc-900 bg-white"
                                >
                                    <MdDone size={24} />
                                </div>

                            </div>
                        </div>
                    ))
                ) : (
                    <div className='h-screen w-full flex flex-col items-center justify-center'>
                                  <img src='../../src/no-found.png' alt="Requests Not Founded" />
                        <h1 className='lg:text-3xl text-xl font-roboto'>No Requests Found</h1>
                    </div>
                )
            }
        </div>
    )
}

export default DeniedUsers
