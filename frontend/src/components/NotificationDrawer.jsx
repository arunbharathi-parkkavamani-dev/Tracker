/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from "react";
import { useNotification } from "../context/notificationProvider";

const NotificationDrawer = ({ isOpen, setIsOpen }) => {
  const { notifications, markAsRead } = useNotification();
  const drawerRef = useRef(null);

  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      ref={drawerRef}
      className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl shadow-lg max-h-96 overflow-y-auto z-50"
    >
      {notifications.length === 0 ? (
        <p className="p-4 text-center text-gray-500">No notifications</p>
      ) : (
        notifications.map((notif) => (
          <div
            key={notif._id}
            onClick={() => markAsRead(notif._id)}
            className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
              notif.read
                ? "font-normal text-black dark:text-white"
                : "font-semibold bg-blue-50 dark:bg-gray-700"
            }`}
          >
            <p className="line-clamp-2 text-sm leading-snug break-words">{notif.message}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default NotificationDrawer;
