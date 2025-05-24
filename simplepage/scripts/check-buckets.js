// Script to check if the required buckets exist and create them if they don't
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateBuckets() {
  console.log('Checking and creating required storage buckets...');
  
  try {
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      process.exit(1);
    }
    
    console.log('Existing buckets:', buckets.map(b => b.name).join(', ') || 'None');
    
    // Check for papers bucket
    const papersBucket = buckets.find(b => b.name === 'papers');
    if (!papersBucket) {
      console.log('Creating papers bucket...');
      const { error } = await supabase.storage.createBucket('papers', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'application/pdf', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      });
      
      if (error) {
        console.error('Error creating papers bucket:', error);
      } else {
        console.log('Papers bucket created successfully!');
      }
    } else {
      console.log('Papers bucket already exists.');
    }
    
    // Check for solutions bucket
    const solutionsBucket = buckets.find(b => b.name === 'solutions');
    if (!solutionsBucket) {
      console.log('Creating solutions bucket...');
      const { error } = await supabase.storage.createBucket('solutions', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'application/pdf', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      });
      
      if (error) {
        console.error('Error creating solutions bucket:', error);
      } else {
        console.log('Solutions bucket created successfully!');
      }
    } else {
      console.log('Solutions bucket already exists.');
    }
    
    console.log('Bucket check complete!');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

checkAndCreateBuckets().catch(console.error);
