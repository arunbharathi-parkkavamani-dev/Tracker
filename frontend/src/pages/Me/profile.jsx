import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider";

const Profile = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const customPopulate = {
        'professionalInfo.designation': 'title,description',
        'professionalInfo.department': 'name,head',
        'professionalInfo.reportingManager': 'basicInfo.firstName,basicInfo.lastName,basicInfo.email'
      };
      const response = await axiosInstance.get(`/populate/read/employees/${user.id}?populateFields=${encodeURIComponent(JSON.stringify(customPopulate))}`);
      setEmployee(response.data.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading profile...</div>;
  if (!employee) return <div className="p-4">Profile not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl font-bold text-white">
                  {employee.basicInfo?.firstName?.[0]}{employee.basicInfo?.lastName?.[0]}
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {employee.basicInfo?.firstName} {employee.basicInfo?.lastName}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
                {employee.professionalInfo?.designation?.title || "Employee"}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                {employee.professionalInfo?.department?.name || "Department"} • ID: {employee.professionalInfo?.empId || "N/A"}
              </p>
            </div>
            
            <button
              onClick={() => setEditing(!editing)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {editing ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Basic Information */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Basic Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">First Name</label>
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200 dark:border-gray-600">
                    <p className="text-gray-800 dark:text-white font-medium">
                      {employee.basicInfo?.firstName || "Not provided"}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Last Name</label>
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200 dark:border-gray-600">
                    <p className="text-gray-800 dark:text-white font-medium">
                      {employee.basicInfo?.lastName || "Not provided"}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</label>
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200 dark:border-gray-600">
                    <p className="text-gray-800 dark:text-white font-medium">
                      {employee.basicInfo?.email || "Not provided"}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Phone</label>
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200 dark:border-gray-600">
                    <p className="text-gray-800 dark:text-white font-medium">
                      {employee.basicInfo?.phone || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 00-2 2H6a2 2 0 00-2-2V4m8 0H8m0 0v2m0 0V4m0 2v2m0-2h8m-8 2H8" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Professional</h2>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Employee ID</label>
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg border border-blue-200 dark:border-blue-700">
                    <p className="text-blue-800 dark:text-blue-200 font-bold">
                      {employee.professionalInfo?.empId || "Not assigned"}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Department</label>
                  <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg border border-green-200 dark:border-green-700">
                    <p className="text-green-800 dark:text-green-200 font-medium">
                      {employee.professionalInfo?.department?.name || "Not assigned"}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Designation</label>
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg border border-purple-200 dark:border-purple-700">
                    <p className="text-purple-800 dark:text-purple-200 font-medium">
                      {employee.professionalInfo?.designation?.title || "Not assigned"}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date of Joining</label>
                  <div className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-lg border border-orange-200 dark:border-orange-700">
                    <p className="text-orange-800 dark:text-orange-200 font-medium">
                      {employee.professionalInfo?.doj 
                        ? new Date(employee.professionalInfo.doj).toLocaleDateString()
                        : "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;