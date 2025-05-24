import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simplified interfaces that only include fields that actually exist in the database
export interface MinimalPaper {
  id: string;
  title: string;
  file_path: string;
  file_type: string;
  created_at: string;
  user_id?: string;
  status?: string;
}

export interface MinimalSolution {
  id: string;
  paper_id: string;
  question_id: string;
  file_path: string;
  file_type: string;
  created_at: string;
  user_id?: string;
  content?: string;
}

// Helper function to get public URL for a file
export function getFileUrl(path: string, bucketName: 'papers' | 'solutions') {
  if (!path) {
    console.error('Empty file path provided');
    return '#';
  }

  // Remove any leading slashes from the path
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;

  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(cleanPath);

  return data.publicUrl;
}

// Helper function to download a file
export async function downloadFile(path: string, bucketName: 'papers' | 'solutions') {
  try {
    if (!path) {
      console.error('Empty file path provided');
      throw new Error('File path is empty');
    }

    // Remove any leading slashes from the path
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(cleanPath);

    if (error) {
      console.error('Download error:', error);
      throw error;
    }

    // Create and click a download link for the file
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = cleanPath.split('/').pop() || 'download';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return true;
  } catch (error) {
    console.error('Error downloading file:', error);
    return false;
  }
}

// Helper function to delete a file and its database record
export async function deleteFile(path: string, bucketName: 'papers' | 'solutions', recordId?: string) {
  try {
    if (!path) {
      console.error('Empty file path provided');
      throw new Error('File path is empty');
    }

    // Remove any leading slashes from the path
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;

    // Call the delete API endpoint
    const params = new URLSearchParams({
      filePath: cleanPath,
      bucket: bucketName
    });

    if (recordId) {
      params.append('recordId', recordId);
    }

    const response = await fetch(`/api/delete-file?${params}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to delete file');
    }

    return result;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}