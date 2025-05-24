'use client';

import Link from 'next/link';
import { StorageProvider, StorageStatus } from '@/components/StorageManager';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center text-foreground">
        Simple Learning Website
      </h1>

      <div className="mb-8">
        <StorageProvider>
          <div className="card p-4 rounded-lg flex items-center justify-between">
            <span className="text-muted-foreground">Storage Status:</span>
            <StorageStatus />
          </div>
        </StorageProvider>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">
              Browse Papers
            </h2>
            <p className="mb-4 text-muted-foreground">
              View and manage all uploaded papers and their solutions.
            </p>
            <Link
              href="/browse"
              className="btn-primary inline-block px-4 py-2 rounded hover:opacity-90 transition-all"
            >
              Browse Papers
            </Link>
          </div>
        </div>

        <div className="card rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">
              Upload Content
            </h2>
            <p className="mb-4 text-muted-foreground">
              Upload new papers or solutions using the full upload interface.
            </p>
            <Link
              href="/upload-example"
              className="btn-success inline-block px-4 py-2 rounded hover:opacity-90 transition-all"
            >
              Upload Content
            </Link>
          </div>
        </div>
      </div>

      {/* Additional Tools Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">
              Database Tools
            </h2>
            <p className="mb-4 text-muted-foreground">
              Fix database issues and inspect stored data.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/fix"
                className="inline-block px-4 py-2 rounded transition-all"
                style={{
                  backgroundColor: 'var(--warning)',
                  color: 'var(--warning-foreground)',
                  border: '2px solid var(--warning)'
                }}
              >
                Fix Database
              </Link>
              <Link
                href="/inspect"
                className="inline-block px-4 py-2 rounded transition-all"
                style={{
                  backgroundColor: 'var(--info)',
                  color: 'var(--info-foreground)',
                  border: '2px solid var(--info)'
                }}
              >
                Inspect Data
              </Link>
            </div>
          </div>
        </div>

        {/* Database Admin Section */}
        <div className="card rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">
              Database Administration
            </h2>
            <p className="mb-4 text-muted-foreground">
              Manage database schema and fix any issues with the database.
            </p>
            <Link
              href="/admin/db-fix"
              className="btn-destructive inline-block px-4 py-2 rounded hover:opacity-90 transition-all"
            >
              Database Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
