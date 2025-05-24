// Script to set up public bucket policies that allow anyone to upload
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

async function setupPublicPolicies() {
  console.log('Setting up public bucket policies for anonymous uploads...');
  
  try {
    // First, verify buckets exist
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      process.exit(1);
    }
    
    console.log(`Found ${buckets.length} buckets: ${buckets.map(b => b.name).join(', ') || 'None'}`);
    
    const papersBucket = buckets.find(b => b.name === 'papers');
    const solutionsBucket = buckets.find(b => b.name === 'solutions');
    
    if (!papersBucket) {
      console.log('Creating papers bucket...');
      const { error: createError } = await supabase.storage.createBucket('papers', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'application/pdf', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      });
      
      if (createError) {
        console.error('Error creating papers bucket:', createError);
      } else {
        console.log('Papers bucket created successfully!');
      }
    }
    
    if (!solutionsBucket) {
      console.log('Creating solutions bucket...');
      const { error: createError } = await supabase.storage.createBucket('solutions', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'application/pdf', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      });
      
      if (createError) {
        console.error('Error creating solutions bucket:', createError);
      } else {
        console.log('Solutions bucket created successfully!');
      }
    }
    
    console.log('\nNow setting up public policies for each bucket...');
    
    // SQL to set up public policies
    const setupSql = `
      -- Remove any existing policies
      DROP POLICY IF EXISTS "Public read access for papers" ON storage.objects;
      DROP POLICY IF EXISTS "Public insert access for papers" ON storage.objects;
      DROP POLICY IF EXISTS "Public read access for solutions" ON storage.objects;
      DROP POLICY IF EXISTS "Public insert access for solutions" ON storage.objects;
      
      -- Create public read policy for papers bucket
      CREATE POLICY "Public read access for papers" 
      ON storage.objects 
      FOR SELECT 
      TO public 
      USING (bucket_id = 'papers');
      
      -- Create public insert policy for papers bucket (no auth needed)
      CREATE POLICY "Public insert access for papers" 
      ON storage.objects 
      FOR INSERT 
      TO public 
      WITH CHECK (bucket_id = 'papers');
      
      -- Create public read policy for solutions bucket
      CREATE POLICY "Public read access for solutions" 
      ON storage.objects 
      FOR SELECT 
      TO public 
      USING (bucket_id = 'solutions');
      
      -- Create public insert policy for solutions bucket (no auth needed)
      CREATE POLICY "Public insert access for solutions" 
      ON storage.objects 
      FOR INSERT 
      TO public 
      WITH CHECK (bucket_id = 'solutions');
    `;
    
    try {
      // Try using RPC call if available
      console.log('Applying policies using RPC call...');
      const { error: policyError } = await supabase.rpc('pgfunction', { sql: setupSql });
      
      if (policyError) {
        throw new Error(`RPC Error: ${policyError.message}`);
      } else {
        console.log('Policies set up successfully using RPC!');
      }
    } catch (rpcError) {
      console.log('RPC method not available. Please set up policies manually through the dashboard:');
      console.log('\n1. Go to your Supabase dashboard: https://app.supabase.io/');
      console.log('2. Select your project');
      console.log('3. Go to "Storage" in the left sidebar');
      console.log('4. Click on the "Policies" tab');
      console.log('5. For each bucket (papers and solutions), add these policies:');
      console.log('   a. Public READ policy:');
      console.log('      - Name: "Public read access for [bucket_name]"');
      console.log('      - Operation: SELECT');
      console.log('      - Role: public');
      console.log('      - Definition: bucket_id = \'[bucket_name]\'');
      console.log('   b. Public WRITE policy:');
      console.log('      - Name: "Public insert access for [bucket_name]"');
      console.log('      - Operation: INSERT');
      console.log('      - Role: public');
      console.log('      - Definition: bucket_id = \'[bucket_name]\'');
    }
    
    console.log('\nSetup complete! You should now be able to upload files without authentication.');
    
  } catch (error) {
    console.error('Unexpected error during setup:', error);
  }
}

setupPublicPolicies().catch(console.error); 