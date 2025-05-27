'use client';

import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  FileText,
  Download,
  BookOpenCheck,
  FileCheck,
  Search,
  PlusCircle,
  RefreshCw,
  Loader2,
  FileQuestion,
  Filter,
  X
} from 'lucide-react';
import { OrganizedPapers, PaperWithSolutions } from '../api/get-papers-organized/route';
import Link from 'next/link';

// Paper status badge component
const StatusBadge = ({ status }: { status: string }) => {
  let color = 'bg-surface text-surface-foreground';

  if (status === 'completed') {
    color = 'status-success';
  } else if (status === 'processing') {
    color = 'status-info';
  } else if (status === 'failed') {
    color = 'status-error';
  } else if (status === 'pending') {
    color = 'status-warning';
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// File type badge component
const FileBadge = ({ fileType }: { fileType: string }) => {
  const type = fileType.toLowerCase();
  let color = 'bg-surface text-surface-foreground';
  let icon = <FileText className="w-3 h-3 mr-1" />;

  if (type.includes('pdf')) {
    color = 'status-error';
  } else if (type.includes('doc') || type.includes('word')) {
    color = 'status-info';
  } else if (type.includes('xls') || type.includes('sheet')) {
    color = 'status-success';
  } else if (type.includes('ppt') || type.includes('presentation')) {
    color = 'status-warning';
  } else if (type.includes('jpg') || type.includes('jpeg') || type.includes('png')) {
    color = 'bg-surface text-primary';
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${color}`}>
      {icon}
      {fileType.toUpperCase()}
    </span>
  );
};

// Format file size
const formatFileSize = (bytes: number | null) => {
  if (bytes === null) return 'Unknown';
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function OrganizedPapersView() {
  const [organizedPapers, setOrganizedPapers] = useState<OrganizedPapers | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paperType, setPaperType] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Fetch papers function
  const fetchPapers = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (paperType !== 'all') queryParams.append('paperType', paperType);
      if (searchQuery.trim() !== '') queryParams.append('search', searchQuery);

      const response = await fetch(`/api/get-papers-organized?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch papers: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'An error occurred while fetching papers');
      }

      setOrganizedPapers(result.organizedPapers);
    } catch (err) {
      console.error('Error fetching papers:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on component mount and when filters change
  useEffect(() => {
    fetchPapers();
  }, [paperType, searchQuery]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle paper type change
  const handlePaperTypeChange = (type: string) => {
    setPaperType(type);
    setIsFilterOpen(false);
  };

  // Generate file URL for download
  const getFileUrl = (filePath: string) => {
    return `/api/download?filePath=${encodeURIComponent(filePath)}`;
  };

  // Paper Card component
  const PaperCard = ({ paper }: { paper: PaperWithSolutions }) => {
    const paperTypeDisplay = paper.paper_type
      ? paper.paper_type.charAt(0).toUpperCase() + paper.paper_type.slice(1)
      : 'Other';

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg">
        {/* Header with type badge */}
        <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
          <div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              {paper.paper_type?.includes('exam') ? (
                <BookOpenCheck className="w-3.5 h-3.5 mr-1" />
              ) : paper.paper_type?.includes('assignment') ? (
                <FileCheck className="w-3.5 h-3.5 mr-1" />
              ) : (
                <FileText className="w-3.5 h-3.5 mr-1" />
              )}
              {paperTypeDisplay} Document
            </span>
          </div>
          <StatusBadge status={paper.status} />
        </div>

        {/* Paper information */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2" title={paper.title}>
            {paper.title}
          </h3>

          <div className="text-xs text-gray-500 space-y-1.5 mb-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center">
                <span className="font-medium mr-1">ID:</span> {paper.id.slice(0, 8)}
              </span>
              <span>{formatDate(paper.created_at)}</span>
            </div>

            <div className="flex items-center justify-between">
              <FileBadge fileType={paper.file_type} />
              <span>{formatFileSize(paper.file_size)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-2 mb-4">
            <Link
              href={`/view?path=${encodeURIComponent(paper.file_path)}`}
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium py-1.5 px-3 rounded-md inline-flex items-center justify-center transition-colors"
            >
              <BookOpen className="w-4 h-4 mr-1.5" />
              View
            </Link>
            <a
              href={getFileUrl(paper.file_path)}
              className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-medium py-1.5 px-3 rounded-md inline-flex items-center justify-center transition-colors"
              download
            >
              <Download className="w-4 h-4 mr-1.5" />
              Download
            </a>
          </div>

          {/* Solutions section */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                <FileQuestion className="w-4 h-4 mr-1.5 text-indigo-500" />
                Solutions
                {paper.solutions && paper.solutions.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs">
                    {paper.solutions.length}
                  </span>
                )}
              </h4>
              {paper.status === 'completed' && (
                <Link
                  href={`/upload?paperId=${paper.id}&type=solution`}
                  className="text-xs text-indigo-600 hover:text-indigo-800 inline-flex items-center"
                >
                  <PlusCircle className="w-3 h-3 mr-1" />
                  Add Solution
                </Link>
              )}
            </div>

            {paper.solutions && paper.solutions.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {paper.solutions.map((solution) => (
                  <div key={solution.id} className="flex items-center justify-between text-xs">
                    <span className="truncate max-w-[60%]" title={`Question ID: ${solution.question_id}`}>
                      Q{solution.question_id || 'Unknown'}
                    </span>
                    <div className="flex space-x-1">
                      <Link
                        href={`/view?path=${encodeURIComponent(solution.file_path)}`}
                        className="text-blue-600 hover:text-blue-800 px-1.5 py-0.5 rounded"
                        title="View solution"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </Link>
                      <a
                        href={getFileUrl(solution.file_path)}
                        className="text-gray-600 hover:text-gray-800 px-1.5 py-0.5 rounded"
                        download
                        title="Download solution"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No solutions available yet</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Empty state component
  const EmptyState = ({ category }: { category: string }) => (
    <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 text-center">
      <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
      <h3 className="text-lg font-medium text-gray-700 mb-1">No {category} Found</h3>
      <p className="text-sm text-gray-500 mb-4">
        There are no {category.toLowerCase()} matching your search criteria.
      </p>
      <Link
        href="/upload"
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <PlusCircle className="w-4 h-4 mr-2" />
        Upload {category === 'Papers' ? 'a Paper' : category.slice(0, -1)}
      </Link>
    </div>
  );

  // Category display component
  const CategoryDisplay = ({ title, papers }: { title: string, papers: PaperWithSolutions[] }) => {
    if (!papers || papers.length === 0) return null;

    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          {title === 'Exams' ? (
            <BookOpenCheck className="w-5 h-5 mr-2 text-blue-600" />
          ) : title === 'Assignments' ? (
            <FileCheck className="w-5 h-5 mr-2 text-indigo-600" />
          ) : title === 'Notes' ? (
            <BookOpen className="w-5 h-5 mr-2 text-teal-600" />
          ) : (
            <FileText className="w-5 h-5 mr-2 text-gray-600" />
          )}
          {title}
          <span className="ml-2 text-sm font-normal text-gray-500">({papers.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map((paper) => (
            <PaperCard key={paper.id} paper={paper} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      {/* Filters section */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Organized Papers View</h1>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search papers..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Filter button (mobile) */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="md:hidden inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
              {paperType !== 'all' && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                  1
                </span>
              )}
            </button>

            {/* Desktop filters */}
            <div className="hidden md:flex space-x-2">
              <button
                onClick={() => handlePaperTypeChange('all')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  paperType === 'all'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => handlePaperTypeChange('exam')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  paperType === 'exam'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Exams
              </button>
              <button
                onClick={() => handlePaperTypeChange('assignment')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  paperType === 'assignment'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Assignments
              </button>
              <button
                onClick={() => handlePaperTypeChange('notes')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  paperType === 'notes'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Notes
              </button>
            </div>

            <button
              onClick={fetchPapers}
              className="inline-flex items-center px-3 py-2 refresh-button rounded-md"
              title="Refresh papers"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile filters dropdown */}
        {isFilterOpen && (
          <div className="md:hidden bg-gray-50 p-3 rounded-md mt-2 border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-700">Filter by Type</h4>
              <button
                onClick={() => setIsFilterOpen(false)}
                title="Close filter options">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => handlePaperTypeChange('all')}
                className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                  paperType === 'all'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => handlePaperTypeChange('exam')}
                className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                  paperType === 'exam'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Exams
              </button>
              <button
                onClick={() => handlePaperTypeChange('assignment')}
                className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                  paperType === 'assignment'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Assignments
              </button>
              <button
                onClick={() => handlePaperTypeChange('notes')}
                className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                  paperType === 'notes'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Notes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="ml-2 text-gray-600">Loading papers...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Error: {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && !error && organizedPapers && (
        <div>
          {Object.keys(organizedPapers).filter(key =>
            (organizedPapers as any)[key].length > 0
          ).length === 0 ? (
            <EmptyState category="Papers" />
          ) : (
            <div>
              <CategoryDisplay title="Exams" papers={organizedPapers.exam} />
              <CategoryDisplay title="Assignments" papers={organizedPapers.assignment} />
              <CategoryDisplay title="Notes" papers={organizedPapers.notes} />
              <CategoryDisplay title="Other Materials" papers={organizedPapers.other} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}