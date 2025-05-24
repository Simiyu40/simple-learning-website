// Script to set up bucket policies using SQL
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

async function setupBucketPolicies() {
  console.log('Setting up bucket policies using SQL...');
  
  try {
    // SQL for creating public read policy for papers bucket
    const paperReadPolicySQL = `
      CREATE POLICY "Allow public read access for papers" 
      ON storage.objects 
      FOR SELECT 
      TO public 
      USING (bucket_id = 'papers');
    `;
    
    // SQL for creating authenticated insert policy for papers bucket
    const paperInsertPolicySQL = `
      CREATE POLICY "Allow authenticated insert access for papers" 
      ON storage.objects 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (bucket_id = 'papers');
    `;
    
    // SQL for creating public read policy for solutions bucket
    const solutionReadPolicySQL = `
      CREATE POLICY "Allow public read access for solutions" 
      ON storage.objects 
      FOR SELECT 
      TO public 
      USING (bucket_id = 'solutions');
    `;
    
    // SQL for creating authenticated insert policy for solutions bucket
    const solutionInsertPolicySQL = `
      CREATE POLICY "Allow authenticated insert access for solutions" 
      ON storage.objects 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (bucket_id = 'solutions');
    `;
    
    // Drop existing policies first to avoid conflicts
    console.log('Dropping any existing bucket policies...');
    
    const dropPoliciesSQL = `
      DROP POLICY IF EXISTS "Allow public read access for papers" ON storage.objects;
      DROP POLICY IF EXISTS "Allow authenticated insert access for papers" ON storage.objects;
      DROP POLICY IF EXISTS "Allow public read access for solutions" ON storage.objects;
      DROP POLICY IF EXISTS "Allow authenticated insert access for solutions" ON storage.objects;
    `;
    
    const { error: dropError } = await supabase.rpc('pgfunction', { 
      sql: dropPoliciesSQL 
    });
    
    if (dropError) {
      console.error('Error dropping existing policies:', dropError);
      // Continue anyway, as the policies might not exist
    } else {
      console.log('Successfully dropped any existing policies');
    }
    
    // Execute the SQL statements to create policies
    console.log('Creating policies for papers bucket...');
    
    const { error: paperReadError } = await supabase.rpc('pgfunction', { 
      sql: paperReadPolicySQL 
    });
    
    if (paperReadError) {
      console.error('Error creating public read policy for papers bucket:', paperReadError);
      // Try alternative approach if this doesn't work
      console.log('Trying alternative approach for papers read policy...');
      await executeAlternativePolicy('papers', 'SELECT');
    } else {
      console.log('Successfully created public read policy for papers bucket');
    }
    
    const { error: paperInsertError } = await supabase.rpc('pgfunction', { 
      sql: paperInsertPolicySQL 
    });
    
    if (paperInsertError) {
      console.error('Error creating authenticated insert policy for papers bucket:', paperInsertError);
      // Try alternative approach if this doesn't work
      console.log('Trying alternative approach for papers insert policy...');
      await executeAlternativePolicy('papers', 'INSERT');
    } else {
      console.log('Successfully created authenticated insert policy for papers bucket');
    }
    
    console.log('Creating policies for solutions bucket...');
    
    const { error: solutionReadError } = await supabase.rpc('pgfunction', { 
      sql: solutionReadPolicySQL 
    });
    
    if (solutionReadError) {
      console.error('Error creating public read policy for solutions bucket:', solutionReadError);
      // Try alternative approach if this doesn't work
      console.log('Trying alternative approach for solutions read policy...');
      await executeAlternativePolicy('solutions', 'SELECT');
    } else {
      console.log('Successfully created public read policy for solutions bucket');
    }
    
    const { error: solutionInsertError } = await supabase.rpc('pgfunction', { 
      sql: solutionInsertPolicySQL 
    });
    
    if (solutionInsertError) {
      console.error('Error creating authenticated insert policy for solutions bucket:', solutionInsertError);
      // Try alternative approach if this doesn't work
      console.log('Trying alternative approach for solutions insert policy...');
      await executeAlternativePolicy('solutions', 'INSERT');
    } else {
      console.log('Successfully created authenticated insert policy for solutions bucket');
    }
    
    console.log('\nPolicy setup complete! If you encountered any errors, please:');
    console.log('1. Go to the Supabase dashboard: https://app.supabase.io/');
    console.log('2. Select your project');
    console.log('3. Go to Storage > Policies');
    console.log('4. Add policies manually for each bucket:');
    console.log('   - For public read access: SELECT policy with definition "true"');
    console.log('   - For authenticated uploads: INSERT policy with definition "auth.role() = \'authenticated\'"');
    
  } catch (error) {
    console.error('Unexpected error during policy setup:', error);
    console.log('\nPlease create policies manually through the Supabase dashboard.');
  }
}

async function executeAlternativePolicy(bucketId, policyType) {
  try {
    const definition = policyType === 'SELECT' ? 'true' : "auth.role() = 'authenticated'";
    const name = `${bucketId}_${policyType.toLowerCase()}`;
    
    // Try using storage.from().createPolicy
    try {
      const { error } = await supabase.storage.from(bucketId).createPolicy(name, {
        name,
        definition,
        type: policyType
      });
      
      if (error) throw error;
      console.log(`Successfully created ${policyType} policy for ${bucketId} using createPolicy`);
      return true;
    } catch (error) {
      console.log(`Could not create policy using createPolicy: ${error.message}`);
    }
    
    // Try direct SQL with a different approach
    const sql = `
      BEGIN;
        CREATE POLICY "${bucketId}_${policyType.toLowerCase()}_policy" 
        ON storage.objects 
        FOR ${policyType} 
        ${policyType === 'SELECT' ? 'TO public' : 'TO authenticated'} 
        ${policyType === 'SELECT' ? 'USING' : 'WITH CHECK'} (bucket_id = '${bucketId}');
      COMMIT;
    `;
    
    const { error } = await supabase.rpc('pgfunction', { sql });
    
    if (error) {
      console.error(`Error with alternative approach for ${bucketId} ${policyType} policy:`, error);
      return false;
    }
    
    console.log(`Successfully created ${policyType} policy for ${bucketId} using SQL`);
    return true;
  } catch (error) {
    console.error(`Error with alternative policy for ${bucketId} ${policyType}:`, error);
    return false;
  }
}

setupBucketPolicies().catch(console.error); 