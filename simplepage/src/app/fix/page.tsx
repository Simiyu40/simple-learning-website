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
        <h1 className="text-3xl font-bold mb-2 text-foreground">Emergency Fix</h1>
        <p className="text-muted-foreground">Fix paper categorization issues</p>
      </div>

      <div className="card p-6 rounded-lg">
        <div className="mb-6 p-4 border rounded-md status-warning">
          <h2 className="text-lg font-medium mb-2">Warning</h2>
          <p className="text-sm">
            This page provides direct fixes for paper categorization and display issues.
            Use this if you are not seeing papers in the Organized View.
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-4 border rounded-md fix-section">
            <h3 className="font-medium mb-2 fix-section-title">Complete Fix (Recommended)</h3>
            <p className="text-sm mb-4 text-muted-foreground">
              Run all fixes to address database schema issues and ensure papers display correctly.
            </p>
            <button
              type="button"
              onClick={runAllFixes}
              disabled={isLoading}
              className="w-full btn-primary px-6 py-3 rounded-md transition-all disabled:opacity-50 font-medium"
            >
              {isLoading ? 'Running All Fixes...' : 'Run Complete Fix'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-md card">
              <h3 className="font-medium mb-2 text-card-foreground">Schema Fix</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Fix database schema issues with the paper_type column.
              </p>
              <button
                type="button"
                onClick={runManualFix}
                disabled={isLoading}
                className="w-full btn-secondary px-4 py-2 rounded-md transition-all disabled:opacity-50 text-sm"
              >
                {isLoading ? 'Running...' : 'Run Schema Fix'}
              </button>
            </div>

            <div className="p-4 border rounded-md card">
              <h3 className="font-medium mb-2 text-card-foreground">Display Fix</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ensure all papers have the required fields for display.
              </p>
              <button
                type="button"
                onClick={runDirectFix}
                disabled={isLoading}
                className="w-full btn-info px-4 py-2 rounded-md transition-all disabled:opacity-50 text-sm"
              >
                {isLoading ? 'Running...' : 'Run Display Fix'}
              </button>
            </div>
          </div>
        </div>

        {status && (
          <div className={`mt-6 p-4 rounded-md ${status.isError ? 'status-error' : 'status-success'}`}>
            <p className="font-medium mb-2">{status.message}</p>

            {status.details && !status.isError && (
              <div className="mt-4 border-t pt-4 details-border">
                <h3 className="font-medium mb-2">Details</h3>
                <pre className="card p-3 rounded text-sm overflow-auto max-h-60">
                  {JSON.stringify(status.details, null, 2)}
                </pre>

                {status.details.samplePapers && status.details.samplePapers.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Sample Papers</h3>
                    <ul className="card p-3 rounded text-sm">
                      {status.details.samplePapers.map((paper: any) => (
                        <li key={paper.id} className="mb-2 pb-2 border-b sample-paper-item">
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

        <div className="flex justify-between items-center mt-8 pt-4 border-t navigation-footer">
          <Link href="/" className="btn-secondary px-3 py-2 rounded transition-all">
            Return to Home
          </Link>
          <Link href="/browse" className="btn-primary px-3 py-2 rounded transition-all">
            Go to Browse Page
          </Link>
        </div>
      </div>
    </div>
  );
}