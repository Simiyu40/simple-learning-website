import { supabase } from './supabase';

export async function testDatabaseConnection() {
  try {
    // Test basic connectivity
    const { error } = await supabase
      .from('papers')
      .select('count')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST301') {
        throw new Error('Authentication failed. Please check your Supabase anon key.');
      } else if (error.code === 'PGRST116') {
        throw new Error('Network error. Unable to reach Supabase server.');
      } else if (error.message?.includes('SSL')) {
        throw new Error('SSL/TLS connection error. Please check your network configuration.');
      }
      throw new Error(`Connection test failed: ${error.message}`);
    }

    return { success: true, message: 'Connected successfully to Supabase' };
  } catch (error) {
    console.error('Error testing connection:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

async function testDatabase() {
  console.log('Testing database connection...')
  
  // First check the connection
  const isConnected = await testDatabaseConnection();
  if (!isConnected.success) {
    console.error('Failed to connect to the database. Please check your credentials and try again.');
    return;
  }

  console.log('Database setup completed successfully!');
}

// Run the test
testDatabase().catch(console.error);