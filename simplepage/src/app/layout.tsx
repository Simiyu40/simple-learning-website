import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import StorageInitializer from '@/components/StorageInitializer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Simple Learning Web',
  description: 'Upload and browse academic papers and solutions',
}

// Storage initialization is now handled by the StorageInitializer component

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen app-background">
          <StorageInitializer />
          <Navigation />
          <main className="container mx-auto px-4">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
