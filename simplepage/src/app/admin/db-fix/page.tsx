'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DbFixPage() {
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runInitialSetup = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      const response = await fetch('/api/db-setup');
      const data = await response.json();
      
      if (data.success) {
        setStatus({
          message: 'Database initialized successfully!',
          isError: false
        });
      } else {
        setStatus({
          message: `Error: ${data.error || 'Unknown error'}`,
          isError: true
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

  const applyPaperTypeMigration = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      const response = await fetch('/api/apply-migration');
      const data = await response.json();
      
      if (data.success) {
        setStatus({
          message: 'Paper type migration applied successfully!',
          isError: false
        });
      } else {
        setStatus({
          message: `Error: ${data.error || 'Unknown error'}`,
          isError: true
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

  const categorizePapers = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      const response = await fetch('/api/categorize-papers');
      const data = await response.json();
      
      if (data.success) {
        setStatus({
          message: data.message || 'Papers categorized successfully!',
          isError: false
        });
      } else {
        setStatus({
          message: `Error: ${data.error || 'Unknown error'}`,
          isError: true
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

  const runCompleteSetup = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      // Step 1: Initialize database schema
      const setupResponse = await fetch('/api/db-setup');
      const setupData = await setupResponse.json();
      
      if (!setupData.success) {
        throw new Error(setupData.error || 'Failed to initialize database schema');
      }
      
      // Step 2: Apply paper type migration
      const migrationResponse = await fetch('/api/apply-migration');
      const migrationData = await migrationResponse.json();
      
      if (!migrationData.success) {
        throw new Error(migrationData.error || 'Failed to apply paper type migration');
      }
      
      // Step 3: Categorize papers
      const categorizeResponse = await fetch('/api/categorize-papers');
      const categorizeData = await categorizeResponse.json();
      
      setStatus({
        message: 'Complete setup successful! Database schema initialized, migrations applied, and papers categorized.',
        isError: false
      });
    } catch (error) {
      setStatus({
        message: `Error during complete setup: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isError: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Administration</h1>
        <p className="text-gray-600">Fix database schema and run migrations</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Database Actions</h2>
        
        {/* One-Click Complete Setup */}
        <div className="p-4 mb-6 border border-blue-200 rounded-md bg-blue-50">
          <h3 className="font-medium mb-2 text-blue-800">Quick Fix (Recommended)</h3>
          <p className="text-sm text-blue-700 mb-4">
            Run all database setup steps with a single click. This will initialize the schema, apply migrations, and categorize papers.
          </p>
          <button
            onClick={runCompleteSetup}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 w-full"
          >
            {isLoading ? 'Running...' : 'Run Complete Setup'}
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-md">
            <h3 className="font-medium mb-2">Initial Schema Setup</h3>
            <p className="text-sm text-gray-600 mb-4">
              Run the initial database schema setup to create tables and constraints.
            </p>
            <button
              onClick={runInitialSetup}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Running...' : 'Initialize Database Schema'}
            </button>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-md">
            <h3 className="font-medium mb-2">Add Paper Type Column</h3>
            <p className="text-sm text-gray-600 mb-4">
              Apply migration to add the paper_type column for categorizing papers.
            </p>
            <button
              onClick={applyPaperTypeMigration}
              disabled={isLoading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Applying...' : 'Apply Paper Type Migration'}
            </button>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-md">
            <h3 className="font-medium mb-2">Auto-Categorize Papers</h3>
            <p className="text-sm text-gray-600 mb-4">
              Automatically categorize papers based on their titles (exams, assignments, notes).
            </p>
            <button
              onClick={categorizePapers}
              disabled={isLoading}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Categorizing...' : 'Categorize Papers'}
            </button>
          </div>
        </div>
        
        {status && (
          <div className={`mt-6 p-4 rounded-md ${status.isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {status.message}
          </div>
        )}
        
        <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between">
          <Link href="/browse" className="text-blue-600 hover:underline">
            ← Return to Browse Page
          </Link>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Home Page →
          </Link>
        </div>
      </div>
    </div>
  );
} 