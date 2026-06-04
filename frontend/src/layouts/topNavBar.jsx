import { useState } from "react";
import { Search, Bell, Menu } from "lucide-react";
import { useAuth } from "../context/authProvider";
import NotificationDrawer from "../components/Static/NotificationDrawer.jsx";
import ProfileImage from "../components/Common/ProfileImage.jsx";
import { useUserProfile } from "../hooks/useUserProfile.js";

const TopNavBar = ({ onToggleSidebar, sidebarOpen }) => {
  const { user } = useAuth();
  const { profileImage, roleName } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header
      className="h-14 border-b border-hairline-soft bg-surface sticky top-0 z-20 flex items-center justify-between px-4 gap-3 flex-shrink-0"
      style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
    >

      {/* Left: hamburger + search */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-tracker-sm text-ink-muted hover:bg-canvas hover:text-ink transition-colors flex-shrink-0"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search */}
        <div className="hidden sm:flex items-center gap-2 border border-hairline rounded-tracker-md px-3 bg-canvas/50 flex-1 max-w-lg">
          <Search className="h-3.5 w-3.5 text-ink-subtle" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-ink-subtle h-8 w-full text-[13px] text-ink"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Date — hidden on small */}
        <div className="hidden lg:flex flex-col text-right mr-1">
          <span className="text-[12px] font-medium text-ink">
            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="text-[11px] text-ink-subtle">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Mobile search */}
        <button className="sm:hidden p-1.5 rounded-tracker-sm text-ink-muted hover:bg-canvas transition-colors">
          <Search className="h-4.5 w-4.5" />
        </button>

        {/* Notifications */}
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="relative p-1.5 rounded-tracker-sm text-ink-muted hover:bg-canvas hover:text-ink transition-colors"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-[#c41c1c] rounded-full ring-2 ring-white" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-hairline-soft" />

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden md:block">
            <p className="text-[13px] font-medium leading-none text-ink">
              {user?.name || "Guest"}
            </p>
            <p className="text-[11px] text-ink-subtle mt-0.5 capitalize">
              {roleName || "Employee"}
            </p>
          </div>
          <div className="h-8 w-8 rounded-full overflow-hidden ring-1 ring-hairline cursor-pointer hover:ring-accent transition-all">
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