'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FixPage() {
  const [status, setStatus] = useState<{
    message: string;
    isError: boolean;
    details?: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runManualFix = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      const response = await fetch('/api/manual-fix');
      const data = await response.json();
      
      if (data.success) {
        setStatus({
          message: 'Manual fix completed successfully!',
          isError: false,
          details: data
        });
      } else {
        setStatus({
          message: `Error: ${data.error || 'Unknown error'}`,
          isError: true,
          details: data
        });
      }
    } catch (error) {
      setStatus({
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isError: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runDirectFix = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      const response = await fetch('/api/direct-fix');
      const data = await response.json();
      
      if (data.success) {
        setStatus({
          message: 'Direct fix completed successfully!',
          isError: false,
          details: data
        });
      } else {
        setStatus({
          message: `Error: ${data.error || 'Unknown error'}`,
          isError: true,
          details: data
        });
      }
    } catch (error) {
      setStatus({
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isError: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runAllFixes = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      // Run manual fix first
      const manualResponse = await fetch('/api/manual-fix');
      const manualData = await manualResponse.json();
      
      if (!manualData.success) {
        throw new Error(manualData.error || 'Manual fix failed');
      }
      
      // Then run direct fix
      const directResponse = await fetch('/api/direct-fix');
      const directData = await directResponse.json();
      
      if (!directData.success) {
        throw new Error(directData.error || 'Direct fix failed');
      }
      
      // Return combined results
      setStatus({
        message: 'All fixes completed successfully!',
        isError: false,
        details: {
          manualFix: manualData,
          directFix: directData
        }
      });
    } catch (error) {
      setStatus({
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isError: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Emergency Fix</h1>
        <p className="text-gray-600">Fix paper categorization issues</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h2 className="text-lg font-medium text-yellow-800 mb-2">Warning</h2>
          <p className="text-yellow-700 text-sm">
            This page provides direct fixes for paper categorization and display issues. 
            Use this if you are not seeing papers in the Organized View.
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">Complete Fix (Recommended)</h3>
            <p className="text-sm text-blue-700 mb-4">
              Run all fixes to address database schema issues and ensure papers display correctly.
            </p>
            <button
              onClick={runAllFixes}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              {isLoading ? 'Running All Fixes...' : 'Run Complete Fix'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-md">
              <h3 className="font-medium mb-2">Schema Fix</h3>
              <p className="text-sm text-gray-600 mb-4">
                Fix database schema issues with the paper_type column.
              </p>
              <button
                onClick={runManualFix}
                disabled={isLoading}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm"
              >
                {isLoading ? 'Running...' : 'Run Schema Fix'}
              </button>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-md">
              <h3 className="font-medium mb-2">Display Fix</h3>
              <p className="text-sm text-gray-600 mb-4">
                Ensure all papers have the required fields for display.
              </p>
              <button
                onClick={runDirectFix}
                disabled={isLoading}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
              >
                {isLoading ? 'Running...' : 'Run Display Fix'}
              </button>
            </div>
          </div>
        </div>
        
        {status && (
          <div className={`mt-6 p-4 rounded-md ${status.isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            <p className="font-medium mb-2">{status.message}</p>
            
            {status.details && !status.isError && (
              <div className="mt-4 border-t border-green-200 pt-4">
                <h3 className="font-medium mb-2">Details</h3>
                <pre className="bg-white p-3 rounded text-sm overflow-auto max-h-60">
                  {JSON.stringify(status.details, null, 2)}
                </pre>
                
                {status.details.samplePapers && status.details.samplePapers.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Sample Papers</h3>
                    <ul className="bg-white p-3 rounded text-sm">
                      {status.details.samplePapers.map((paper: any) => (
                        <li key={paper.id} className="mb-2 pb-2 border-b border-gray-100">
                          <strong>Title:</strong> {paper.title}<br />
                          <strong>Type:</strong> {paper.paper_type || 'not set'}<br />
                          <strong>ID:</strong> {paper.id}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-200">
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Home
          </Link>
          <Link href="/browse" className="text-blue-600 hover:underline">
            Go to Browse Page
          </Link>
        </div>
      </div>
    </div>
  );
} 