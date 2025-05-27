'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

export default function InspectPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [solutions, setSolutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Initialize Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Fetch papers
        const { data: papersData, error: papersError } = await supabase
          .from('papers')
          .select('*')
          .order('created_at', { ascending: false });

        if (papersError) throw papersError;
        setPapers(papersData || []);

        // Fetch solutions
        const { data: solutionsData, error: solutionsError } = await supabase
          .from('solutions')
          .select('*')
          .order('created_at', { ascending: false });

        if (solutionsError) throw solutionsError;
        setSolutions(solutionsData || []);

      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent loading-spinner"></div>
          <p className="mt-2 text-muted-foreground">Loading database data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="status-error p-4 rounded-md border">
          <h2 className="text-lg font-medium mb-2">Error Loading Data</h2>
          <p>{error}</p>
        </div>
        <div className="mt-4">
          <Link href="/" className="btn-primary px-3 py-2 rounded transition-all">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Database Inspector</h1>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link href="/fix" className="btn-warning px-3 py-2 rounded transition-all">Go to Fix Page</Link>
        <Link href="/browse" className="btn-primary px-3 py-2 rounded transition-all">Go to Browse Page</Link>
        <Link href="/" className="btn-secondary px-3 py-2 rounded transition-all">Return Home</Link>
      </div>

      <div className="bg-card p-6 rounded-lg shadow-md mb-8 border-custom-color">
        <h2 className="text-xl font-semibold mb-4 text-card-foreground">Papers ({papers.length})</h2>

        {papers.length === 0 ? (
          <p className="text-gray-500 italic">No papers found in the database.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Title</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Paper Type</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">File Type</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {papers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3 text-sm text-gray-700">{paper.id.substring(0, 8)}...</td>
                    <td className="py-2 px-3 text-sm font-medium text-gray-900">{paper.title}</td>
                    <td className="py-2 px-3 text-sm text-gray-700">{paper.paper_type || 'not set'}</td>
                    <td className="py-2 px-3 text-sm text-gray-700">{paper.file_type || 'not set'}</td>
                    <td className="py-2 px-3 text-sm text-gray-700">{paper.status || 'not set'}</td>
                    <td className="py-2 px-3 text-sm text-gray-700">
                      {paper.created_at ? new Date(paper.created_at).toLocaleString() : 'not set'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Solutions ({solutions.length})</h2>

        {solutions.length === 0 ? (
          <p className="text-gray-500 italic">No solutions found in the database.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Paper ID</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Question ID</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">File Type</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {solutions.map((solution) => (
                  <tr key={solution.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3 text-sm text-gray-700">{solution.id.substring(0, 8)}...</td>
                    <td className="py-2 px-3 text-sm text-gray-700">{solution.paper_id.substring(0, 8)}...</td>
                    <td className="py-2 px-3 text-sm text-gray-700">{solution.question_id}</td>
                    <td className="py-2 px-3 text-sm text-gray-700">{solution.file_type || 'not set'}</td>
                    <td className="py-2 px-3 text-sm text-gray-700">
                      {solution.created_at ? new Date(solution.created_at).toLocaleString() : 'not set'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}