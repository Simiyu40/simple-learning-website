import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Initialize Supabase client with service role for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    console.log('Testing storage upload directly...');
    
    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const fileName = `${timestamp}-test-document.pdf`;
    
    // Create a simple PDF-like header for the buffer (not a real PDF, but enough for MIME type detection)
    const pdfHeader = '%PDF-1.5\n%¿÷¢\n';
    const pdfContent = pdfHeader + 'This is test content for a PDF-like file.\nGenerated: ' + new Date().toISOString();
    
    // Upload the test content as a buffer
    const { data, error } = await supabase.storage
      .from('papers')
      .upload(fileName, Buffer.from(pdfContent), {
        contentType: 'application/pdf',
        upsert: false
      });
    
    if (error) {
      console.error('Error uploading test file:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    console.log('Test file uploaded:', data);
    
    // Get a public URL for the file
    const { data: urlData } = supabase.storage
      .from('papers')
      .getPublicUrl(fileName);
    
    // List all files in the papers bucket
    const { data: bucketFiles, error: listError } = await supabase.storage
      .from('papers')
      .list();
    
    if (listError) {
      console.error('Error listing bucket files:', listError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test file uploaded successfully',
      file: {
        name: fileName,
        path: data?.path,
        url: urlData?.publicUrl
      },
      bucketContents: bucketFiles || []
    });
  } catch (error) {
    console.error('Test upload error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 