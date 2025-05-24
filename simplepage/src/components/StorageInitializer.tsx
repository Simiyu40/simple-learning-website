'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function StorageInitializer() {
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    async function initStorage() {
      try {
        // Call the init-storage API endpoint
        const response = await fetch('/api/init-storage');
        const data = await response.json();
        
        if (data.success) {
          console.log('Storage initialized successfully');
          setInitialized(true);
        } else {
          console.error('Failed to initialize storage:', data.error);
        }
      } catch (error) {
        console.error('Error initializing storage:', error);
      }
    }
    
    initStorage();
  }, []);
  
  // This component doesn't render anything visible
  return null;
}
