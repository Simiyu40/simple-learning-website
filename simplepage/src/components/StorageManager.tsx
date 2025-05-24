import React, { useEffect, useState, createContext, useContext } from 'react';

interface StorageContextType {
  isStorageReady: boolean;
  storageError: string | null;
  uploadFile: (file: File, options: UploadOptions) => Promise<FileInfo | null>;
  isUploading: boolean;
}

interface UploadOptions {
  type: 'paper' | 'solution';
  title?: string;
  paperType?: string;
  paperId?: string;
  questionId?: string;
}

interface FileInfo {
  name: string;
  type: string;
  bucket: string;
  path: string;
}

const StorageContext = createContext<StorageContextType | null>(null);

export function useStorage() {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const initializeStorage = async () => {
      try {
        const response = await fetch('/api/init-storage');
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to initialize storage');
        }
        
        setIsStorageReady(true);
        setStorageError(null);
      } catch (err) {
        console.error('Storage initialization error:', err);
        setStorageError(err instanceof Error ? err.message : 'An unknown error occurred');
        setIsStorageReady(false);
      }
    };

    initializeStorage();
  }, []);

  const uploadFile = async (file: File, options: UploadOptions): Promise<FileInfo | null> => {
    if (!isStorageReady) {
      setStorageError('Storage not initialized');
      return null;
    }

    setIsUploading(true);
    setStorageError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.type === 'paper') {
        if (!options.title) {
          throw new Error('Title is required for paper uploads');
        }
        formData.append('title', options.title);
        formData.append('paperType', options.paperType || 'exam');
        formData.append('dummyUserId', 'true');
      } else if (options.type === 'solution') {
        if (!options.paperId || !options.questionId) {
          throw new Error('Paper ID and Question ID are required for solution uploads');
        }
        formData.append('paperId', options.paperId);
        formData.append('questionId', options.questionId);
      }
      
      const endpoint = '/api/upload-minimal';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      
      return result.fileInfo;
    } catch (err) {
      console.error('Upload error:', err);
      setStorageError(err instanceof Error ? err.message : 'An unknown error occurred');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const value: StorageContextType = {
    isStorageReady,
    storageError,
    uploadFile,
    isUploading
  };

  return (
    <StorageContext.Provider value={value}>
      {children}
    </StorageContext.Provider>
  );
}

// Export a simple status indicator component
export function StorageStatus() {
  const { isStorageReady, storageError } = useStorage();
  
  if (storageError) {
    return (
      <div className="text-sm text-red-600">
        Storage error: {storageError}
      </div>
    );
  }
  
  if (!isStorageReady) {
    return (
      <div className="text-sm text-gray-600">
        Initializing storage...
      </div>
    );
  }
  
  return (
    <div className="text-sm text-green-600">
      Storage ready
    </div>
  );
} 