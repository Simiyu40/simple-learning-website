import React, { useEffect, useState } from 'react';
import {
  File, FolderOpen, RefreshCw, Search, FileQuestion,
  Download, Plus, FileText, BookOpenCheck, ClipboardCheck,
  Filter, X
} from 'lucide-react';

interface Paper {
  id: string;
  title: string;
  file_path: string;
  file_type: string;
  file_size: number;
  paper_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  uploaded_at?: string;
  public_url?: string;
}

interface CategoryGroup {
  [key: string]: Paper[];
}

const OrganizedPapersView = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [categorizedPapers, setCategorizedPapers] = useState<CategoryGroup>({});
  const [filteredCategories, setFilteredCategories] = useState<CategoryGroup>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [error, setError] = useState('');

  const fetchPapers = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/get-papers?query=${searchQuery}`);
      const data = await response.json();

      if (data.success) {
        // Store the papers data directly from the API response
        const papers = data.papers || {};
        setCategorizedPapers(papers);
        setFilteredCategories(papers);

        // For backwards compatibility, create a flat list of all papers
        const allPapers: Paper[] = [];
        Object.values(papers).forEach((group: any) => {
          if (Array.isArray(group)) {
            allPapers.push(...group);
          }
        });
        setPapers(allPapers);

        console.log('API Response:', data);
        console.log('Categorized Papers:', data.papers);
      } else {
        setError('Failed to fetch papers: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setError('Error connecting to the server');
      console.error('Error fetching papers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter papers when activeFilter changes
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredCategories(categorizedPapers);
    } else {
      const filtered: CategoryGroup = {};
      if (categorizedPapers[activeFilter]) {
        filtered[activeFilter] = categorizedPapers[activeFilter];
      }
      setFilteredCategories(filtered);
    }
  }, [activeFilter, categorizedPapers]);

  useEffect(() => {
    fetchPapers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPapers();
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'exam':
        return <BookOpenCheck className="h-5 w-5 text-blue-600" />;
      case 'assignment':
        return <ClipboardCheck className="h-5 w-5 text-green-600" />;
      case 'notes':
        return <FileText className="h-5 w-5 text-amber-600" />;
      default:
        return <File className="h-5 w-5 text-gray-600" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category.toLowerCase()) {
      case 'exam':
        return 'Exams';
      case 'assignment':
        return 'Assignments';
      case 'notes':
        return 'Notes';
      case 'uncategorized':
        return 'Uncategorized';
      default:
        return 'Other Files';
    }
  };

  const getFileTypeLabel = (fileType: string) => {
    return (fileType || '').toUpperCase();
  };

  // Helper for file size display
  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Loading papers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500 mb-2">{error}</div>
        <button
          type="button"
          onClick={fetchPapers}
          className="px-4 py-2 btn-primary rounded flex items-center mx-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold flex items-center">
          <FolderOpen className="h-5 w-5 mr-2 text-blue-500" />
          Read View
        </h2>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mt-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search papers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute left-3 top-2.5">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <button
              type="submit"
              className="absolute right-2 top-2 px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Search
            </button>
          </div>
        </form>

        {/* Filter tabs */}
        {Object.keys(categorizedPapers).length > 0 && (
          <div className="mt-4 flex items-center border-b pb-2">
            <Filter className="h-4 w-4 mr-2 text-gray-500" />
            <div className="flex space-x-2 overflow-x-auto whitespace-nowrap pb-1">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 text-sm rounded-full ${
                  activeFilter === 'all'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                All
              </button>

              {Object.keys(categorizedPapers).sort().map(category => (
                <button
                  key={category}
                  onClick={() => setActiveFilter(category)}
                  className={`px-3 py-1 text-sm rounded-full ${
                    activeFilter === category
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {getCategoryLabel(category)}
                </button>
              ))}

              {activeFilter !== 'all' && (
                <button
                  onClick={() => setActiveFilter('all')}
                  className="ml-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                  title="Clear filter"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        {Object.keys(filteredCategories).length === 0 ? (
          <div className="text-center py-8">
            <FileQuestion className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No papers found. Upload a paper to get started.</p>
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center mx-auto"
              onClick={() => window.location.href = '/upload-example'}
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Paper
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(filteredCategories).map(([category, papers]) => (
              <div key={category} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b flex items-center">
                  {getCategoryIcon(category)}
                  <h3 className="font-medium text-gray-800 ml-2">
                    {getCategoryLabel(category)} ({papers.length})
                  </h3>
                </div>

                <div className="divide-y">
                  {papers.map((paper) => (
                    <div key={paper.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-1">
                            <div className="bg-gray-100 rounded p-1">
                              <span className="text-xs font-bold text-gray-600">
                                {getFileTypeLabel(paper.file_type || 'UNK')}
                              </span>
                            </div>
                          </div>

                          <div className="ml-3">
                            <h4 className="font-medium text-gray-900">{paper.title}</h4>
                            <div className="mt-1 flex items-center text-sm text-gray-500 space-x-3">
                              <span>{formatFileSize(paper.file_size || 0)}</span>
                              <span>•</span>
                              <span>
                                {new Date(paper.created_at || paper.uploaded_at || Date.now()).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <a
                          href={paper.public_url || `/api/download?path=${paper.file_path}&bucket=papers`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-500 hover:text-blue-700 px-3 py-1 border border-blue-200 rounded-md hover:bg-blue-50"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          <span className="text-sm">Download</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizedPapersView;