import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching files from storage...');
    
    // Get search params from URL
    const searchParams = request.nextUrl.searchParams;
    const bucket = searchParams.get('bucket'); // 'papers' or 'solutions' or null for both
    const fileType = searchParams.get('fileType'); // Filter by file extension
    
    const buckets = bucket ? [bucket] : ['papers', 'solutions'];
    let allFiles: any[] = [];
    
    // Fetch files from specified buckets
    for (const currentBucket of buckets) {
      try {
        const { data: files, error } = await supabase.storage
          .from(currentBucket)
          .list('', { 
            sortBy: { column: 'created_at', order: 'desc' }
          });
        
        if (error) {
          console.error(`Error fetching files from ${currentBucket}:`, error);
          continue; // Skip this bucket but continue with others
        }
        
        // Process files to include bucket info
        const processedFiles = (files || []).map(file => ({
          ...file,
          bucket: currentBucket,
          fileType: file.name.split('.').pop()?.toLowerCase() || 'unknown'
        }));
        
        allFiles = [...allFiles, ...processedFiles];
      } catch (bucketError) {
        console.error(`Error processing ${currentBucket} bucket:`, bucketError);
      }
    }
    
    // Apply file type filter if provided
    if (fileType) {
      allFiles = allFiles.filter(file => 
        file.fileType.toLowerCase() === fileType.toLowerCase()
      );
    }
    
    // Sort by creation date (newest first)
    allFiles.sort((a, b) => {
      const dateA = a.created_at || a.updated_at || a.last_modified_at || '';
      const dateB = b.created_at || b.updated_at || b.last_modified_at || '';
      return dateB.localeCompare(dateA);
    });
    
    // Get file URLs for quick access
    const filesWithUrls = allFiles.map(file => {
      try {
        const { data } = supabase.storage
          .from(file.bucket)
          .getPublicUrl(file.name);
        
        return {
          ...file,
          url: data.publicUrl
        };
      } catch (e) {
        return {
          ...file,
          url: '#'
        };
      }
    });
    
    // Group files by type for easier frontend filtering
    const filesByType: { [key: string]: any[] } = {};
    filesWithUrls.forEach(file => {
      const type = file.fileType || 'unknown';
      if (!filesByType[type]) {
        filesByType[type] = [];
      }
      filesByType[type].push(file);
    });
    
    // Group files by bucket
    const filesByBucket = {
      papers: filesWithUrls.filter(file => file.bucket === 'papers'),
      solutions: filesWithUrls.filter(file => file.bucket === 'solutions')
    };
    
    return NextResponse.json({
      success: true,
      files: filesWithUrls,
      filesByType,
      filesByBucket,
      filters: {
        bucket: bucket || 'all',
        fileType: fileType || 'all'
      }
    });
  } catch (error) {
    console.error('Storage files fetch error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 