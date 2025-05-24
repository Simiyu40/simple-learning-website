'use client';

import Link from 'next/link';
import { StorageProvider, StorageStatus } from '@/components/StorageManager';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-900 dark:text-white">Simple Learning Website</h1>

      <div className="mb-8">
        <StorageProvider>
          <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
            <span className="text-gray-700">Storage Status:</span>
            <StorageStatus />
          </div>
        </StorageProvider>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Browse Papers</h2>
            <p className="text-gray-600 mb-4">
              View and manage all uploaded papers and their solutions.
            </p>
          <Link
            href="/browse"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Browse Papers
            </Link>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Content</h2>
            <p className="text-gray-600 mb-4">
              Upload new papers or solutions using the full upload interface.
            </p>
            <Link
              href="/upload-example"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Upload Content
            </Link>
          </div>
        </div>
      </div>

      {/* Database Admin Section */}
      <div className="mt-8 bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Database Administration</h2>
          <p className="text-gray-600 mb-4">
            Manage database schema and fix any issues with the database.
          </p>
          <Link
            href="/admin/db-fix"
            className="inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Database Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
