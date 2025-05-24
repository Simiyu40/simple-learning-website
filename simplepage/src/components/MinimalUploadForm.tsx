import React, { useState, useRef, FormEvent, ChangeEvent } from 'react';
import { Upload, Check, AlertCircle, X } from 'lucide-react';

interface FileInfo {
  name: string;
  type: string;
  bucket: string;
  path: string;
}

interface MinimalUploadFormProps {
  uploadType: 'paper' | 'solution';
  paperId?: string;
  questionId?: string;
  onUploadComplete?: (fileInfo: FileInfo) => void;
  onCancel?: () => void;
}

export function MinimalUploadForm({
  uploadType,
  paperId,
  questionId,
  onUploadComplete,
  onCancel
}: MinimalUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [paperType, setPaperType] = useState('exam');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (uploadType === 'paper' && !title) {
      setError('Please enter a title for the paper');
      return;
    }
    
    setError(null);
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (uploadType === 'paper') {
        formData.append('title', title);
        formData.append('paperType', paperType);
        // Add dummy user ID to satisfy database constraints
        formData.append('dummyUserId', 'true');
      } else if (uploadType === 'solution') {
        if (!paperId || !questionId) {
          throw new Error('Paper ID and Question ID are required for solution uploads');
        }
        formData.append('paperId', paperId);
        formData.append('questionId', questionId);
      }
      
      // Use the simplified upload endpoint for papers to avoid schema issues
      const endpoint = '/api/upload-minimal';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      
      setSuccess(true);
      
      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(result.fileInfo);
      }
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFile(null);
        setTitle('');
        setSuccess(false);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h3 className="font-medium mb-3">
        {uploadType === 'paper' ? 'Upload New Paper' : 'Upload Solution'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {uploadType === 'paper' && (
          <>
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
              <input
                id="title"
                type="text"
                className="w-full p-2 border rounded-md"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter paper title"
              />
            </div>
            
            <div>
              <label htmlFor="paperType" className="block text-sm font-medium mb-1">Paper Type</label>
              <select
                id="paperType"
                className="w-full p-2 border rounded-md"
                value={paperType}
                onChange={(e) => setPaperType(e.target.value)}
                title="Select paper type"
              >
                <option value="exam">Exam</option>
                <option value="assignment">Assignment</option>
                <option value="notes">Notes</option>
                <option value="other">Other</option>
              </select>
            </div>
          </>
        )}
        
        <div>
          <label htmlFor="file" className="block text-sm font-medium mb-1">
            {uploadType === 'paper' 
              ? 'File (PDF, DOC, DOCX, TXT, MD, TEX)' 
              : 'File (PDF, DOC, DOCX, TXT, MD, TEX, JPG, JPEG, PNG)'}
          </label>
          <input
            id="file"
            ref={fileInputRef}
            type="file"
            accept={uploadType === 'paper' 
              ? '.pdf,.doc,.docx,.txt,.md,.tex,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,application/x-tex'
              : '.pdf,.doc,.docx,.txt,.md,.tex,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,application/x-tex,image/jpeg,image/png'}
            className="w-full p-2 border rounded-md"
            onChange={handleFileChange}
            aria-label={`Upload ${uploadType}`}
          />
          {file && (
            <p className="text-sm text-gray-600 mt-1">Selected: {file.name}</p>
          )}
        </div>
        
        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-md flex items-center text-red-600">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="p-2 bg-green-50 border border-green-200 rounded-md flex items-center text-green-600">
            <Check className="h-4 w-4 mr-2" />
            <span className="text-sm">File uploaded successfully!</span>
          </div>
        )}
        
        <div className="flex justify-end space-x-2 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 border rounded-md text-sm flex items-center"
              disabled={uploading}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm flex items-center"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-opacity-50 border-t-white rounded-full animate-spin mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}