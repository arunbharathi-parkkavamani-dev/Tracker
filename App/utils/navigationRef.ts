import { router } from 'expo-router';

export interface NavigationRef {
  currentRoute: string;
  navigateTo: (route: string, params?: Record<string, any>) => void;
  isActive: (route: string) => boolean;
  updateCurrentRoute: (route: string) => void;
}

// Global singleton delegate
export const navigationRef: NavigationRef = {
  currentRoute: '',
  
  navigateTo: (route: string, params?: Record<string, any>) => {
    try {
      if (params) {
        router.push({ pathname: route as any, params });
      } else {
        router.push(route as any);
      }
    } catch (error) {
      console.error('Global navigateTo failed:', error);
    }
  },

  isActive: (route: string) => {
    // Basic route matching logic
    if (!navigationRef.currentRoute) return false;
    
    const cleanCurrent = navigationRef.currentRoute.replace(/^\//, '');
    const cleanTarget = route.replace(/^\//, '');
    
    return cleanCurrent === cleanTarget || cleanCurrent.startsWith(cleanTarget + '/');
  },

  updateCurrentRoute: (route: string) => {
    navigationRef.currentRoute = route;
  }
};
