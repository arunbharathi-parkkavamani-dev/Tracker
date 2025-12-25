import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import * as MD from "react-icons/md"; // all material icons

// Fallback navigation items
const fallbackNavItems = [
  { _id: '1', title: 'Dashboard', mainRoute: '/dashboard', icon: { iconName: 'MdDashboard' } },
  { _id: '2', title: 'Tasks', mainRoute: '/tasks', icon: { iconName: 'MdTask' } },
  { _id: '3', title: 'Employees', mainRoute: '/employees', icon: { iconName: 'MdPeople' } },
  { _id: '4', title: 'Attendance', mainRoute: '/attendance', icon: { iconName: 'MdSchedule' } },
  { _id: '5', title: 'Leaves', mainRoute: '/leaves', icon: { iconName: 'MdEventBusy' } },
  { _id: '6', title: 'Clients', mainRoute: '/clients', icon: { iconName: 'MdBusiness' } },
  { _id: '7', title: 'Reports', mainRoute: '/reports', icon: { iconName: 'MdAssessment' } }
];

const Sidebar = () => {
  const navigate = useNavigate();
  const [navItems, setNavItems] = useState(fallbackNavItems);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchNavItems = async () => {
      try {
        const response = await axiosInstance.get("/populate/read/sidebars");
        if (response.data.success && response.data.data?.length > 0) {
          setNavItems(response.data.data);
        }
      } catch (error) {
        // Keep fallback items if API fails
      }
    };

    fetchNavItems();
  }, []);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-2 rounded-md"
      >
        <MD.MdMenu size={24} />
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 lg:w-52 h-screen bg-blue-600 shadow-lg p-4 dark:bg-blue-900 text-white
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Close button for mobile */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 right-4 text-white"
        >
          <MD.MdClose size={24} />
        </button>

        {navItems.length > 0 ? (
          <ul className="space-y-2 dark:text-white mt-12 lg:mt-0">
            {navItems.map((item) => {
              // Dynamically pick the icon
              const Icon = MD[item.icon?.iconName] || MD.MdHelpOutline;
              return (
                <li
                  key={item._id}
                  className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-blue-400 transition dark:text-white"
                >
                  <button
                    onClick={() => {
                      navigate(item.route);
                      setIsOpen(false); // Close mobile menu after navigation
                    }}
                    className="flex items-center gap-3 w-full text-left"
                  >
                    <Icon className="text-xl text-white dark:text-white flex-shrink-0" />
                    <span className="text-white font-medium dark:text-white truncate">
                      {item.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-500 mt-12 lg:mt-0">Loading...</p>
        )}
      </div>
    </>
  );
};

export default Sidebar;
