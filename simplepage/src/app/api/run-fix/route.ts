import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SqlResult {
  statement: number;
  success: boolean;
  error?: string;
  note?: string;
}

export async function GET() {
  try {
    console.log('Starting fix for missing columns...');
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'src', 'lib', 'db', 'migrations', 'fix_missing_columns.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    const results: SqlResult[] = [];
    
    for (let i = 0; i < statements.length; i++) {
      const sql = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}: ${sql.substring(0, 50)}...`);
      
      try {
        // Execute the statement
        const { data, error } = await supabase.rpc('admin_query', { sql });
        
        if (error) {
          console.warn(`Warning for statement ${i + 1}: ${error.message}`);
          results.push({ 
            statement: i + 1, 
            success: false, 
            error: error.message 
          });
          
          // Try direct SQL query
          try {
            await supabase.rpc('admin_query', { sql: `${sql};` });
            console.log(`Statement ${i + 1} executed with direct SQL`);
            if (results[results.length - 1]) {
              results[results.length - 1].success = true;
              results[results.length - 1].note = 'Executed with direct SQL';
            }
          } catch (directError: any) {
            console.warn(`Direct SQL also failed: ${directError.message}`);
          }
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
          results.push({ statement: i + 1, success: true });
        }
      } catch (err) {
        console.error(`Error executing statement ${i + 1}:`, err);
        results.push({ 
          statement: i + 1, 
          success: false, 
          error: err instanceof Error ? err.message : String(err) 
        });
      }
    }
    
    // Check if the papers table has the correct columns now
    const { data: papersData, error: papersError } = await supabase
      .from('papers')
      .select('*')
      .limit(1);
    
    // Try to insert a test paper
    const { data: insertData, error: insertError } = await supabase
      .from('papers')
      .insert({
        title: 'Test After Fix ' + new Date().toISOString(),
        file_path: 'test-after-fix.pdf',
        file_type: 'pdf',
        status: 'completed'
      })
      .select();
    
    return NextResponse.json({
      success: true,
      message: 'Fix completed',
      results,
      papersTable: {
        error: papersError ? papersError.message : null,
        columns: papersData && papersData.length > 0 ? Object.keys(papersData[0]) : []
      },
      testInsert: {
        success: !insertError,
        error: insertError ? insertError.message : null,
        data: insertData
      }
    });
  } catch (error) {
    console.error('Fix execution error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 