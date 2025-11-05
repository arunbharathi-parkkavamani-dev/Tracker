import {useAuth} from "../context/authProvider";
import {useState} from "react";
import "../../public/profileImg.png";
import NotificationDrawer from "../components/NotificationDrawer.jsx";
import NotificationIndicator from "../components/NotificationIndicator.jsx";


const TopNavBar = () =>{
    const {user} = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    // const {notifications} = useNotification();

    return(
        <nav className="bg-blue-900 text-white dark:bg-blue-800 dark:text-white w-full shadow-md">
            <div className="flex justify-between p-4 space-x-4">
                <div className="text-2xl font-bold ">
                    Logimax Technologies
                </div>
                <div className="flex items-center space-x-4">
                    {/* Date Display */}
                    <div className="">
                        {new Date().toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
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
                        <img
                            src={user?.profilePicture || "../../public/profileImg.png"}
                            alt="User Avatar"
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default TopNavBar;