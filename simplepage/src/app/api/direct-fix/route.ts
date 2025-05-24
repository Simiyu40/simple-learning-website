import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  console.log('Running direct fix for paper display issues...');
  
  try {
    // 1. First, query all papers from the database
    const { data: papers, error: papersError } = await serviceClient
      .from('papers')
      .select('*');
      
    if (papersError) {
      console.error('Error fetching papers:', papersError);
      return NextResponse.json({ success: false, error: papersError.message }, { status: 500 });
    }
    
    console.log(`Found ${papers?.length || 0} papers total`);
    
    // Log first paper for debugging
    if (papers && papers.length > 0) {
      console.log('First paper example:', papers[0]);
    }
    
    // 2. Fix schema issues with admin queries
    try {
      // Ensure all necessary columns exist
      await serviceClient.rpc('admin_query', {
        sql: "ALTER TABLE papers ADD COLUMN IF NOT EXISTS paper_type TEXT DEFAULT 'other';"
      });
      
      await serviceClient.rpc('admin_query', {
        sql: "ALTER TABLE papers ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'pdf';"
      });
      
      await serviceClient.rpc('admin_query', {
        sql: "ALTER TABLE papers ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;"
      });
      
      await serviceClient.rpc('admin_query', {
        sql: "ALTER TABLE papers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';"
      });
      
      console.log('Schema structure fixed');
    } catch (e) {
      console.error('Error fixing schema:', e);
    }
    
    // 3. Update papers to have required fields
    const updates = [];
    
    for (const paper of papers || []) {
      // Check if paper needs updates
      const updates_needed = (!paper.paper_type || !paper.file_type || !paper.status);
      
      if (updates_needed) {
        const update: any = {};
        
        if (!paper.paper_type) update.paper_type = 'other';
        if (!paper.file_type) update.file_type = paper.file_path.split('.').pop() || 'pdf';
        if (!paper.status) update.status = 'completed';
        
        try {
          const { error: updateError } = await serviceClient
            .from('papers')
            .update(update)
            .eq('id', paper.id);
            
          if (updateError) {
            console.error(`Error updating paper ${paper.id}:`, updateError);
          } else {
            console.log(`Updated paper ${paper.id} with:`, update);
            updates.push({ id: paper.id, ...update });
          }
        } catch (updateErr) {
          console.error(`Error in update operation for ${paper.id}:`, updateErr);
        }
      }
    }
    
    // 4. Verify the database table by getting row count
    const { count, error: countError } = await serviceClient
      .from('papers')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error('Error counting papers:', countError);
    }
    
    // 5. Get a fresh sample of papers after fixes
    const { data: freshSample, error: sampleError } = await serviceClient
      .from('papers')
      .select('*')
      .limit(5);
      
    if (sampleError) {
      console.error('Error getting fresh sample:', sampleError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Direct fix completed',
      totalPapers: papers?.length || 0,
      updatedPapers: updates.length,
      verifiedCount: count,
      samplePapers: freshSample || [],
      updates: updates
    });
  } catch (error) {
    console.error('Error in direct fix:', error);
    return NextResponse.json({
      success: false,
      error: 'Direct fix failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 