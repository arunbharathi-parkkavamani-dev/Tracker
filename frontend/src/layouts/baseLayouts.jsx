import { useRoutes, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/authProvider.jsx";
import routes from "~react-pages";
import Sidebar from "./Sidebar";
import TopNavBar from "./topNavBar.jsx";
import Login from "../pages/login.jsx";
import { useState, useEffect } from "react";

const BaseLayout = () => {
  const location = useLocation();
  const element = useRoutes(routes);
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auto-collapse on mobile
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)");
    const handler = (e) => setSidebarOpen(!e.matches);
    handler(mql);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Close mobile overlay on navigation
  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] text-ink-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  if (user && location.pathname === "/login") {
    return <Navigate to="/dashboard" replace />;
  }

  if (location.pathname === "/login") {
    return <Login />;
  }

  return (
    <div className="lmx-app-shell">
      {sidebarOpen && (
        <div
          className="fixed inset-0 tracker-overlay z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />

      <div
        className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300"
        style={{ marginLeft: 0 }}
      >
        <TopNavBar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} sidebarOpen={sidebarOpen} />
        <main className="flex-1 overflow-y-auto bg-canvas">
          <div className="lmx-content">{element}</div>
        </main>
      </div>
    </div>
  );
};

export default BaseLayout;
