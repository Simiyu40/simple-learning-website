import React, { useState, useRef } from 'react';
import { useStorage } from './StorageManager';
import { Loader2, FileUp, CheckCircle, XCircle } from 'lucide-react';

interface SimpleUploadProps {
  type: 'paper' | 'solution';
  onComplete?: (fileInfo: any) => void;
  onCancel?: () => void;
  paperId?: string;
  questionId?: string;
}

export default function SimpleUpload({
  type,
  onComplete,
  onCancel,
  paperId,
  questionId
}: SimpleUploadProps) {
  const { uploadFile, isUploading, isStorageReady, storageError } = useStorage();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [paperType, setPaperType] = useState('exam');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (type === 'paper' && !title) {
      setError('Please enter a title for this paper');
      return;
    }

    if (type === 'solution' && (!paperId || !questionId)) {
      setError('Missing paper or question information');
      return;
    }

    try {
      const result = await uploadFile(file, {
        type,
        title,
        paperType,
        paperId,
        questionId
      });

      if (result) {
        setUploadSuccess(true);
        if (onComplete) {
          onComplete(result);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setUploadSuccess(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    resetForm();
    if (onCancel) {
      onCancel();
    }
  };

  // Show storage initialization status
  if (!isStorageReady) {
    return (
      <div className="p-4 border rounded-md">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Initializing storage...</span>
        </div>
      </div>
    );
  }

  // Show storage error
  if (storageError) {
    return (
      <div className="p-4 border rounded-md bg-red-50">
        <div className="flex items-center space-x-2 text-red-600">
          <XCircle className="w-4 h-4" />
          <span>Storage error: {storageError}</span>
        </div>
      </div>
    );
  }

  // Show upload success
  if (uploadSuccess) {
    return (
      <div className="p-4 border rounded-md bg-green-50">
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>Upload successful!</span>
        </div>
        <button
          className="mt-2 text-sm text-blue-600 hover:underline"
          onClick={resetForm}
        >
          Upload another file
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-md">
      <div className="space-y-4">
        <div>
          <label htmlFor="file-upload" className="block text-sm font-medium">
            Select File
          </label>
          <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            aria-label="Choose a file to upload"
          />
          {file && (
            <p className="mt-1 text-sm text-gray-500">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {type === 'paper' && (
          <>
            <div>
              <label htmlFor="title" className="block text-sm font-medium">
                Paper Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter paper title"
                required
              />
            </div>

            <div>
              <label htmlFor="paper-type" className="block text-sm font-medium">
                Paper Type
              </label>
              <select
                id="paper-type"
                value={paperType}
                onChange={(e) => setPaperType(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                aria-label="Select paper type"
              >
                <option value="exam">Exam</option>
                <option value="assignment">Assignment</option>
                <option value="notes">Notes</option>
              </select>
            </div>
          </>
        )}

        {error && (
          <div className="text-sm text-red-600">
            <XCircle className="inline-block w-4 h-4 mr-1" />
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUploading}
            className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FileUp className="w-4 h-4 mr-2" />
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
} 