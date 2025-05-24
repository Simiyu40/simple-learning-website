import React from 'react';
import { X } from 'lucide-react';

interface FileViewerProps {
  url: string;
  fileType: string;
  title: string;
  onClose: () => void;
}

export function FileViewer({ url, fileType, title, onClose }: FileViewerProps) {
  const isImage = ['jpg', 'jpeg', 'png'].includes(fileType.toLowerCase());
  const isPDF = fileType.toLowerCase() === 'pdf';
  const isText = ['txt', 'md'].includes(fileType.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
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
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">
                Preview not available for this file type. Please download to view.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 