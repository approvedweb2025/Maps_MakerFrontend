import { useGSAP } from '@gsap/react'
import axios from 'axios'
import gsap from 'gsap'
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { FaEye, FaEyeSlash, FaUser } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../Context/UserContext';

const Login = () => {
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [showpassword, setShowpassword] = useState(false)
    const navigate = useNavigate()
    const { login, user } = useUser();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !password) {
            toast.error('Please fill all fields');
            return;
        }

        try {
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/login`, {
                name,
                password,
            });

            if (response.status === 200) {
                const userData = response.data.user;
                toast.success('User Login successfully');
                login(response.data.token);
                setName('');
                setPassword('');
                navigate('/home');
            }
        } catch (error) {
            toast.error(error.response?.data?.message)
        }
    };

    useGSAP(() => {
        gsap.fromTo(
            '.box',
            { y: 100, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: 'power2.out' }
        );
    }, []);



    return (
        <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
            {/* Left Side */}
            <div className="hidden lg:flex w-1/2 relative  bg-white dark:bg-zinc-900 overflow-hidden">
                <div className="absolute inset-0 -skew-x-12 w-[110%] bg-blue-500 top-[-120px] left-[-144px]"></div>

                <div className="box text-xl relative w-full flex flex-col text-center items-center justify-center  z-10 text-black dark:text-white p-8 font-bold ">
                    <h1 className="text-5xl uppercase font-bold mb-4 text-center">Welcome Back</h1>
                    <p className="text-gray-600 w-[70%] text-lg dark:text-white mb-6  text-center">
                        Log in to access your geo-tagged photo dashboard and location-based insights.
                    </p>

                </div>

            </div>

            {/* Right Side (Form) */}
            <div className="w-full lg:w-1/2 h-full flex flex-col gap-4 justify-center items-center  px-4 py-12 bg-white dark:bg-zinc-900">
                <h1 className="text-gray-700 dark:text-gray-200 text-3xl md:text-4xl font-poppins uppercase mb-8 text-center">
                    Login Here
                </h1>

                <form
                    onSubmit={(e) => { handleSubmit(e) }}
                    className=" w-full max-w-md flex flex-col gap-6 "
                >
                    {/* Username */}
                    <div className="flex items-center text-gray-700 dark:text-gray-200 border-b border-gray-700 dark:border-gray-200  focus-within:border-blue-600 transition	 px-2">
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            type="text"
                            placeholder="Username"
                            autoComplete='username'
                            className="flex-1 p-3 bg-transparent outline-none font-roboto  placeholder-gray-700 dark:placeholder-gray-200"
                        />
                        <FaUser size={20} />
                    </div>



                    {/* Password */}
                    <div className="flex items-center text-gray-700 dark:text-gray-200 border-b border-gray-700 dark:border-gray-200 focus-within:border-blue-600 transition px-2">
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type={showpassword ? 'text' : 'password'}
                            placeholder="Password"
                            className="flex-1 p-3 bg-transparent outline-none font-roboto placeholder-gray-700 dark:placeholder-gray-200"
                            autoComplete="current-password" // ✅ Add this line
                        />
                        {showpassword ? (
                            <FaEyeSlash size={20} className="cursor-pointer" onClick={() => setShowpassword(false)} />
                        ) : (
                            <FaEye size={20} className="cursor-pointer" onClick={() => setShowpassword(true)} />
                        )}
                    </div>


                    {/* Submit */}
                    <button
                        type="submit"
                        className="bg-blue-500 text-white py-3 font-inter rounded uppercase font-semibold hover:bg-blue-600 transition"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Login
