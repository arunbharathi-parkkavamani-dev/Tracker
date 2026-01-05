import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/authProvider";

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userDepartment, setUserDepartment] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      
      // Fetch all employees with department info
      const employeesRes = await axiosInstance.get('/populate/read/employees');
      const employees = employeesRes.data.data || [];
      
      // Get current user's department
      const currentUser = employees.find(emp => emp._id === user.id);
      const currentUserDept = currentUser?.professionalInfo?.department;
      setUserDepartment(currentUserDept);
      
      // Group employees by department
      const departmentGroups = employees.reduce((acc, employee) => {
        const dept = employee.professionalInfo?.department;
        const deptName = dept?.name || 'No Department';
        const deptId = dept?._id || 'no-dept';
        
        if (!acc[deptId]) {
          acc[deptId] = {
            id: deptId,
            name: deptName,
            isMyTeam: deptId === currentUserDept?._id,
            members: []
          };
        }
        
        acc[deptId].members.push({
          id: employee._id,
          name: `${employee.basicInfo?.firstName || ''} ${employee.basicInfo?.lastName || ''}`.trim(),
          email: employee.basicInfo?.email,
          designation: employee.professionalInfo?.designation?.name,
          profilePicture: employee.basicInfo?.profilePicture,
          isCurrentUser: employee._id === user.id
        });
        
        return acc;
      }, {});
      
      // Convert to array and sort (user's team first)
      const teamsArray = Object.values(departmentGroups).sort((a, b) => {
        if (a.isMyTeam) return -1;
        if (b.isMyTeam) return 1;
        return a.name.localeCompare(b.name);
      });
      
      setTeams(teamsArray);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Teams
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          View team members organized by departments
        </p>
      </div>

      <div className="space-y-6">
        {teams.map((team) => (
          <div
            key={team.id}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${
              team.isMyTeam ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className={`px-6 py-4 ${
              team.isMyTeam 
                ? 'bg-blue-50 dark:bg-blue-900 border-b border-blue-200 dark:border-blue-700' 
                : 'bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600'
            }`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-semibold ${
                  team.isMyTeam 
                    ? 'text-blue-800 dark:text-blue-200' 
                    : 'text-gray-800 dark:text-white'
                }`}>
                  {team.name}
                  {team.isMyTeam && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
                      My Team
                    </span>
                  )}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                      member.isCurrentUser
                        ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {member.profilePicture ? (
                          <img
                            src={member.profilePicture}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                            member.isCurrentUser ? 'bg-green-500' : 'bg-gray-400'
                          }`}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          member.isCurrentUser 
                            ? 'text-green-800 dark:text-green-200' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {member.name}
                          {member.isCurrentUser && (
                            <span className="ml-1 text-xs text-green-600 dark:text-green-400">
                              (You)
                            </span>
                          )}
                        </p>
                        {member.designation && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {member.designation}
                          </p>
                        )}
                        {member.email && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {member.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">No Teams Found</h3>
          <p className="text-gray-600 dark:text-gray-300">No employees or departments are available.</p>
        </div>
      )}
    </div>
  );
};

export default Teams;