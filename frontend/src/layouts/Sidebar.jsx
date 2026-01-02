import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { useNavigate, useLocation } from "react-router-dom";
import * as MD from "react-icons/md";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [navItems, setNavItems] = useState([]);
  const [expandedItems, setExpandedItems] = useState(new Set());

  useEffect(() => {
    const fetchNavItems = async () => {
      try {
        const res = await axiosInstance.get("/populate/read/sidebars?limit=1000");
        const items = res.data?.data || [];
        
        // Build hierarchical structure with proper ordering
        const parents = items
          .filter(item => item.isParent || !item.parentId)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        const children = items.filter(item => item.parentId);
        
        const hierarchical = parents.map(parent => ({
          ...parent,
          children: children
            .filter(child => child.parentId === parent.mainRoute?.replace('/', '') || child.parentId === parent._id)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
        }));
        
        setNavItems(hierarchical);
      } catch (err) {
        console.error("Sidebar fetch failed", err);
      }
    };

    fetchNavItems();
  }, []);

  const toggleExpanded = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.clear();
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleNavigation = (item) => {
    if (item.hasChildren) {
      toggleExpanded(item._id);
    } else {
      navigate(item.mainRoute);
    }
  };

  const renderNavItem = (item, isChild = false) => {
    const Icon = MD[item.icon?.iconName] || MD.MdHelpOutline;
    const isActive = location.pathname === item.mainRoute;
    const isExpanded = expandedItems.has(item._id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item._id}>
        <div
          onClick={() => handleNavigation(item)}
          className={`
            flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
            transition-all
            ${isChild ? 'ml-6 text-xs' : 'text-sm'}
            ${isActive
              ? "bg-gray-700 text-white shadow-inner"
              : "text-gray-300 hover:bg-gray-700/70"}
          `}
        >
          <Icon className={isChild ? "text-base" : "text-lg"} />
          <span className="font-medium flex-1">
            {item.title}
          </span>
          {hasChildren && (
            <MD.MdExpandMore 
              className={`text-lg transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`} 
            />
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children.map(child => renderNavItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-60 h-screen bg-gray-900 dark:bg-gray-950 
                      text-white flex flex-col border-r border-gray-700">

      {/* -------- Brand / Logo -------- */}
      <div className="px-4 py-5 text-xl font-semibold tracking-wide">
        LMX<span className="text-gray-300">Tracker</span>
      </div>

      {/* -------- Navigation -------- */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.length === 0 ? (
          <p className="text-gray-400 text-sm px-2">Loading…</p>
        ) : (
          navItems.map(item => renderNavItem(item))
        )}
      </nav>

      {/* -------- Footer (optional but 🔥) -------- */}
      <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-700">
        © {new Date().getFullYear()} LMX
      </div>
    </aside>
  );
};

export default Sidebar;