import { useState } from "react";
import { Search } from "lucide-react";
import { useAuth } from "../context/authProvider";
import NotificationDrawer from "../components/Static/NotificationDrawer.jsx";
import NotificationIndicator from "../components/Static/NotificationIndicator.jsx";
import ProfileImage from "../components/Common/ProfileImage.jsx";
import { useUserProfile } from "../hooks/useUserProfile.js";

const TopNavBar = () => {
  const { user } = useAuth();
  const { profileImage } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="w-full bg-white dark:bg-zinc-900
                       border-b border-gray-200 dark:border-zinc-800">

      <div className="flex items-center justify-between px-6 py-3 gap-6">

        {/* -------- Search (calm, primary) -------- */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2
                         text-gray-400"
            />
            <input
              type="text"
              placeholder="Search tasks, tickets, or policies..."
              className="w-full pl-10 pr-4 py-2 text-sm
                         rounded-lg border border-gray-300
                         dark:border-zinc-700
                         dark:bg-zinc-800 dark:text-white
                         placeholder:text-gray-400
                         focus:outline-none focus:ring-2
                         focus:ring-blue-500"
            />
          </div>
        </div>

        {/* -------- Right: Notifications + User -------- */}
        <div className="flex items-center gap-5">

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(prev => !prev)}
              className="focus:outline-none"
            >
              <NotificationIndicator />
            </button>

            {isOpen && (
              <NotificationDrawer
                isOpen={isOpen}
                setIsOpen={setIsOpen}
              />
            )}
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight hidden sm:block">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {user?.name || "Guest"}
              </p>
              <p className="text-xs text-gray-500">
                {user?.role || "Employee"}
              </p>
            </div>

            <ProfileImage
              profileImage={profileImage}
              firstName={user?.name?.split(" ")[0]}
              lastName={user?.name?.split(" ")[1]}
              size="sm"
            />
          </div>

        </div>
      </div>
    </header>
  );
};

export default TopNavBar;