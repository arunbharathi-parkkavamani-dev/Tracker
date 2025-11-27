import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import * as MD from "react-icons/md"; // all material icons

const Sidebar = () => {
  const navigate = useNavigate();
  const [navItems, setNavItems] = useState([]);

  useEffect(() => {
    const fetchNavItems = async () => {
      try {
        const response = await axiosInstance.get("/populate/read/sidebars");
        // your API returns { success, count, data: [...] }
        setNavItems(response.data.data || []); 
      } catch (error) {
        console.error("Error fetching nav items:", error);
      }
    };

    fetchNavItems();
  }, []);

  return (
    <div className="w-52 h-screen bg-blue-600 shadow-lg p-4 dark:bg-blue-900 text-white">
      {navItems.length > 0 ? (
        <ul className="space-y-2 dark:text-white">
          {navItems.map((item) => {
            // Dynamically pick the icon
            const Icon = MD[item.icon?.iconName] || MD.MdHelpOutline;
            return (
              <li
                key={item._id}
                onClick={() => navigate(item.route)}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-blue-400 transition dark:text-white"
              >
                <Icon className="text-xl text-white dark:text-white" />
                <span className="text-white font-medium dark:text-white">
                  {item.title}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-gray-500">Loading...</p>
      )}
    </div>
  );
};

export default Sidebar;
