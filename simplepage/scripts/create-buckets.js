// Simplified script to create required Supabase storage buckets
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get the Supabase URL and SERVICE_ROLE key
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

async function createBuckets() {
  console.log('Creating storage buckets...');
  
  try {
    // List existing buckets
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      process.exit(1);
    }
    
    console.log(`Found ${existingBuckets.length} existing buckets: ${existingBuckets.map(b => b.name).join(', ') || 'None'}`);
    
    // Check if papers bucket exists
    const papersBucket = existingBuckets.find(b => b.name === 'papers');
    if (!papersBucket) {
      console.log('Creating papers bucket...');
      const { error: papersError } = await supabase.storage.createBucket('papers', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'application/pdf', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      });
      
      if (papersError) {
        console.error('Error creating papers bucket:', papersError);
      } else {
        console.log('Papers bucket created successfully!');
      }
    } else {
      console.log('Papers bucket already exists.');
    }
    
    // Check if solutions bucket exists
    const solutionsBucket = existingBuckets.find(b => b.name === 'solutions');
    if (!solutionsBucket) {
      console.log('Creating solutions bucket...');
      const { error: solutionsError } = await supabase.storage.createBucket('solutions', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'application/pdf', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      });
      
      if (solutionsError) {
        console.error('Error creating solutions bucket:', solutionsError);
      } else {
        console.log('Solutions bucket created successfully!');
      }
    } else {
      console.log('Solutions bucket already exists.');
    }
    
    console.log('\n------------------------------------------------------------------------------------');
    console.log('NEXT STEPS: You need to manually set up the bucket policies:');
    console.log('1. Go to your Supabase dashboard at https://app.supabase.io/');
    console.log('2. Select your project');
    console.log('3. Go to "Storage" in the sidebar');
    console.log('4. For each bucket (papers and solutions):');
    console.log('   - Click on "Policies"');
    console.log('   - Add a policy for public reading: set "SELECT" with definition "true"');
    console.log('   - Add a policy for authenticated uploads: set "INSERT" with definition "auth.role() = \'authenticated\'"');
    console.log('------------------------------------------------------------------------------------\n');
    
    console.log('Bucket setup complete!');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

createBuckets().catch(console.error);
