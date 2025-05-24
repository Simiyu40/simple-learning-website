import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  console.log('Attempting to reset Supabase schema cache...');
  
  try {
    // Approach 1: Use explicit NOTIFY to reload schema
    try {
      const { error: notifyError } = await serviceClient.rpc('admin_query', {
        sql: `NOTIFY pgrst, 'reload schema';`
      });
      
      if (notifyError) {
        console.error('Error sending NOTIFY command:', notifyError);
      } else {
        console.log('NOTIFY command executed successfully');
      }
    } catch (notifyErr) {
      console.error('Exception sending NOTIFY command:', notifyErr);
    }
    
    // Approach 2: Update table comments to force refresh
    try {
      const { error: commentError } = await serviceClient.rpc('admin_query', {
        sql: `
          COMMENT ON TABLE papers IS 'Paper documents updated at ${new Date().toISOString()}';
          COMMENT ON TABLE solutions IS 'Solution documents updated at ${new Date().toISOString()}';
        `
      });
      
      if (commentError) {
        console.error('Error updating table comments:', commentError);
      } else {
        console.log('Table comments updated successfully');
      }
    } catch (commentErr) {
      console.error('Exception updating table comments:', commentErr);
    }
    
    // Approach 3: Refresh Supabase's internal cache tables if they exist
    try {
      const { error: cacheError } = await serviceClient.rpc('admin_query', {
        sql: `
          -- Try to refresh any internal cache tables
          REFRESH MATERIALIZED VIEW IF EXISTS pgrst.state;
          REFRESH MATERIALIZED VIEW IF EXISTS pgrst.definitions;
        `
      });
      
      if (cacheError) {
        console.log('Info: Could not refresh materialized views (they may not exist)');
      } else {
        console.log('Materialized views refreshed successfully');
      }
    } catch (cacheErr) {
      console.log('Info: Could not refresh materialized views (they may not exist)');
    }
    
    // Approach 4: Run a vacuum analyze to update statistics
    try {
      const { error: vacuumError } = await serviceClient.rpc('admin_query', {
        sql: `
          ANALYZE papers;
          ANALYZE solutions;
        `
      });
      
      if (vacuumError) {
        console.error('Error running ANALYZE:', vacuumError);
      } else {
        console.log('ANALYZE completed successfully');
      }
    } catch (vacuumErr) {
      console.error('Exception running ANALYZE:', vacuumErr);
    }
    
    // Approach 5: Update schema directly with a column that definitely exists to trigger cache refresh
    try {
      const { error: alterError } = await serviceClient.rpc('admin_query', {
        sql: `
          -- Set and reset a comment on an existing column to force metadata refresh
          COMMENT ON COLUMN papers.title IS 'Title of the paper';
          COMMENT ON COLUMN papers.file_path IS 'Path to the file in storage';
          COMMENT ON COLUMN papers.file_size IS 'Size of the file in bytes, added explicitly';
          
          COMMENT ON COLUMN solutions.file_path IS 'Path to the solution file in storage';
          COMMENT ON COLUMN solutions.file_size IS 'Size of the solution file in bytes, added explicitly';
        `
      });
      
      if (alterError) {
        console.error('Error updating column comments:', alterError);
      } else {
        console.log('Column comments updated successfully');
      }
    } catch (alterErr) {
      console.error('Exception updating column comments:', alterErr);
    }
    
    // Now check if the file_size column is actually in the database
    try {
      const { data, error } = await serviceClient.rpc('admin_query', {
        sql: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'papers' AND column_name = 'file_size';
        `
      });
      
      if (error) {
        console.error('Error checking file_size column:', error);
      } else if (!data || data.length === 0) {
        console.error('ERROR: file_size column does not exist in the database!');
        
        // Try to add it one more time
        try {
          const { error: addError } = await serviceClient.rpc('admin_query', {
            sql: `
              ALTER TABLE papers ADD COLUMN IF NOT EXISTS file_size BIGINT;
              ALTER TABLE solutions ADD COLUMN IF NOT EXISTS file_size BIGINT;
              
              NOTIFY pgrst, 'reload schema';
            `
          });
          
          if (addError) {
            console.error('Error adding file_size column:', addError);
          } else {
            console.log('file_size column added successfully');
          }
        } catch (addErr) {
          console.error('Exception adding file_size column:', addErr);
        }
      } else {
        console.log('file_size column exists in the database:', data);
      }
    } catch (checkErr) {
      console.error('Exception checking file_size column:', checkErr);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cache reset attempts completed'
    });
  } catch (error) {
    console.error('Error resetting cache:', error);
    return NextResponse.json({
      success: false,
      error: 'Cache reset failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 