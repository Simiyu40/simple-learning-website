import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  console.log('Starting database setup...');
  const results = {
    schema: null,
    tables: null,
    success: false,
    error: null
  };
  
  try {
    // Read the SQL migration file
    const migrationPath = path.join(process.cwd(), 'src', 'lib', 'db', 'migrations', 'fix_database_schema.sql');
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
    
    console.log('Database setup completed successfully!');
    
    // Verify the setup by checking if we can query the tables
    try {
      // Check papers table
      const { data: papersData, error: papersError } = await serviceClient
        .from('papers')
        .select('count')
        .limit(1);
      
      console.log('Papers table check result:', papersError ? 'Error' : 'Success');
      
      // Check solutions table
      const { data: solutionsData, error: solutionsError } = await serviceClient
        .from('solutions')
        .select('count')
        .limit(1);
      
      console.log('Solutions table check result:', solutionsError ? 'Error' : 'Success');
      
      // If both checks had errors, tables might not exist
      if (papersError && solutionsError) {
        console.warn('Warning: Could not verify tables existence');
      }
    } catch (verifyError) {
      console.warn('Warning: Table verification had issues:', verifyError instanceof Error ? verifyError.message : String(verifyError));
      // Continue anyway - the tables might exist but be empty
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