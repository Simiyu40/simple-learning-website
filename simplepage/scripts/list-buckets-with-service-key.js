// Script to list buckets using the service role key
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Missing Supabase URL. Please check your .env.local file.');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('Missing Supabase service role key. Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.');
  console.error('You can find this key in your Supabase dashboard under Project Settings > API > service_role key');
  process.exit(1);
}

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listBuckets() {
  console.log('Listing buckets with service role key...');
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return;
    }
    
    console.log(`Found ${buckets.length} buckets: ${buckets.map(b => b.name).join(', ') || 'None'}`);
    
    // Check for the required buckets
    const papersBucket = buckets.find(b => b.name === 'papers');
    const solutionsBucket = buckets.find(b => b.name === 'solutions');
    
    if (papersBucket) {
      console.log('✅ Papers bucket exists');
    } else {
      console.log('❌ Papers bucket does not exist');
    }
    
    if (solutionsBucket) {
      console.log('✅ Solutions bucket exists');
    } else {
      console.log('❌ Solutions bucket does not exist');
    }
    
    // Instructions if buckets don't exist
    if (!papersBucket || !solutionsBucket) {
      console.log('\nTo create the missing buckets, run:');
      console.log('npm run create-buckets');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

listBuckets().catch(console.error); 