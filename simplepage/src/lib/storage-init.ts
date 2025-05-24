import { supabase } from './supabase';

export async function initializeStorage() {
  console.log('Starting storage initialization...');
  try {
    // Check if we're in a browser environment
    const isBrowser = typeof window !== 'undefined';
    console.log(`Environment: ${isBrowser ? 'Browser' : 'Server'}`);
    
    if (isBrowser) {
      console.log('Using client-side storage initialization...');
      // We use the API endpoint for uploads, but still check bucket connectivity for information
    } else {
      console.log('Server-side environment detected, skipping client connectivity test');
      return { success: true, message: 'Server-side environment detected' };
    }
    
    // Test basic connectivity to Supabase
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data: papersFiles, error: papersError } = await supabase.storage
        .from('papers')
        .list('', { limit: 1 });
        
      if (papersError) {
        console.warn('Note: Cannot access papers bucket directly. Will attempt to use server-side API instead.');
      } else {
        console.log('Successfully connected to papers bucket');
      }
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data: solutionsFiles, error: solutionsError } = await supabase.storage
        .from('solutions')
        .list('', { limit: 1 });
        
      if (solutionsError) {
        console.warn('Note: Cannot access solutions bucket directly. Will attempt to use server-side API instead.');
      } else {
        console.log('Successfully connected to solutions bucket');
      }
      
      // Also test the API endpoint if in browser
      if (isBrowser) {
        try {
          const response = await fetch('/api/test-connection');
          const result = await response.json();
          
          if (result.success) {
            console.log('API connection test successful');
          } else {
            console.warn('API connection test failed:', result.error);
          }
        } catch (apiError) {
          console.warn('Error testing API connection:', apiError);
        }
      }
    } catch (error) {
      console.warn('Error testing bucket access:', error);
      console.log('Uploads will be handled through server-side API');
    }
    
    console.log('Storage initialization complete');
    return { success: true, message: 'Storage initialized for uploads via server API' };
  } catch (error) {
    console.error('Error initializing storage:', error);
    // Always return success to prevent blocking the application
    return { success: true, message: 'Storage initialized with limited permissions' };
  }
}