// Script to test Supabase connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey.substring(0, 5) + '...' + supabaseKey.substring(supabaseKey.length - 5));

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Try to get user (this should work even if not authenticated)
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error connecting to Supabase Auth:', userError);
    } else {
      console.log('Successfully connected to Supabase Auth!');
      console.log('User:', userData.user ? 'Authenticated' : 'Not authenticated');
    }
    
    // Try to list buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing storage buckets:', bucketsError);
      console.log('\nThis could be due to:');
      console.log('1. Invalid credentials');
      console.log('2. Storage API not enabled');
      console.log('3. Row-level security policies blocking access');
    } else {
      console.log('Successfully connected to Supabase Storage!');
      console.log('Existing buckets:', buckets.length ? buckets.map(b => b.name).join(', ') : 'None');
    }
    
    // Try a simple database query
    const { data: dbData, error: dbError } = await supabase
      .from('papers')
      .select('count')
      .limit(1);
    
    if (dbError) {
      console.error('Error connecting to Supabase Database:', dbError);
      if (dbError.message.includes('does not exist')) {
        console.log('\nThe "papers" table does not exist. This is expected if you haven\'t created it yet.');
      }
    } else {
      console.log('Successfully connected to Supabase Database!');
    }
    
    console.log('\nConnection test complete!');
  } catch (error) {
    console.error('Unexpected error during connection test:', error);
  }
}

testConnection().catch(console.error);
