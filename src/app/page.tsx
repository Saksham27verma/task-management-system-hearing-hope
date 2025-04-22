'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to login page
    router.replace('/login');
  }, [router]);
  
  // This will briefly show while the redirect happens
  return null;
} 