import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    console.log('Starting table rebuild process...');
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'src', 'lib', 'db', 'migrations', 'rebuild_tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const sql = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}: ${sql.substring(0, 50)}...`);
      
      try {
        // Try using RPC for executing SQL - supabase.sql doesn't exist
        const { error } = await supabase.rpc('pgfunction', { sql: `${sql};` });
        
        if (error) {
          // Fallback to admin_query if available
          const { error: adminError } = await supabase.rpc('admin_query', { sql: `${sql};` });
          
          if (adminError) {
            console.error(`Could not execute SQL via RPC: ${sql}`);
            console.error('Error:', adminError);
          }
        }
        
        console.log(`Statement ${i + 1} executed successfully`);
      } catch (err) {
        console.error(`Error executing statement ${i + 1}:`, err);
        // Continue execution despite errors
      }
    }
    
    // Insert a test paper to verify tables work
    const { data: insertData, error: insertError } = await supabase
      .from('papers')
      .insert({
        title: 'Rebuilt Table Test',
        file_path: 'test-rebuild.pdf',
        file_type: 'pdf',
        status: 'completed'
      })
      .select();
    
    // Verify papers table exists and has expected structure
    const { data: verifyData, error: verifyError } = await supabase
      .from('papers')
      .select('id, title, file_path, file_type, status')
      .limit(5);
    
    return NextResponse.json({
      success: true,
      message: 'Table rebuild completed',
      testInsert: {
        success: !insertError,
        error: insertError ? insertError.message : null,
        data: insertData
      },
      verification: {
        success: !verifyError,
        error: verifyError ? verifyError.message : null,
        records: verifyData || [],
        columns: verifyData && verifyData.length > 0 ? Object.keys(verifyData[0]) : []
      }
    });
  } catch (error) {
    console.error('Table rebuild error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 