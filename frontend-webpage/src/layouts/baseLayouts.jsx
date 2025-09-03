import Sidebar from "./Sidebar";
import { useRoutes } from "react-router-dom";
import routes from '~react-pages'

const BaseLayout = () => {

    const element = useRoutes(routes);
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-4">{element}</main>
    </div>
  );
};

export default BaseLayout;