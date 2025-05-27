'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav
      className="shadow-md mb-8 border-b-2 nav-container"
      suppressHydrationWarning
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex space-x-4">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                pathname === '/'
                  ? 'btn-primary'
                  : 'btn-secondary hover:btn-primary'
              }`}
              suppressHydrationWarning
            >
              Home
            </Link>
            <Link
              href="/browse"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                pathname === '/browse'
                  ? 'btn-primary'
                  : 'btn-secondary hover:btn-primary'
              }`}
              suppressHydrationWarning
            >
              Browse
            </Link>
            <Link
              href="/upload-example"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                pathname === '/upload-example'
                  ? 'btn-primary'
                  : 'btn-secondary hover:btn-primary'
              }`}
              suppressHydrationWarning
            >
              Upload
            </Link>
            {/* Fix and Inspect tabs hidden as requested */}
            {false && (
              <>
                <Link
                  href="/fix"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    pathname === '/fix'
                      ? 'btn-warning'
                      : 'btn-secondary hover:btn-warning'
                  }`}
                  suppressHydrationWarning
                >
                  Fix
                </Link>
                <Link
                  href="/inspect"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    pathname === '/inspect'
                      ? 'btn-info'
                      : 'btn-secondary hover:btn-info'
                  }`}
                  suppressHydrationWarning
                >
                  Inspect
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}