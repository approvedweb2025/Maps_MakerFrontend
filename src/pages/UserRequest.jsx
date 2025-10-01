import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { MdDone } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { FaUserAlt } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import toast from 'react-hot-toast';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TbReload } from "react-icons/tb";
const UserRequest = () => {
    const [reload, setReload] = useState(false)
    const location = useLocation()
    const navigate = useNavigate()

    const reloaddisbled = () => {
        setReload(false)
        setTimeout(() => {
            setReload(true)
        }, 2000);
    }

    useEffect(() => {
        reloaddisbled()
        navigate('/dashboard/Requests/Add-Users')
    }, [])


    return (
        <div className="flex flex-col px-4 pt-4 w-full">
            <div className=' flex flex-row items-center justify-between gap-6 p-4 w-full  border-b-[3px] dark:border-zinc-800 border-gray-100 text-gray-700 dark:text-gray-200 '>
                <div className='flex items-center gap-4 lg:text-lg text-sm  lg:text-end text-center'>
                    <Link className={`${location.pathname.endsWith('/Add-Users') ? 'dark:text-gray-100 text-zinc-800 ' : 'text-gray-500'
                        }`} to={'Add-Users'}>Add Users</Link>
                    <Link className={`${location.pathname.endsWith('/Pending-Users') ? 'dark:text-gray-100 text-zinc-800 ' : 'text-gray-500'
                        }`} to={'Pending-Users'}>Pending Users</Link>
                    <Link className={`${location.pathname.endsWith('/Approved-Users') ? 'dark:text-gray-100 text-zinc-800 ' : 'text-gray-500'
                        }`} to={'Approved-Users'}>Approved Users</Link>
                    <Link className={`${location.pathname.endsWith('/Denied-Users') ? 'dark:text-gray-100 text-zinc-800' : 'text-gray-500'
                        } `} to={'Denied-Users'}>Denied  Users</Link>
                        <Link className={`${location.pathname.endsWith('/Permissions-Users') ? 'dark:text-gray-100 text-zinc-800 ' : 'text-gray-500'
                            }`} to={'Permissions-Users'}>Users Controller</Link>
                </div>
                <button onClick={() => { reloaddisbled(); window.location.reload() }} disabled={!reload} to={location.pathname} className={`lg:flex gap-2 lg:text-lg text-sm hidden  items-center cursor-pointer ${reload ? 'dark:text-white text-gray-500' : 'dark:text-gray-500 text-gray-300'}`}>
                    <TbReload />
                    <h2 >Refresh</h2>
                </button>

            </div>

            <div>

                <Outlet />
            </div>

        </div>

    )
}

export default UserRequest
