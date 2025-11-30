import { useRoutes, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/authProvider.jsx";
import routes from "~react-pages";
import Sidebar from "./Sidebar";
import TopNavBar from "./topNavBar.jsx";
import Login from "../pages/login.jsx";

const BaseLayout = () => {
  const location = useLocation();
  const element = useRoutes(routes);
  const { user, loading } = useAuth();

  // While checking auth state
  if (loading) {
    return <p className="p-4">Loading...</p>;
  }

  // If not logged in → redirect to login
  if (!user && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  // If already logged in → prevent going back to login
  if (user && location.pathname === "/login") {
    return <Navigate to="/dashboard" replace />;
  }

  // Show login page
  if (location.pathname === "/login") {
    return <Login />;
  }

  // Default layout for logged-in users
  return (
    <div className="flex dark:bg-black dark:text-white">
      <Sidebar/>
      <main className="flex-1 max-h-screen overflow-auto bg-gray-300 dark:bg-black">
        <TopNavBar />
        {element}
      </main>
    </div>
  );
};

export default BaseLayout;
