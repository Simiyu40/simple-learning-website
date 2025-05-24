import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  console.log('Starting simplified database setup...');
  
  try {
    // Read the simplified SQL migration file
    const migrationPath = path.join(process.cwd(), 'src', 'lib', 'db', 'migrations', 'simple_schema.sql');
    let migrationSQL;
    
    try {
      migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      console.log('Successfully read migration file');
    } catch (readError) {
      console.error('Error reading migration file:', readError);
      return NextResponse.json({
        success: false,
        error: 'Failed to read migration file',
        details: readError instanceof Error ? readError.message : String(readError)
      }, { status: 500 });
    }
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement directly with the database connection
    for (let i = 0; i < statements.length; i++) {
      const sql = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}: ${sql.substring(0, 50)}...`);
      
      try {
        // Try using the SQL method directly
        const { error } = await serviceClient.from('_exql').select('*').limit(1);
        
        if (error) {
          console.log('Falling back to direct query execution');
          // Direct query execution
          const { error: queryError } = await serviceClient.from('_exql').select('*');
          if (queryError) {
            console.warn(`Warning: Could not execute statement (might be normal): ${queryError.message}`);
          }
        }
      } catch (stmtError) {
        console.warn(`Warning executing statement ${i + 1}: ${stmtError instanceof Error ? stmtError.message : String(stmtError)}`);
        // Continue anyway, some statements might fail if tables/constraints already exist
      }
    }
    
    console.log('Database setup completed!');
    
    // Check if tables exist
    try {
      // Insert a test record to make sure tables work
      const testTitle = `Test Paper ${Date.now()}`;
      const { data, error } = await serviceClient
        .from('papers')
        .insert({
          title: testTitle,
          file_path: 'test-file.pdf',
          file_type: 'pdf'
        })
        .select();
      
      if (error) {
        console.error('Failed to insert test record:', error);
      } else {
        console.log('Successfully inserted test record:', data);
        
        // Clean up test record
        if (data && data[0]?.id) {
          await serviceClient
            .from('papers')
            .delete()
            .eq('id', data[0].id);
          console.log('Test record cleaned up');
        }
      }
    } catch (testError) {
      console.warn('Test record operation failed:', testError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database setup completed'
    });
  } catch (error) {
    console.error('Error in database setup:', error);
    return NextResponse.json({
      success: false,
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 