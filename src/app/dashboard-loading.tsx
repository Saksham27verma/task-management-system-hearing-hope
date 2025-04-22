'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import LoadingScreen from '@/components/common/LoadingScreen';

// Context to manage loading state
const LoadingContext = createContext<{
  isLoading: boolean;
  startLoading: (options?: LoadingOptions) => void;
  stopLoading: () => void;
}>({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {}
});

// Define loading options type
interface LoadingOptions {
  message?: string;
  showProgress?: boolean;
  showAppName?: boolean;
  logoSize?: { width: number; height: number };
  animationStyle?: 'pulse' | 'bounce' | 'rotate' | 'shine' | 'fade';
  logoBackgroundEffect?: 'glow' | 'ripple' | 'none';
}

export const useLoading = () => useContext(LoadingContext);

export function DashboardLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState<LoadingOptions>({
    message: "Loading page...",
    showProgress: true,
    showAppName: true,
    logoSize: { width: 200, height: 70 },
    animationStyle: 'pulse',
    logoBackgroundEffect: 'glow'
  });
  
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Show loading screen when route changes
  useEffect(() => {
    const handleRouteChangeStart = () => {
      // Customize loading message based on the route
      let message = "Loading page...";
      
      if (pathname) {
        if (pathname.includes('/tasks')) {
          message = "Loading tasks...";
        } else if (pathname.includes('/reports')) {
          message = "Preparing reports...";
        } else if (pathname.includes('/calendar')) {
          message = "Loading calendar...";
        } else if (pathname.includes('/directory')) {
          message = "Loading directory...";
        } else if (pathname.includes('/messages')) {
          message = "Loading messages...";
        }
      }
      
      setLoadingOptions(prev => ({
        ...prev,
        message,
        // Randomize the animation style for a more dynamic feel
        animationStyle: getRandomAnimation()
      }));
      
      setIsLoading(true);
    };
    
    const handleRouteChangeComplete = () => {
      // Add a small delay to avoid flashing
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    };
    
    // Set up a listener for pathname or searchParams changes
    handleRouteChangeStart();
    handleRouteChangeComplete();
    
  }, [pathname, searchParams]);
  
  // Get a random animation style to keep the loading experience fresh
  const getRandomAnimation = (): 'pulse' | 'bounce' | 'rotate' | 'shine' | 'fade' => {
    const animations = ['pulse', 'bounce', 'rotate', 'shine', 'fade'];
    const randomIndex = Math.floor(Math.random() * animations.length);
    return animations[randomIndex] as 'pulse' | 'bounce' | 'rotate' | 'shine' | 'fade';
  };
  
  // Provide manual methods to control loading state
  const startLoading = (options?: LoadingOptions) => {
    if (options) {
      setLoadingOptions(prev => ({ ...prev, ...options }));
    }
    setIsLoading(true);
  };
  
  const stopLoading = () => setIsLoading(false);
  
  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {isLoading && (
        <LoadingScreen 
          message={loadingOptions.message}
          fullScreen={true}
          showProgress={loadingOptions.showProgress}
          showAppName={loadingOptions.showAppName}
          logoSize={loadingOptions.logoSize}
          animationStyle={loadingOptions.animationStyle}
          logoBackgroundEffect={loadingOptions.logoBackgroundEffect}
          delay={400} // Slightly higher delay to prevent flashing on quick loads
        />
      )}
      {children}
    </LoadingContext.Provider>
  );
} 