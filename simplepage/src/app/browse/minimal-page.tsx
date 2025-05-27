'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase-minimal';
import { MinimalPaper, MinimalSolution, getFileUrl, downloadFile } from '@/lib/supabase-minimal';
import { File, FileText, Loader, RefreshCw } from 'lucide-react';
import UploadForms from '@/components/UploadForms';

interface StorageFile {
  name: string;
  id: string;
  bucket: 'papers' | 'solutions';
  created_at?: string;
  updated_at?: string;
  last_modified_at?: string;
}

export default function MinimalBrowsePage() {
  const [papers, setPapers] = useState<MinimalPaper[]>([]);
  const [solutions, setSolutions] = useState<{ [key: string]: MinimalSolution[] }>({});
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'database' | 'storage'>('database');
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<MinimalPaper | null>(null);

  const fetchPapersAndSolutions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data from our minimal API
      const response = await fetch('/api/fetch-minimal-data');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch data');
      }

      setPapers(data.results.papers || []);
      setSolutions(data.results.solutions || {});

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
      setError(null);

      // Fetch files from storage directly
      const response = await fetch('/api/list-storage');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch storage files');
      }

      // Combine papers and solutions
      const allFiles = [
        ...(data.results.papers || []),
        ...(data.results.solutions || [])
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

  useEffect(() => {
    if (viewMode === 'database') {
      fetchPapersAndSolutions();
    } else {
      fetchStorageFiles();
    }
  }, [fetchPapersAndSolutions, fetchStorageFiles, viewMode]);

  // Handler to open modal and set selected paper
  const handleOpenSolutionModal = (paper: MinimalPaper) => {
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <Loader className="h-8 w-8 animate-spin text-blue-500 mb-4" />
      <p className="text-gray-600">Loading {viewMode === 'database' ? 'papers and solutions' : 'files from storage'}...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="text-red-500 font-medium mb-2">Error loading content</div>
      <p className="text-red-700">{error}</p>
      <button
        onClick={() => viewMode === 'database' ? fetchPapersAndSolutions() : fetchStorageFiles()}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Try Again
      </button>
    </div>
  );

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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 border-b pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Browse Papers and Solutions</h1>
          <p className="text-muted-foreground mt-2">
            View and download uploaded papers and their solutions
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex border rounded overflow-hidden">
            <button
              onClick={() => setViewMode('database')}
              className={`px-3 py-2 text-sm ${viewMode === 'database' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Database View
            </button>
            <button
              onClick={() => setViewMode('storage')}
              className={`px-3 py-2 text-sm ${viewMode === 'storage' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Read View
            </button>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              viewMode === 'database' ? fetchPapersAndSolutions() : fetchStorageFiles();
            }}
            className="flex items-center gap-1 px-3 py-2 text-sm refresh-button rounded-md"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {viewMode === 'database' ? (
        papers.length > 0 ? (
          <div className="grid gap-8">
            {papers.map((paper) => (
              <div key={paper.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {getFileIcon(paper.file_type)}
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {paper.title}
                      </h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Uploaded on {new Date(paper.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Format: {paper.file_type ? paper.file_type.toUpperCase() : 'Unknown'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <a
                      href={getFileUrl(paper.file_path, 'papers')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-colors"
                    >
                      View Paper
                    </a>
                    <button
                      onClick={() => downloadFile(paper.file_path, 'papers')}
                      className="block w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleOpenSolutionModal(paper)}
                      className="block w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                    >
                      Upload Solution
                    </button>
                  </div>
                </div>

                {/* Solutions Section */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Solutions</h3>
                  {solutions[paper.id]?.length > 0 ? (
                    <div className="grid gap-3">
                      {solutions[paper.id].map((solution) => (
                        <div
                          key={solution.id}
                          className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {getFileIcon(solution.file_type)}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                Question {solution.question_id}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Added: {new Date(solution.created_at).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-400">
                                Format: {solution.file_type ? solution.file_type.toUpperCase() : 'Unknown'}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <a
                              href={getFileUrl(solution.file_path, 'solutions')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 transition-colors"
                            >
                              View
                            </a>
                            <button
                              onClick={() => downloadFile(solution.file_path, 'solutions')}
                              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic text-center py-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                      No solutions uploaded yet for this paper.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center bg-card rounded-lg p-12 border-custom-color shadow-md text-center">
            <File className="h-16 w-16 text-primary mb-4" />
            <h3 className="text-xl font-semibold text-card-foreground mb-2">No Papers Found in Database</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              You haven't uploaded any papers to the database yet. Upload your first paper to get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/"
                className="px-5 py-3 btn-primary rounded-md transition-colors font-medium"
              >
                Go to Upload Page
              </a>
              <button
                onClick={() => fetchPapersAndSolutions()}
                className="px-5 py-3 refresh-button rounded-md"
              >
                Refresh View
              </button>
            </div>
          </div>
        )
      ) : (
        storageFiles.length > 0 ? (
          <div className="grid gap-4">
            <div className="bg-yellow-50 p-4 rounded border border-yellow-200 mb-4">
              <p className="text-yellow-700 text-sm">
                <strong>Read View:</strong> Showing all files in storage buckets, including those without database records.
              </p>
            </div>
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
                  {storageFiles.map((file) => {
                    const fileType = getFileTypeFromName(file.name);
                    const readableName = getReadableFileName(file.name);

                    return (
                      <tr key={`${file.bucket}-${file.name}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getFileIcon(fileType)}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{readableName}</div>
                              <div className="text-sm text-gray-500">{file.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {fileType.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            file.bucket === 'papers' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {file.bucket}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <a
                            href={getFileUrl(file.name, file.bucket)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            View
                          </a>
                          <button
                            onClick={() => downloadFile(file.name, file.bucket)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Download
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
            <File className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No files found in storage</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
              No files have been uploaded to storage yet. Upload some files first.
            </p>
            <a
              href="/"
              className="px-5 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Upload Page
            </a>
          </div>
        )
      )}

      {/* Solution Upload Modal */}
      {showSolutionModal && selectedPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold"
              onClick={handleCloseSolutionModal}
            >
              ×
            </button>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Upload Solution for Paper: <span className="text-blue-600">{selectedPaper.title}</span>
            </h2>

            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-600 text-sm">
                <strong>Note:</strong> Your solution will be uploaded and linked to this paper in the database.
                It will be visible in the Database View.
              </p>
            </div>

            <UploadForms
              papers={[selectedPaper]}
              onPaperUpload={() => {}}
              onSolutionUpload={handleSolutionUploaded}
            />
          </div>
        </div>
      )}
    </div>
  );
}