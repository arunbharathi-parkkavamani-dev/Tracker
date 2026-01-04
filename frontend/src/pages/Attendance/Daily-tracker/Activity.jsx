import React from "react";

const Activity = ({ activity, onClose }) => {
  if (!activity) return null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {activity.user?.basicInfo?.firstName?.[0] || 'A'}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {activity.activityType?.name || 'Activity Details'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {new Date(activity.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center mb-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">Client</h3>
            </div>
            <p className="text-blue-700 dark:text-blue-300 font-medium">{activity.client?.name}</p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-2xl p-6 border border-purple-200 dark:border-purple-700">
            <div className="flex items-center mb-3">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="font-semibold text-purple-800 dark:text-purple-200">Project</h3>
            </div>
            <p className="text-purple-700 dark:text-purple-300 font-medium">{activity.projectType?.name}</p>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-2xl p-6 border border-green-200 dark:border-green-700">
            <div className="flex items-center mb-3">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="font-semibold text-green-800 dark:text-green-200">Assigned To</h3>
            </div>
            <p className="text-green-700 dark:text-green-300 font-medium">
              {activity.user?.basicInfo?.firstName} {activity.user?.basicInfo?.lastName}
            </p>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-2xl p-6 border border-orange-200 dark:border-orange-700">
            <div className="flex items-center mb-3">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-semibold text-orange-800 dark:text-orange-200">Time</h3>
            </div>
            <p className="text-orange-700 dark:text-orange-300 font-medium">
              {new Date(activity.date).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      {activity.activity && (
        <div className="mt-8">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center mb-4">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Activity Description</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {activity.activity}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activity;
