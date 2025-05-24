// Script to check if the public bucket exists
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPublicBucket() {
  console.log('Checking if public bucket exists...');
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return;
    }
    
    console.log('Available buckets:');
    buckets.forEach(bucket => {
      console.log(`- ${bucket.name}`);
    });
    
    const publicBucket = buckets.find(bucket => bucket.name === 'public');
    
    if (publicBucket) {
      console.log('\nPublic bucket exists! You can use it for file uploads.');
    } else {
      console.log('\nPublic bucket does not exist. You need to create it in the Supabase dashboard:');
      console.log('1. Go to https://app.supabase.io/');
      console.log('2. Select your project');
      console.log('3. Go to Storage in the left sidebar');
      console.log('4. Click "New Bucket"');
      console.log('5. Name it "public" and check "Public bucket" if you want files to be publicly accessible');
      console.log('6. Click "Create bucket"');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkPublicBucket().catch(console.error);
