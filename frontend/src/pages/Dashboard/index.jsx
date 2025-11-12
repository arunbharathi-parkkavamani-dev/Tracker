import ThemeToggler from "../../components/Common/ThemeToggler";
const Dashboard = () => {
  return (
    <div className="flex align-middle justify-center h-screen items-center">
      <h1 className="text-2xl flex align-middle justify-center">
        This is Dashboard Page
      </h1>
      {/* Dark mode and light mode updater */}
      <div>
        <ThemeToggler />
      </div>
    </div>
  );
};

export default Dashboard;
