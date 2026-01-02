import { useState } from "react";
import { Search, Bell } from "lucide-react";
import { useAuth } from "../context/authProvider";
import NotificationDrawer from "../components/Static/NotificationDrawer.jsx";
import NotificationIndicator from "../components/Static/NotificationIndicator.jsx";
import ProfileImage from "../components/Common/ProfileImage.jsx";
import { useUserProfile } from "../hooks/useUserProfile.js";

const TopNavBar = () => {
  const { user } = useAuth();
  const { profileImage, roleName } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-black/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between px-6">
      
      {/* Search Section */}
      <div className="flex items-center w-96 gap-2 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 shadow-sm hover:shadow-md transition-shadow bg-gray-100 dark:bg-gray-800 w-full max-w-2xl">
        <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <input
          type="text"
          placeholder="Search tasks, tickets, or policies..."
          className="bg-transparent border-none shadow-none focus:outline-none focus:ring-0 pl-2 placeholder:text-gray-400 h-9 w-full text-sm text-black dark:text-white"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Date View */}
        <div className="hidden md:flex flex-col text-right">
          <span className="text-sm font-medium text-black dark:text-white">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {/* Notification Button */}
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-blue-600 rounded-full ring-2 ring-white dark:ring-black"></span>
        </button>
        
        {/* Divider */}
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
        
        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium leading-none text-black dark:text-white">
              {user?.name || "Guest"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
              {roleName || "Employee"}
            </p>
          </div>
          
          <div className="h-9 w-9 border border-gray-200 dark:border-gray-700 cursor-pointer transition-transform hover:scale-105 rounded-full overflow-hidden">
            <ProfileImage
              profileImage={profileImage}
              firstName={user?.name?.split(" ")[0]}
              lastName={user?.name?.split(" ")[1]}
              size="sm"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* Notification Drawer */}
      {isOpen && (
        <NotificationDrawer
          isOpen={isOpen}
          setIsOpen={setIsOpen}
        />
      )}
    </header>
  );
};

export default TopNavBar;