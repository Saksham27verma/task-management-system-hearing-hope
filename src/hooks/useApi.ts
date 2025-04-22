'use client';

import { useState } from 'react';
import { useLoading } from '@/app/dashboard-loading';

// Loading configuration interface with enhanced options
interface LoadingConfig {
  showAppName?: boolean;
  logoSize?: { width: number; height: number };
  animationStyle?: 'pulse' | 'bounce' | 'rotate' | 'shine' | 'fade';
  logoBackgroundEffect?: 'glow' | 'ripple' | 'none';
  showProgress?: boolean;
}

// Generic API hook that shows loading screen for longer operations
export function useApi<T, P = any>(
  apiFunction: (params?: P) => Promise<T>,
  options: { 
    showLoadingScreen?: boolean;
    loadingMessage?: string;
    loadingDelay?: number;
    loadingConfig?: LoadingConfig;
  } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    showLoadingScreen = false, 
    loadingMessage = 'Loading data...',
    loadingDelay = 500,
    loadingConfig = {
      showAppName: true,
      logoSize: { width: 200, height: 70 },
      animationStyle: 'pulse',
      logoBackgroundEffect: 'glow',
      showProgress: true
    }
  } = options;
  
  // Get the global loading context
  const globalLoading = useLoading();
  
  const execute = async (params?: P): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    // Show loading screen for longer operations
    const loadingTimer = setTimeout(() => {
      if (showLoadingScreen) {
        globalLoading.startLoading({
          message: loadingMessage,
          ...loadingConfig
        });
      }
    }, loadingDelay);
    
    try {
      const result = await apiFunction(params);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      clearTimeout(loadingTimer);
      setIsLoading(false);
      
      if (showLoadingScreen) {
        globalLoading.stopLoading();
      }
    }
  };
  
  return {
    data,
    error,
    isLoading,
    execute
  };
} 