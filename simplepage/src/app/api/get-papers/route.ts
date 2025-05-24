import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

// Initialize Supabase client with service role to have admin rights
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    console.log('Fetching all papers from the database...');
    
    // Fetch all papers, ordered by newest first
    const { data: papers, error } = await supabase
      .from('papers')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching papers:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch papers' },
        { status: 500 }
      );
    }

    console.log(`Fetched ${papers?.length || 0} papers from the database`);

    // Process each paper to ensure it has a public URL
    const processedPapers = await Promise.all(
      (papers || []).map(async (paper) => {
        // If paper doesn't have a public URL but has a file path, generate one
        if (!paper.public_url && paper.file_path) {
          try {
            // Generate a signed URL with 7-day expiry
            const { data: urlData } = await supabase.storage
              .from('papers')
              .createSignedUrl(paper.file_path, 60 * 60 * 24 * 7);

            if (urlData?.signedUrl) {
              // Update the paper record with the new public URL
              const { error: updateError } = await supabase
                .from('papers')
                .update({ public_url: urlData.signedUrl })
                .eq('id', paper.id);

              if (updateError) {
                console.error('Error updating paper with public URL:', updateError);
              } else {
                paper.public_url = urlData.signedUrl;
              }
            }
          } catch (urlError) {
            console.error('Error generating signed URL:', urlError);
          }
        }
        return paper;
      })
    );

    // Organize papers by category
    const organizedPapers: Record<string, typeof papers> = {};

    processedPapers.forEach((paper) => {
      // Use lowercase for consistency and handle null/undefined
      const category = (paper.paper_type || 'uncategorized').toLowerCase();
      
      if (!organizedPapers[category]) {
        organizedPapers[category] = [];
      }
      organizedPapers[category].push(paper);
    });

    console.log('Papers organized by categories:', Object.keys(organizedPapers));
    
    return NextResponse.json({ 
      success: true, 
      papers: organizedPapers,
      totalCount: processedPapers.length 
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/get-papers:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 