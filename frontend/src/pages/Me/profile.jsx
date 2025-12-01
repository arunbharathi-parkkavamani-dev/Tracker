import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider";
import FormRenderer from "../../components/Common/FormRenderer";
import { profileFormFields, profileSubmitButton } from "../../constants/profileForm";
import toast from "react-hot-toast";

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
        'professionalInfo.role': 'name',
        'professionalInfo.reportingManager': 'basicInfo.firstName,basicInfo.lastName,basicInfo.email',
        'professionalInfo.teamLead': 'basicInfo.firstName,basicInfo.lastName,basicInfo.email'
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

  // Helper function to render field
  const renderField = (label, value) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
      <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200 dark:border-gray-600">
        <p className="text-gray-800 dark:text-white font-medium">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );

  // Format address properly
  const formatAddress = (address) => {
    if (!address) return null;
    
    // If address is a string, try to parse and clean it
    if (typeof address === 'string') {
      try {
        // Replace object strings with just the name values
        let cleanAddress = address
          .replace(/\{[^}]*"name"\s*:\s*"([^"]+)"[^}]*\}/g, '$1')
          .replace(/,\s*,/g, ',')
          .replace(/^,\s*|,\s*$/g, '')
          .trim();
        return cleanAddress || null;
      } catch (e) {
        return address;
      }
    }
    
    // Handle object format
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) {
      if (typeof address.city === 'object' && address.city.name) {
        parts.push(address.city.name);
      } else if (typeof address.city === 'string') {
        parts.push(address.city);
      }
    }
    if (address.state) {
      if (typeof address.state === 'object' && address.state.name) {
        parts.push(address.state.name);
      } else if (typeof address.state === 'string') {
        parts.push(address.state);
      }
    }
    if (address.country) {
      if (typeof address.country === 'object' && address.country.name) {
        parts.push(address.country.name);
      } else if (typeof address.country === 'string') {
        parts.push(address.country);
      }
    }
    if (address.zip) parts.push(address.zip);
    
    return parts.length > 0 ? parts.join(', ') : null;
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = (employee) => {
    if (!employee) return 0;
    
    const fields = [
      employee.basicInfo?.firstName,
      employee.basicInfo?.lastName,
      employee.basicInfo?.email,
      employee.basicInfo?.phone,
      employee.basicInfo?.dob,
      employee.basicInfo?.fatherName,
      employee.basicInfo?.motherName,
      employee.basicInfo?.address?.street,
      employee.basicInfo?.address?.city,
      employee.basicInfo?.address?.state,
      employee.basicInfo?.address?.country,
      employee.basicInfo?.profileImage,
      employee.accountDetails?.accountName,
      employee.accountDetails?.accountNo,
      employee.accountDetails?.bankName,
      employee.accountDetails?.ifscCode,
      employee.personalDocuments?.pan,
      employee.personalDocuments?.aadhar
    ];
    
    const filledFields = fields.filter(field => field && field.toString().trim() !== '').length;
    return (filledFields / fields.length) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="relative">
              {employee.basicInfo?.profileImage ? (
                <img 
                  src={`http://10.11.244.208:3000/api/files/render/profile/${typeof employee.basicInfo.profileImage === 'string' ? employee.basicInfo.profileImage.split('/').pop() : employee.basicInfo.profileImage}`}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-4xl font-bold text-white">
                    {employee.basicInfo?.firstName?.[0]}{employee.basicInfo?.lastName?.[0]}
                  </span>
                </div>
              )}
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

        {/* Edit Form */}
        {editing && (
          <div className="mb-8">
            <FormRenderer
              fields={profileFormFields(employee)}
              submitButton={profileSubmitButton}
              data={employee}
              onSubmit={handleUpdateProfile}
            />
          </div>
        )}

        {/* Profile Completion Status */}
        {!editing && (
          <div className="mb-8">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Profile Completion</h3>
                <span className="text-2xl font-bold text-blue-600">{Math.round(calculateProfileCompletion(employee))}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${calculateProfileCompletion(employee)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Complete your profile to unlock all features
              </p>
            </div>
          </div>
        )}

        {/* Profile Content */}
        {!editing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Information */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/20">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Basic Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField("First Name", employee.basicInfo?.firstName)}
              {renderField("Last Name", employee.basicInfo?.lastName)}
              {renderField("Email", employee.basicInfo?.email)}
              {renderField("Phone", employee.basicInfo?.phone)}
              {renderField("Date of Birth", employee.basicInfo?.dob ? new Date(employee.basicInfo.dob).toLocaleDateString() : null)}
              {renderField("Marital Status", employee.basicInfo?.maritalStatus)}
              {renderField("Father's Name", employee.basicInfo?.fatherName)}
              {renderField("Mother's Name", employee.basicInfo?.motherName)}
              <div className="md:col-span-2">
                {renderField("Address", formatAddress(employee.basicInfo?.address))}
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/20">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 00-2 2H6a2 2 0 00-2-2V4m8 0H8m0 0v2m0 0V4m0 2v2m0-2h8m-8 2H8" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Professional</h2>
            </div>
            
            <div className="space-y-4">
              {renderField("Employee ID", employee.professionalInfo?.empId)}
              {renderField("Department", employee.professionalInfo?.department?.name)}
              {renderField("Designation", employee.professionalInfo?.designation?.title)}
              {renderField("Role", employee.professionalInfo?.role?.name)}
              {renderField("Reporting Manager", employee.professionalInfo?.reportingManager ? 
                `${employee.professionalInfo.reportingManager.basicInfo?.firstName || ''} ${employee.professionalInfo.reportingManager.basicInfo?.lastName || ''}`.trim() || "Not assigned"
                : null)}
              {renderField("Team Lead", employee.professionalInfo?.teamLead ? 
                `${employee.professionalInfo.teamLead.basicInfo?.firstName || ''} ${employee.professionalInfo.teamLead.basicInfo?.lastName || ''}`.trim() || "Not assigned"
                : null)}
              {renderField("Level", employee.professionalInfo?.level)}
              {renderField("Date of Joining", employee.professionalInfo?.doj ? new Date(employee.professionalInfo.doj).toLocaleDateString() : null)}
              {renderField("Probation Period", employee.professionalInfo?.probationPeriod)}
              {renderField("Confirmation Date", employee.professionalInfo?.confirmDate ? new Date(employee.professionalInfo.confirmDate).toLocaleDateString() : null)}
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/20">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Account Details</h2>
            </div>
            
            <div className="space-y-4">
              {renderField("Account Name", employee.accountDetails?.accountName)}
              {renderField("Account Number", employee.accountDetails?.accountNo)}
              {renderField("Bank Name", employee.accountDetails?.bankName)}
              {renderField("Branch", employee.accountDetails?.branch)}
              {renderField("IFSC Code", employee.accountDetails?.ifscCode)}
            </div>
          </div>

          {/* Personal Documents */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/20">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Documents</h2>
            </div>
            
            <div className="space-y-4">
              {renderField("PAN Number", employee.personalDocuments?.pan)}
              {renderField("Aadhar Number", employee.personalDocuments?.aadhar)}
              {renderField("ESI Number", employee.personalDocuments?.esi)}
              {renderField("PF Number", employee.personalDocuments?.pf)}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );

  async function handleUpdateProfile(changedData) {
    try {
      if (Object.keys(changedData).length === 0) {
        toast('No changes to save');
        return;
      }
      
      const updateData = new FormData();
      
      // Handle file upload if present
      if (changedData['basicInfo.profileImage'] && changedData['basicInfo.profileImage'] instanceof File) {
        updateData.append('file', changedData['basicInfo.profileImage']);
        delete changedData['basicInfo.profileImage'];
      }
      
      // Exclude system fields and protected fields
      const excludeFields = ['_id', 'id', 'createdAt', 'updatedAt', '__v', 'authInfo', 'professionalInfo'];
      
      // Add only changed form data
      Object.keys(changedData).forEach(key => {
        if (!excludeFields.some(field => key.startsWith(field)) && changedData[key] !== null && changedData[key] !== undefined) {
          // Handle nested objects
          if (typeof changedData[key] === 'object' && !Array.isArray(changedData[key]) && !(changedData[key] instanceof File)) {
            updateData.append(key, JSON.stringify(changedData[key]));
          } else {
            updateData.append(key, changedData[key]);
          }
        }
      });
      
      await axiosInstance.put(
        `/populate/update/employees/${user.id}`,
        updateData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      toast.success('Profile updated successfully');
      setEditing(false);
      fetchProfile();
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  }
};

export default Profile;