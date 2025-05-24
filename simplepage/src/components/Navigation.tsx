'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md mb-8" suppressHydrationWarning>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex space-x-4">
            <Link
              href="/browse"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/browse'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              suppressHydrationWarning
            >
              Browse
            </Link>
            <Link
              href="/upload-example"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/upload-example'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              suppressHydrationWarning
            >
              Upload
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}