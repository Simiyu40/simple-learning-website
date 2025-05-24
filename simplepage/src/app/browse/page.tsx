'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { File, FileText, Loader, RefreshCw, Search, Filter, ClipboardCheck, FileQuestion, NotebookPen, BookOpen, Eye, Download, Plus, Lightbulb, Calendar, FileType, HardDrive, CheckCircle, Clock, Loader2, AlertCircle, Image, InfoIcon, Upload, X, BookOpenCheck, FileCheck, Trash2 } from 'lucide-react';
import UploadForms from '@/components/UploadForms';
import { Dialog } from '@radix-ui/react-dialog';
import { FileViewer } from '@/components/FileViewer';

interface Paper {
  id: string;
  title: string;
  file_path: string;
  created_at: string;
  file_type: string;
  file_size?: number;
  status?: string;
  paper_type?: string;
}

interface Solution {
  id: string;
  paper_id: string;
  question_id: string;
  file_path: string;
  created_at: string;
  file_type: string;
}

interface StorageFile {
  name: string;
  id: string;
  bucket: 'papers' | 'solutions';
  created_at?: string;
  updated_at?: string;
  last_modified_at?: string;
}

export default function BrowsePage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [solutions, setSolutions] = useState<{ [key: string]: Solution[] }>({});
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [highlightedFile, setHighlightedFile] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<{
    url: string;
    title: string;
    fileType: string;
  } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    file: StorageFile;
    show: boolean;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPapersAndSolutions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all papers
      const { data: papers, error: papersError } = await supabase
        .from('papers')
        .select('*')
        .order('created_at', { ascending: false });
      if (papersError) throw papersError;
      setPapers(papers || []);

      // Fetch all solutions
      const { data: allSolutions, error: solutionsError } = await supabase
        .from('solutions')
        .select('*')
        .order('created_at', { ascending: false });
      if (solutionsError) throw solutionsError;

      // Group solutions by paper_id
      const grouped: { [key: string]: Solution[] } = {};
      (allSolutions || []).forEach((sol) => {
        if (!grouped[sol.paper_id]) grouped[sol.paper_id] = [];
        grouped[sol.paper_id].push(sol);
      });
      setSolutions(grouped);
    } catch (error) {
      console.error('Error fetching papers or solutions:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch papers or solutions');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStorageFiles = useCallback(async () => {
    try {
      setLoading(true);
      // Clear any previous error
      setError(null);

      // Fetch files from papers bucket
      const { data: papersFiles, error: papersError } = await supabase.storage
        .from('papers')
        .list('', { sortBy: { column: 'created_at', order: 'desc' } });

      if (papersError) {
        console.error('Error fetching papers from storage:', papersError);
      }

      // Fetch files from solutions bucket
      const { data: solutionsFiles, error: solutionsError } = await supabase.storage
        .from('solutions')
        .list('', { sortBy: { column: 'created_at', order: 'desc' } });

      if (solutionsError) {
        console.error('Error fetching solutions from storage:', solutionsError);
      }

      // Process and combine the files
      const allFiles: StorageFile[] = [
        ...(papersFiles || []).map(file => ({
          ...file,
          bucket: 'papers',
        } as StorageFile)),
        ...(solutionsFiles || []).map(file => ({
          ...file,
          bucket: 'solutions',
        } as StorageFile)),
      ].sort((a, b) => {
        const dateA = a.created_at || a.updated_at || a.last_modified_at || '';
        const dateB = b.created_at || b.updated_at || b.last_modified_at || '';
        return dateB.localeCompare(dateA); // Sort newest first
      });

      setStorageFiles(allFiles);
    } catch (error) {
      console.error('Error fetching storage files:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch storage files');
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadFile = async (path: string, bucketName: 'papers' | 'solutions') => {
    try {
      setIsLoading(true);

      // Log the download attempt
      console.log(`Downloading from ${bucketName}/${path}`);

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

    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFileUrl = (path: string, bucketName: 'papers' | 'solutions') => {
    try {
      // Log the path to debug
      console.log(`Getting URL for ${bucketName}/${path}`);

      if (!path) {
        console.error('Empty file path provided');
        return '#';
      }

      // Remove any leading slashes from the path
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;

      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(cleanPath);

      console.log('Generated URL:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return '#';
    }
  };

  const handleDeleteFile = async (file: StorageFile) => {
    try {
      setIsDeleting(true);

      // Call the delete API endpoint
      const params = new URLSearchParams({
        filePath: file.name,
        bucket: file.bucket
      });

      const response = await fetch(`/api/delete-file?${params}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete file');
      }

      // Remove the file from the local state
      setStorageFiles(prev => prev.filter(f => !(f.name === file.name && f.bucket === file.bucket)));

      // Close the confirmation dialog
      setDeleteConfirmation(null);

      // Show success message (you could add a toast notification here)
      console.log('File deleted successfully:', result);

    } catch (error) {
      console.error('Error deleting file:', error);
      setError(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (file: StorageFile) => {
    setDeleteConfirmation({ file, show: true });
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const switchToReadViewForFile = (filePath: string) => {
    // Remove any leading slashes from the path
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    setHighlightedFile(cleanPath);
    setViewMode('storage');

    // Clear the highlight after 3 seconds
    setTimeout(() => {
      setHighlightedFile(null);
    }, 3000);
  };

  useEffect(() => {
    fetchStorageFiles();
  }, [fetchStorageFiles]);

  // Handler to open modal and set selected paper
  const handleOpenSolutionModal = (paper: Paper) => {
    setSelectedPaper(paper);
    setShowSolutionModal(true);
  };

  // Handler to close modal
  const handleCloseSolutionModal = () => {
    setShowSolutionModal(false);
    setSelectedPaper(null);
  };

  // Additional handler to refresh data after solution upload
  const handleSolutionUploaded = () => {
    handleCloseSolutionModal();
    setLoading(true);
    fetchPapersAndSolutions();
  };

  // Group papers by category
  const getPapersByCategory = () => {
    const categories: Record<string, Paper[]> = {
      'exam': [],
      'assignment': [],
      'notes': [],
      'other': []
    };

    // Filter papers based on search query
    const filtered = papers.filter(paper =>
      !searchQuery || paper.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group by category
    filtered.forEach(paper => {
      // Default to 'other' if paper_type is null, undefined, or empty string
      const category = paper.paper_type?.trim() || 'other';

      // Ensure the category exists in our categories object
      if (!categories[category]) {
        categories.other.push(paper);
      } else {
        categories[category].push(paper);
      }
    });

    return categories;
  };

  // New function to filter papers by category and search query
  const getFilteredPapers = () => {
    return papers.filter(paper => {
      // Get normalized paper_type, defaulting to 'other'
      const paperType = paper.paper_type?.trim() || 'other';

      // Apply category filter
      if (selectedCategory !== 'all' && paperType !== selectedCategory) {
        return false;
      }

      // Apply search filter
      if (searchQuery && !paper.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  };

  const handleViewFile = async (paper: Paper) => {
    try {
      const fileType = paper.file_type || getFileTypeFromName(paper.file_path);
      const url = getFileUrl(paper.file_path, 'papers');
      setViewingFile({
        url,
        title: paper.title,
        fileType
      });
    } catch (error) {
      console.error('Error viewing file:', error);
      setError('Failed to open file viewer. Please try again.');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <Loader className="h-8 w-8 animate-spin text-blue-500 mb-4" />
      <p className="text-gray-600">Loading files from storage...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="text-red-500 font-medium mb-2">Error loading content</div>
      <p className="text-red-700">{error}</p>
      <button
        type="button"
        onClick={() => fetchStorageFiles()}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Try Again
      </button>
    </div>
  );

  const filteredPapers = getFilteredPapers();
  const categories = getPapersByCategory();

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File className="h-5 w-5 text-gray-400" />;

    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return <File className="h-5 w-5 text-gray-400" />;
    }
  };

  // Function to extract readable filename
  const getReadableFileName = (filePath: string) => {
    // Remove timestamp prefix if present (format: timestamp-filename.ext)
    const parts = filePath.split('-');
    if (parts.length > 1 && !isNaN(Number(parts[0]))) {
      // If first part is a number (timestamp), remove it
      return parts.slice(1).join('-');
    }
    return filePath;
  };

  // Function to get the file type from filename
  const getFileTypeFromName = (fileName: string) => {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : 'unknown';
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8" suppressHydrationWarning>
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" suppressHydrationWarning>Learning Resources</h1>
        <p className="text-gray-600 dark:text-gray-400" suppressHydrationWarning>
          Browse and download educational papers and solutions
          </p>
        </div>

      {/* Controls Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchStorageFiles();
            }}
            className="flex items-center gap-1 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Read View */}
      {storageFiles.length > 0 && (
          <div className="grid gap-4">
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bucket</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {storageFiles
                    .filter(file => !searchQuery || file.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((file) => {
                    const fileType = getFileTypeFromName(file.name);
                    const readableName = getReadableFileName(file.name);

                    return (
                    <tr key={`${file.bucket}-${file.name}`}
                      className={`hover:bg-gray-50 transition-colors ${
                        highlightedFile === file.name ? 'bg-yellow-100 animate-pulse' : ''
                      }`}
                    >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                          {fileType.toLowerCase() === 'pdf' ? (
                            <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
                          ) : fileType.toLowerCase() === 'doc' || fileType.toLowerCase() === 'docx' ? (
                            <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                          ) : fileType.toLowerCase() === 'jpg' || fileType.toLowerCase() === 'jpeg' || fileType.toLowerCase() === 'png' ? (
                            <Image className="h-5 w-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <File className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          )}
                          <div className="ml-4 truncate max-w-xs">
                            <div className="text-sm font-medium text-gray-900 truncate">{readableName}</div>
                            <div className="text-xs text-gray-500 truncate">{file.id}</div>
                            {file.created_at && (
                              <div className="text-xs text-gray-400 flex items-center mt-1">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(file.created_at).toLocaleDateString()}
                              </div>
                            )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {fileType.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            file.bucket === 'papers' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                          {file.bucket === 'papers' ? (
                            <><BookOpen className="h-3 w-3 mr-1" /> Papers</>
                          ) : (
                            <><Lightbulb className="h-3 w-3 mr-1" /> Solutions</>
                          )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <a
                            href={getFileUrl(file.name, file.bucket)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </a>
                          <button
                            type="button"
                            onClick={() => downloadFile(file.name, file.bucket)}
                            className="inline-flex items-center text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(file)}
                            className="inline-flex items-center text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition-colors"
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
      )}

      {/* Empty state for storage files */}
      {storageFiles.length === 0 && (
        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-12 text-center">
          <div className="bg-white p-5 rounded-full shadow-sm mb-4">
            <HardDrive className="h-16 w-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No files found in storage</h3>
          <p className="text-gray-500 mb-6 max-w-md">
            No files have been uploaded to storage yet. Upload content through the upload page to get started.
          </p>
          <div className="flex space-x-3">
            <a
              href="/upload-example"
              className="px-5 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Go to Upload Page
            </a>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                fetchStorageFiles();
              }}
              className="px-5 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium flex items-center"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      )}

      {viewingFile && (
        <FileViewer
          url={viewingFile.url}
          title={viewingFile.title}
          fileType={viewingFile.fileType}
          onClose={() => setViewingFile(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation?.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete File
                </h3>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete this file? This action cannot be undone.
              </p>
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  {getFileIcon(getFileTypeFromName(deleteConfirmation.file.name))}
                  <div className="ml-2">
                    <p className="text-sm font-medium text-gray-900">
                      {getReadableFileName(deleteConfirmation.file.name)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {deleteConfirmation.file.bucket === 'papers' ? 'Paper' : 'Solution'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFile(deleteConfirmation.file)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}