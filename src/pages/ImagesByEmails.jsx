import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { MdDone } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { FaGoogleDrive, FaUserAlt } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import toast from 'react-hot-toast';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TbReload } from "react-icons/tb";
import { useUser } from '../Context/UserContext';
import { allowedEmails } from '../../../backend/config/allowedEmail';

const ImagesByEmails = () => {
    const location = useLocation()
    const { user } = useUser()
    const navigate = useNavigate()


    useEffect(() => {
        navigate('/dashboard/ImagesByEmails/1st-Email')
    }, [])



    return (
        <div className="flex flex-col px-4 pt-4 w-full">
            <div className=' flex lg:flex-row flex-col-reverse items-center justify-between gap-6 p-4 w-full  border-b-[3px] dark:border-zinc-800 border-gray-100 text-gray-700 dark:text-gray-200 '>
                <div className='flex items-center gap-4 lg:text-lg text-sm  lg:text-end text-center'>
                    <Link className={`${location.pathname.endsWith('/1st-Email') ? 'dark:text-gray-100 text-zinc-800 ' : 'text-gray-500'
                        }`} to={'1st-Email'}>1st Email</Link>
                    <Link className={`${location.pathname.endsWith('/2nd-Email') ? 'dark:text-gray-100 text-zinc-800 ' : 'text-gray-500'
                        }`} to={'2nd-Email'}>2nd Email</Link>
                    <Link className={`${location.pathname.endsWith('/3rd-Email') ? 'dark:text-gray-100 text-zinc-800 ' : 'text-gray-500'
                        }`} to={'3rd-Email'}>3rd Email</Link>

                </div>
                {
                    allowedEmails.includes(user.email) && (
                        <Link to={`${import.meta.env.VITE_BASE_URL}/auth/google`} className='flex items-center justify-center gap-3 px-2 py-2 rounded border-2 w-fit dark:border-white border-zinc-800 uppercase hover:bg-gray-100/10 transition-all ease-in 100 '><FaGoogleDrive /> Get Images From Google Drive</Link>
                    )
                }

            </div>

            <div>

                <Outlet />
            </div>

        </div>

    )
}

export default ImagesByEmails