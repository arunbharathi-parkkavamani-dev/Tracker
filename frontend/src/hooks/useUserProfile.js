import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/authProvider';

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!user?.id) {
        console.log('No user ID available');
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`/populate/read/employees/${user.id}`);
        const employee = response.data.data;
        
        if (employee?.basicInfo?.profileImage) {
          const imagePath = typeof employee.basicInfo.profileImage === 'string' 
            ? employee.basicInfo.profileImage.split('/').pop() 
            : employee.basicInfo.profileImage;
          const imageUrl = `http://10.243.60.208:3000/api/files/render/profile/${imagePath}`;
          setProfileImage(imageUrl);
        } else {
        }
      } catch (error) {
        console.error('Failed to fetch profile image:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileImage();
  }, [user?.id]);

  return { profileImage, loading };
};