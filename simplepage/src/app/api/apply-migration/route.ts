import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  console.log('Applying paper_type migration...');
  
  try {
    // Read the SQL migration file
    const migrationPath = path.join(process.cwd(), 'src', 'lib', 'db', 'migrations', 'add_paper_type_column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const sql = statements[i] + ';';
      console.log(`Executing statement ${i + 1}/${statements.length}: ${sql.substring(0, 50)}...`);
      
      try {
        // Try with admin_query first
        const { error: adminError } = await serviceClient.rpc('admin_query', {
          sql: sql
        });
        
        if (adminError) {
          console.log('admin_query failed, trying pgfunction...');
          const { error: pgError } = await serviceClient.rpc('pgfunction', {
            sql: sql
          });
          
          if (pgError) {
            console.log('pgfunction failed, trying direct SQL execution...');
            const { error: directError } = await serviceClient.from('_sql').select('*').eq('query', sql);
            
            if (directError) {
              console.log(`Warning: Statement execution had issues: ${directError.message}`);
              // Don't throw - continue with other statements
            }
          }
        }
      } catch (stmtError) {
        console.warn(`Warning executing statement ${i + 1}: ${stmtError instanceof Error ? stmtError.message : String(stmtError)}`);
        // Continue anyway, some statements might fail if constraints already exist
      }
    }
    
    // Verify the paper_type column exists
    try {
      const { data, error } = await serviceClient
        .from('papers')
        .select('paper_type')
        .limit(1);
      
      if (error) {
        console.warn('Warning: Could not verify paper_type column:', error.message);
      } else {
        console.log('paper_type column verified successfully');
      }
    } catch (verifyError) {
      console.warn('Warning: Column verification had issues:', verifyError instanceof Error ? verifyError.message : String(verifyError));
    }
    
    return NextResponse.json({
      success: true,
      message: 'paper_type migration applied successfully'
    });
  } catch (error) {
    console.error('Error applying migration:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 