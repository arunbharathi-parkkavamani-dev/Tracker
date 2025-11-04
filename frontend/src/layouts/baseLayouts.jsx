import Sidebar from "./Sidebar";
import { useRoutes, useLocation, Navigate } from "react-router-dom";
import Login from "../pages/login.jsx";
import routes from "~react-pages";
import { useAuth } from "../context/authProvider.jsx";
import TopNavBar from "./topNavBar.jsx";

const BaseLayout = () => {
  const location = useLocation();
  const element = useRoutes(routes);
  const { user, loading } = useAuth();

  // While checking auth state
  if (loading) {
    return <p className="p-4">Loading...</p>;
  }

  // If not logged in → only allow login & register
  console.log(user)
  if (!user && location.pathname !== "/login" && location.pathname !== "/register") {
    return <Navigate to="/login" replace />;
  }

  // If already logged in → prevent going back to login/register
  if (user && (location.pathname === "/login" || location.pathname === "/register")) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show login/register normally
  if (location.pathname === "/login" || location.pathname === "/register") {
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
