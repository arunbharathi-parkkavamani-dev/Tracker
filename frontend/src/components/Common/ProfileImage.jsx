import { useState } from 'react';

const baseUrl = "http://192.168.1.18:3000"

const ProfileImage = ({
  profileImage,
  firstName,
  lastName,
  size = 'md',
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);

  // Size configurations
  const sizes = {
    xs: 'w-8 h-8 text-xs',
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-xl',
    xl: 'w-32 h-32 text-2xl'
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const filename = typeof imagePath === 'string' ? imagePath.split('/').pop() : imagePath;
    return `${baseUrl}/api/files/render/profile/${filename}`;
  };

  const getInitials = () => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return (first + last).toUpperCase();
  };

  if (profileImage && !imageError) {
    return (
      <img
        src={getImageUrl(profileImage)}
        alt="Profile"
        className={`${sizes[size]} rounded-full object-cover ${className}`}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className={`${sizes[size]} bg-blue-800 dark:bg-blue-600 rounded-full flex items-center justify-center ${className}`}>
      <span className={`font-bold text-white ${sizes[size].split(' ')[2]}`}>
        {getInitials()}
      </span>
    </div>
  );
};

export default ProfileImage;