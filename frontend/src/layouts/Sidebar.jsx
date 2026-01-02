import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { useNavigate, useLocation } from "react-router-dom";
import * as MD from "react-icons/md";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [navItems, setNavItems] = useState([]);

  useEffect(() => {
    const fetchNavItems = async () => {
      try {
        const res = await axiosInstance.get("/populate/read/sidebars");
        setNavItems(res.data?.data || []);
      } catch (err) {
        console.error("Sidebar fetch failed", err);
      }
    };

    fetchNavItems();
  }, []);

  return (
    <aside className="w-60 h-screen bg-blue-700 dark:bg-blue-950 
                      text-white flex flex-col border-r border-blue-800">

      {/* -------- Brand / Logo -------- */}
      <div className="px-4 py-5 text-xl font-semibold tracking-wide">
        LMX<span className="text-blue-300">Tracker</span>
      </div>

      {/* -------- Navigation -------- */}
      <nav className="flex-1 px-2 space-y-1">
        {navItems.length === 0 ? (
          <p className="text-blue-200 text-sm px-2">Loading…</p>
        ) : (
          navItems.map(item => {
            const Icon = MD[item.icon?.iconName] || MD.MdHelpOutline;
            const isActive = location.pathname === item.route;

            return (
              <div
                key={item._id}
                onClick={() => navigate(item.route)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
                  transition-all
                  ${isActive
                    ? "bg-blue-600 text-white shadow-inner"
                    : "text-blue-100 hover:bg-blue-600/70"}
                `}
              >
                <Icon className="text-lg" />
                <span className="text-sm font-medium">
                  {item.title}
                </span>
              </div>
            );
          })
        )}
      </nav>

      {/* -------- Footer (optional but 🔥) -------- */}
      <div className="px-4 py-3 text-xs text-blue-300 border-t border-blue-800">
        © {new Date().getFullYear()} LMX
      </div>
    </aside>
  );
};

export default Sidebar;