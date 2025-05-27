import React from 'react';
import { X } from 'lucide-react';

interface FileViewerProps {
  url: string;
  fileType: string;
  title: string;
  onClose: () => void;
}

export function FileViewer({ url, fileType, title, onClose }: FileViewerProps) {
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileType.toLowerCase());
  const isPDF = fileType.toLowerCase() === 'pdf';
  const isText = ['txt', 'md', 'csv'].includes(fileType.toLowerCase());
  const isWord = ['doc', 'docx'].includes(fileType.toLowerCase());
  const isOfficeDoc = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileType.toLowerCase());

  // For Word documents and other Office files, we'll use Google Docs Viewer
  const getViewerUrl = (originalUrl: string, fileType: string) => {
    if (isOfficeDoc) {
      return `https://docs.google.com/gview?url=${encodeURIComponent(originalUrl)}&embedded=true`;
    }
    return originalUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
            aria-label="Close viewer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {isPDF ? (
            <iframe
              src={`${url}#toolbar=0`}
              className="w-full h-full"
              title={title}
            />
          ) : isImage ? (
            <img
              src={url}
              alt={title}
              className="max-w-full max-h-full mx-auto"
            />
          ) : isText ? (
            <iframe
              src={url}
              className="w-full h-full"
              title={title}
            />
          ) : isOfficeDoc ? (
            <iframe
              src={getViewerUrl(url, fileType)}
              className="w-full h-full"
              title={title}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 mb-4">
                  Preview not available for this file type.
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Open in New Tab
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}