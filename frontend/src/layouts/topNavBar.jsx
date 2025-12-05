import {useAuth} from "../context/authProvider";
import {useState} from "react";
import "../assets/profileImg.png";
import NotificationDrawer from "../components/Static/NotificationDrawer.jsx"
import NotificationIndicator from "../components/Static/NotificationIndicator.jsx";
import ProfileImage from "../components/Common/ProfileImage.jsx";
import { useUserProfile } from "../hooks/useUserProfile.js";


const TopNavBar = () =>{
    const {user} = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const { profileImage } = useUserProfile();
    // const {notifications} = useNotification();

    return(
        <nav className="bg-blue-900 text-white dark:bg-blue-800 dark:text-white w-full shadow-md">
            <div className="flex justify-between p-4 space-x-4">
                <div className="text-2xl font-bold ">
                    Logimax Technologies
                </div>
                <div className="flex items-center space-x-4">
                    {/* Notification Icon */}
                    <div className="relative">
                        <button onClick={() => setIsOpen(prev => !prev)} className="relative focus:outline-none">
                        <NotificationIndicator />
                        </button>
                        {isOpen && <NotificationDrawer isOpen={isOpen} setIsOpen={setIsOpen} />}
                    </div>
                    {/* User Info */}
                    <div className="flex items-center space-x-2">
                        <span className="font-medium">{user?.name || "Guest"}</span>
                        <ProfileImage 
                            profileImage={profileImage}
                            firstName={user?.name?.split(' ')[0]}
                            lastName={user?.name?.split(' ')[1]}
                            size="xs"
                        />
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default TopNavBar;