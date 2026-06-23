import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, router } from "expo-router";
import axiosInstance from "@/api/axiosInstance";
import { AuthContext } from "./AuthContext";
import { navigationRef } from "@/utils/navigationRef";

export interface SidebarItem {
  id: string;
  title: string;
  route: string;
  icon: string;
  accentColor: string;
  bgColor: string;
}

export const DEFAULT_NAV_ITEMS: SidebarItem[] = [
  { id: 'dashboard', title: 'Dashboard', route: '/dashboard', icon: 'dashboard', accentColor: '#6C3DE8', bgColor: '#EDE9FE' },
  { id: 'attendance', title: 'Attendance', route: '/attendance', icon: 'attendance', accentColor: '#7C3AED', bgColor: '#EDE9FE' },
  { id: 'tasks', title: 'Tasks', route: '/tasks', icon: 'tasks', accentColor: '#0EA5E9', bgColor: '#E0F2FE' },
  { id: 'daily-tracker', title: 'Daily Tracker', route: '/daily-tracker', icon: 'daily-tracker', accentColor: '#7C3AED', bgColor: '#EDE9FE' },
  { id: 'tickets', title: 'Tickets', route: '/tickets', icon: 'tickets', accentColor: '#E11D48', bgColor: '#FFE4EC' },
  { id: 'salary-expense', title: 'Salary Expense', route: '/salary-expense', icon: 'salary-expense', accentColor: '#059669', bgColor: '#D1FAE5' },
  { id: 'travel-expenses', title: 'Travel Expenses', route: '/travel-expenses', icon: 'travel-expenses', accentColor: '#059669', bgColor: '#D1FAE5' },
  { id: 'me', title: 'Profile', route: '/me', icon: 'me', accentColor: '#7C3AED', bgColor: '#EDE9FE' },
];

interface NavigationContextType {
  navItems: SidebarItem[];
  loading: boolean;
  badges: Record<string, number>;
  navigateTo: (route: string, params?: Record<string, any>) => void;
  isActive: (route: string) => boolean;
  refreshNavigation: () => Promise<void>;
  updateBadge: (key: string, count: number) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useContext(AuthContext);
  const pathname = usePathname();
  const [navItems, setNavItems] = useState<SidebarItem[]>(DEFAULT_NAV_ITEMS);
  const [loading, setLoading] = useState<boolean>(false);
  const [badges, setBadges] = useState<Record<string, number>>({
    tickets: 0,
    tasks: 0,
    attendance: 0,
    dashboard: 0,
  });

  // Sync current route with global navigationRef
  useEffect(() => {
    if (pathname) {
      navigationRef.updateCurrentRoute(pathname);
    }
  }, [pathname]);

  const fetchAllowedSidebars = async () => {
    if (!user) {
      setNavItems(DEFAULT_NAV_ITEMS);
      return;
    }

    try {
      setLoading(true);
      const sortQuery = JSON.stringify({ order: 1 });
      const response = await axiosInstance.get(
        `/populate/read/sidebars?sort=${encodeURIComponent(sortQuery)}`
      );

      const backendSidebars = response.data?.data;
      if (Array.isArray(backendSidebars) && backendSidebars.length > 0) {
        // Map backend routes to frontend menu items.
        // We only keep frontend NAV_ITEMS that exist in backend response.
        // We also order them according to backend order.
        const mappedItems: SidebarItem[] = [];

        backendSidebars.forEach((backendItem: any) => {
          if (!backendItem.isActive) return;

          // Find matching item in DEFAULT_NAV_ITEMS by route
          const matchingNavItem = DEFAULT_NAV_ITEMS.find(
            (navItem) => navItem.route.toLowerCase() === backendItem.mainRoute?.toLowerCase()
          );

          if (matchingNavItem) {
            // Override title if backend has custom title, otherwise use frontend
            mappedItems.push({
              ...matchingNavItem,
              title: backendItem.title || matchingNavItem.title,
            });
          }
        });

        // Fallback: If no matching items were found, use DEFAULT_NAV_ITEMS so screen isn't empty.
        setNavItems(mappedItems.length > 0 ? mappedItems : DEFAULT_NAV_ITEMS);
      } else {
        // Fallback to defaults if backend returns empty or non-array
        setNavItems(DEFAULT_NAV_ITEMS);
      }
    } catch (error) {
      console.warn("Failed to fetch dynamic sidebars from backend:", error);
      // Fallback to default items
      setNavItems(DEFAULT_NAV_ITEMS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllowedSidebars();
  }, [user]);

  const navigateTo = (route: string, params?: Record<string, any>) => {
    navigationRef.navigateTo(route, params);
  };

  const isActive = (route: string) => {
    return navigationRef.isActive(route);
  };

  const updateBadge = (key: string, count: number) => {
    setBadges((prev) => ({ ...prev, [key]: count }));
  };

  return (
    <NavigationContext.Provider
      value={{
        navItems,
        loading,
        badges,
        navigateTo,
        isActive,
        refreshNavigation: fetchAllowedSidebars,
        updateBadge,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};
