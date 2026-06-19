import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { useNavigate, useLocation } from "react-router-dom";
import * as MD from "react-icons/md";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

const Sidebar = ({ isOpen, onClose, onOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [navItems, setNavItems] = useState([]);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [isHovered, setIsHovered] = useState(false);

  // On desktop, the sidebar is expanded if it is pinned open OR hovered
  // On mobile, it's expanded only when isOpen is true (and it slides in)
  const isExpandedView = isOpen || isHovered;

  useEffect(() => {
    const fetchNavItems = async () => {
      try {
        const res = await axiosInstance.post("/populate/read/sidebars", { limit: 1000 });
        const items = res.data?.data || [];

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
    // Only allow toggling if sidebar is expanded
    if (!isExpandedView) return;
    
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
      if (isExpandedView) {
        toggleExpanded(item._id);
      } else {
        // If collapsed and has children, maybe open the sidebar automatically
        if (onOpen) onOpen();
      }
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
      <div key={item._id} className="w-full">
        <div
          onClick={() => handleNavigation(item)}
          title={!isExpandedView ? item.title : undefined}
          className={`
            flex items-center gap-2.5 px-2.5 py-2 rounded-tracker-md cursor-pointer
            transition-colors duration-150 mx-2
            ${isChild ? "ml-7 text-xs" : "text-sm"}
            ${
              isActive
                ? "font-semibold text-[var(--module-accent)]"
                : "text-ink-muted hover:text-ink"
            }
          `}
          style={isActive ? { backgroundColor: "var(--module-accent-light)" } : undefined}
        >
          <Icon
            className={`flex-shrink-0 ${isChild ? "text-sm" : "text-lg"}`}
            style={{ color: isActive ? "var(--module-accent)" : "var(--tracker-ink-subtle)" }}
          />
          
          {/* Text and chevron only visible when expanded */}
          <div className={`flex items-center flex-1 overflow-hidden transition-all duration-300 ${isExpandedView ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
            <span className="flex-1 truncate whitespace-nowrap">{item.title}</span>
            {hasChildren && (
              <MD.MdExpandMore
                className={`text-base flex-shrink-0 transition-transform duration-200 text-ink-subtle ${isExpanded ? "rotate-180" : ""}`}
              />
            )}
          </div>
        </div>

        {/* Submenu */}
        <div
          className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${hasChildren && isExpanded && isExpandedView ? 'max-h-96 mt-0.5 opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="space-y-0.5 pb-1">
            {item.children?.map(child => renderNavItem(child, true))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        fixed lg:relative inset-y-0 left-0 z-40
        h-screen flex flex-col flex-shrink-0
        bg-surface border-r border-hairline-soft
        transition-all duration-300 ease-in-out overflow-hidden
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${isExpandedView ? "w-[240px]" : "w-[52px]"}
      `}
    >
      {/* Brand */}
      <div
        className={`flex items-center px-4 h-[60px] border-b border-hairline-soft flex-shrink-0 ${
          isExpandedView ? "justify-between" : "justify-center"
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="h-8 w-8 rounded-tracker-md lmx-gradient-hero flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">W</span>
          </div>
          <span
            className={`font-semibold text-sm text-ink tracking-tight whitespace-nowrap transition-opacity duration-300 ${
              isExpandedView ? "opacity-100" : "opacity-0 hidden"
            }`}
          >
            WorkHub
          </span>
        </div>
        
        {isExpandedView && (
          <>
            <button
              onClick={onClose}
              className="tracker-btn-ghost p-1 lg:block hidden flex-shrink-0"
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="tracker-btn-ghost p-1 lg:hidden flex-shrink-0"
              aria-label="Close sidebar"
            >
              <MD.MdClose className="text-lg" />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {navItems.length === 0 ? (
          <div className="px-3 py-6 flex flex-col items-center gap-2">
            <div className="h-5 w-5 border-2 border-hairline border-t-accent rounded-full animate-spin flex-shrink-0" />
            <p className={`text-xs text-ink-subtle whitespace-nowrap transition-opacity duration-300 ${isExpandedView ? "opacity-100" : "opacity-0 hidden"}`}>Loading menu…</p>
          </div>
        ) : (
          <>
            {navItems.map(item => renderNavItem(item))}
            <div className="my-2 border-t border-hairline-soft mx-2 opacity-50" />
            {renderNavItem({
              _id: "api-docs-static",
              title: "API Docs",
              mainRoute: "/documentations",
              iconName: "MdCode"
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div
        className={`h-12 flex items-center border-t border-hairline-soft flex-shrink-0 ${
          isExpandedView ? "px-4 justify-between" : "justify-center"
        }`}
      >
        <span
          className={`text-[11px] text-ink-subtle whitespace-nowrap transition-opacity duration-300 ${
            isExpandedView ? "opacity-100" : "opacity-0 hidden"
          }`}
        >
          © {new Date().getFullYear()} Portal
        </span>

        {!isOpen && !isExpandedView && (
          <button
            onClick={onOpen}
            className="tracker-btn-ghost p-1.5 hidden lg:block"
            aria-label="Expand sidebar"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>  );
};

export default Sidebar;