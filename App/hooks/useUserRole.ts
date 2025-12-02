import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

// Role ID to name mapping - update these IDs based on your system
const ROLE_MAPPING: Record<string, string> = {
  '68d8b98af397d1d97620ba97': 'employee',
  '68d8b980f397d1d97620ba96': 'hr',
  '68d8b8caf397d1d97620ba93': 'manager', 
  '68d8b94ef397d1d97620ba94': 'superadmin'
};

export const useUserRole = () => {
  const { user } = useContext(AuthContext);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.role) {
      setLoading(false);
      return;
    }

    // Map role ID to role name
    const roleName = ROLE_MAPPING[user.role] || 'employee';
    setUserRole(roleName);
    console.log('Role ID from AuthContext:', user.role);
    console.log('Mapped role name:', roleName);
    setLoading(false);
  }, [user?.role]);

  return { userRole, loading };
};