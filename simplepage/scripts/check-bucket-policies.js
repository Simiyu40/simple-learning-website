// Script to check if bucket policies are properly set up
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// Get the Supabase URL and keys
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

// Create clients with different keys
const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : 
  null;

async function checkBucketPolicies() {
  console.log('\n========== CHECKING SUPABASE BUCKET POLICIES ==========\n');
  
  try {
    console.log('1. Checking authentication status...');
    let isAuthenticated = false;
    
    try {
      const { data: userData, error: authError } = await anonClient.auth.getUser();
      
      if (authError) {
        console.error('❌ Authentication error:', authError.message);
        console.log('   Continuing without authentication...');
      } else {
        isAuthenticated = !!userData.user;
        console.log(`Authentication status: ${isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'}`);
      }
    } catch (authError) {
      console.error('❌ Authentication error:', authError.message || authError);
      console.log('   Continuing without authentication...');
    }
    
    console.log('\n2. Checking bucket existence...');
    
    const { data: buckets, error: bucketsError } = await anonClient.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      
      if (bucketsError.message?.includes('policy')) {
        console.log('\n❌ Row-Level Security policy error detected!');
        console.log('This means your Anonymous API key does not have permission to list buckets.');
        
        if (!serviceClient) {
          console.log('\n⚠️ No service role key provided. Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file to perform additional checks.');
        } else {
          console.log('\n⚠️ Attempting to list buckets with service role key instead...');
          
          const { data: serviceBuckets, error: serviceBucketsError } = await serviceClient.storage.listBuckets();
          
          if (serviceBucketsError) {
            console.error('❌ Error listing buckets with service role key:', serviceBucketsError);
          } else {
            console.log(`✅ Found ${serviceBuckets.length} buckets using service role key: ${serviceBuckets.map(b => b.name).join(', ')}`);
            
            const papersBucket = serviceBuckets.find(b => b.name === 'papers');
            const solutionsBucket = serviceBuckets.find(b => b.name === 'solutions');
            
            if (!papersBucket) console.log('❌ Papers bucket not found');
            else console.log('✅ Papers bucket exists');
            
            if (!solutionsBucket) console.log('❌ Solutions bucket not found');
            else console.log('✅ Solutions bucket exists');
          }
        }
      }
    } else {
      console.log(`✅ Found ${buckets.length} buckets: ${buckets.map(b => b.name).join(', ')}`);
      
      const papersBucket = buckets.find(b => b.name === 'papers');
      const solutionsBucket = buckets.find(b => b.name === 'solutions');
      
      if (!papersBucket) console.log('❌ Papers bucket not found');
      else console.log('✅ Papers bucket exists');
      
      if (!solutionsBucket) console.log('❌ Solutions bucket not found');
      else console.log('✅ Solutions bucket exists');
      
      if (papersBucket && solutionsBucket) {
        console.log('\n3. Testing bucket access...');
        
        // Test reading from papers bucket
        console.log('\nTesting papers bucket read access...');
        const { data: papersFiles, error: papersError } = await anonClient.storage
          .from('papers')
          .list('', { limit: 1 });
          
        if (papersError) {
          console.log('❌ Cannot read from papers bucket:', papersError.message);
          
          if (papersError.message?.includes('policy')) {
            console.log('❌ Missing read policy for papers bucket');
          }
        } else {
          console.log('✅ Successfully read from papers bucket');
          console.log(`   Found ${papersFiles.length} files`);
        }
        
        // Test reading from solutions bucket
        console.log('\nTesting solutions bucket read access...');
        const { data: solutionsFiles, error: solutionsError } = await anonClient.storage
          .from('solutions')
          .list('', { limit: 1 });
          
        if (solutionsError) {
          console.log('❌ Cannot read from solutions bucket:', solutionsError.message);
          
          if (solutionsError.message?.includes('policy')) {
            console.log('❌ Missing read policy for solutions bucket');
          }
        } else {
          console.log('✅ Successfully read from solutions bucket');
          console.log(`   Found ${solutionsFiles.length} files`);
        }
        
        // Test uploading to papers bucket (will likely fail without auth)
        console.log('\nTesting papers bucket write access...');
        const testFilePath = path.join(__dirname, 'test-policy-check.txt');
        fs.writeFileSync(testFilePath, 'test');
        const papersTestContent = fs.readFileSync(testFilePath);
        const { error: papersUploadError } = await anonClient.storage
          .from('papers')
          .upload('test-policy-check.txt', papersTestContent, { upsert: true, contentType: 'text/plain' });
          
        if (papersUploadError) {
          if (isAuthenticated) {
            console.log('❌ Cannot upload to papers bucket even when authenticated:', papersUploadError.message);
          } else {
            console.log('ℹ️ Cannot upload to papers bucket (expected without authentication):', papersUploadError.message);
            console.log('   This is expected behavior if you have the correct INSERT policy set to require authentication');
          }
        } else {
          console.log('✅ Successfully uploaded to papers bucket');
          // Clean up the test file
          fs.unlinkSync(testFilePath);
        }
        
        // Test uploading to solutions bucket (will likely fail without auth)
        console.log('\nTesting solutions bucket write access...');
        const solutionsTestFilePath = path.join(__dirname, 'solutions-test-policy-check.txt');
        fs.writeFileSync(solutionsTestFilePath, 'test');
        const solutionsTestContent = fs.readFileSync(solutionsTestFilePath);
        
        const { error: solutionsUploadError } = await anonClient.storage
          .from('solutions')
          .upload('test-policy-check.txt', solutionsTestContent, { upsert: true, contentType: 'text/plain' });
          
        if (solutionsUploadError) {
          if (isAuthenticated) {
            console.log('❌ Cannot upload to solutions bucket even when authenticated:', solutionsUploadError.message);
          } else {
            console.log('ℹ️ Cannot upload to solutions bucket (expected without authentication):', solutionsUploadError.message);
            console.log('   This is expected behavior if you have the correct INSERT policy set to require authentication');
          }
        } else {
          console.log('✅ Successfully uploaded to solutions bucket');
          // Clean up the test file
          await anonClient.storage.from('solutions').remove(['test-policy-check.txt']);
        }
        
        // Clean up test files
        try {
          if (fs.existsSync(solutionsTestFilePath)) {
            fs.unlinkSync(solutionsTestFilePath);
          }
          if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up test files:', cleanupError);
        }
      }
    }
    
    console.log('\n========== POLICY CHECK SUMMARY ==========');
    console.log('\nTo fix policy issues:');
    console.log('1. Go to your Supabase dashboard: https://app.supabase.io/');
    console.log('2. Select your project');
    console.log('3. Go to "Storage" in the left sidebar');
    console.log('4. Click on the "Policies" tab');
    console.log('5. For each bucket (papers and solutions):');
    console.log('   - Add a policy for public reading: set "SELECT" with definition "true"');
    console.log('   - Add a policy for authenticated uploads: set "INSERT" with definition "auth.role() = \'authenticated\'"');
    console.log('\nAfter setting up policies, restart your application and try again.');
    
  } catch (error) {
    console.error('Unexpected error during policy check:', error);
  }
}

checkBucketPolicies().catch(console.error); 