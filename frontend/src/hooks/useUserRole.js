import {useState, useEffect} from "react";
import {useAuth} from "../context/authProvider";
import axiosInstance from "../api/axiosInstance";

export const useUserRole = () => {
    const {user} = useAuth();
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, SetError] = useState("");
    
    const fetchUserRoleName = async(user) => {
        try {
            const response = await axiosInstance.get(`populate/read/roles/${user.role}`)
            const roleName = response?.data?.data?.name;
            setUserRole(roleName.toLowerCase())
        }
        catch (error) {
            SetError(error);
        }
    }

    useEffect(() => {
        if(!user?.role) {
            setLoading(false);
            return;
        }
        fetchUserRoleName(user);
        setLoading(false);

    }, [user]);

    return {userRole, loading, error, userId: user?._id};
}