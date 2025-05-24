import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    console.log('Checking database schema...');
    
    // Execute SQL to get table schema
    const { data: papersSchema, error: papersError } = await supabase
      .rpc('list_table_schema', { table_name: 'papers' });
    
    if (papersError) {
      console.error('Error fetching papers schema:', papersError);
      
      // Fall back to direct SQL query if RPC fails
      const { data: directQuery, error: directQueryError } = await supabase
        .from('_table_info')
        .select('*')
        .eq('table', 'papers');
        
      if (directQueryError) {
        console.error('Direct query error:', directQueryError);
        
        // Last attempt with raw SQL
        const { data: rawSql, error: rawSqlError } = await supabase
          .from('papers')
          .select('*')
          .limit(1);
          
        if (rawSqlError) {
          return NextResponse.json({ 
            success: false, 
            error: 'Could not query schema or table', 
            details: [papersError, directQueryError, rawSqlError]
          }, { status: 500 });
        }
        
        return NextResponse.json({
          success: true,
          method: 'raw SQL sample',
          sampleRecord: rawSql,
          columns: rawSql && rawSql.length > 0 ? Object.keys(rawSql[0]) : []
        });
      }
      
      return NextResponse.json({
        success: true,
        method: 'direct query',
        schema: directQuery
      });
    }
    
    return NextResponse.json({
      success: true,
      method: 'rpc',
      schema: papersSchema
    });
  } catch (error) {
    console.error('Schema check error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 