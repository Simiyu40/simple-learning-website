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
      <h1 className="text-2xl font-bold mb-6">Upload Files</h1>
      
      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setCurrentMode('paper')}
            className={`px-4 py-2 rounded-md ${
              currentMode === 'paper' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            Upload Paper
          </button>
          <button
            onClick={() => setCurrentMode('solution')}
            className={`px-4 py-2 rounded-md ${
              currentMode === 'solution' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            Upload Solution
          </button>
        </div>
        
        {currentMode === 'solution' && (
          <div className="mb-4 p-4 border rounded-lg bg-gray-50">
            <label className="block text-sm font-medium mb-1">Select Paper ID for Solution</label>
            <input
              type="text"
              value={selectedPaperId}
              onChange={(e) => setSelectedPaperId(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Enter paper ID"
            />
            <p className="text-xs text-gray-500 mt-1">
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
          <h2 className="text-xl font-semibold mb-3">Uploaded Files</h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bucket</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uploadedFiles.map((file, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{file.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.bucket}</td>
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