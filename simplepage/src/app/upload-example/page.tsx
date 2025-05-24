'use client';

import { useState } from 'react';
import { MinimalUploadForm } from '@/components/MinimalUploadForm';

interface FileInfo {
  name: string;
  type: string;
  bucket: string;
  path: string;
}

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [currentMode, setCurrentMode] = useState<'paper' | 'solution'>('paper');
  const [selectedPaperId, setSelectedPaperId] = useState<string>('');

  const handleUploadComplete = (fileInfo: FileInfo) => {
    setUploadedFiles(prev => [...prev, fileInfo]);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Upload Files</h1>

      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setCurrentMode('paper')}
            className={`px-4 py-2 rounded-md transition-all ${
              currentMode === 'paper'
                ? 'btn-primary'
                : 'btn-secondary'
            }`}
          >
            Upload Paper
          </button>
          <button
            type="button"
            onClick={() => setCurrentMode('solution')}
            className={`px-4 py-2 rounded-md transition-all ${
              currentMode === 'solution'
                ? 'btn-primary'
                : 'btn-secondary'
            }`}
          >
            Upload Solution
          </button>
        </div>

        {currentMode === 'solution' && (
          <div className="mb-4 p-4 border rounded-lg card">
            <label className="block text-sm font-medium mb-1 text-card-foreground">
              Select Paper ID for Solution
            </label>
            <input
              type="text"
              value={selectedPaperId}
              onChange={(e) => setSelectedPaperId(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Enter paper ID"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This would typically be selected from a dropdown of available papers
            </p>
          </div>
        )}

        <MinimalUploadForm
          uploadType={currentMode}
          paperId={currentMode === 'solution' ? selectedPaperId : undefined}
          questionId={currentMode === 'solution' ? '1' : undefined}
          onUploadComplete={handleUploadComplete}
        />
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-3 text-foreground">Uploaded Files</h2>
          <div className="border rounded-lg overflow-hidden card">
            <table className="min-w-full divide-y">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">File Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Bucket</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {uploadedFiles.map((file, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-card-foreground">{file.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{file.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{file.bucket}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}