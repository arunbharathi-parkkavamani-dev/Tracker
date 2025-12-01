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
        console.log('Fetching profile for user:', user.id);
        const response = await axiosInstance.get(`/populate/read/employees/${user.id}`);
        const employee = response.data.data;
        console.log('Employee data:', employee?.basicInfo?.profileImage);
        
        if (employee?.basicInfo?.profileImage) {
          const imagePath = typeof employee.basicInfo.profileImage === 'string' 
            ? employee.basicInfo.profileImage.split('/').pop() 
            : employee.basicInfo.profileImage;
          const imageUrl = `http://10.11.244.208:3000/api/files/render/profile/${imagePath}`;
          console.log('Setting profile image URL:', imageUrl);
          setProfileImage(imageUrl);
        } else {
          console.log('No profile image found');
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