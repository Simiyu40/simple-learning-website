import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import type { Paper } from '@/lib/supabase';
import { MinimalPaper } from '@/lib/supabase-minimal';
import { Upload, Loader2 } from 'lucide-react';

// Define the schemas
const uploadSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  file: z.any()
    .refine((files) => files?.length === 1, "A file is required")
    .refine(
      (files) => {
        if (!files?.[0]) return false;
        const fileType = files[0].type;
        return ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(fileType);
      },
      "Only PDF and Word documents are allowed"
    ),
});

const solutionSchema = z.object({
  paperId: z.string().min(1, 'Paper is required'),
  question_id: z.string().min(1, 'Question identifier is required'),
  file: z.any()
    .refine((files) => files?.length === 1, "A file is required")
    .refine(
      (files) => {
        if (!files?.[0]) return false;
        const fileType = files[0].type;
        return ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(fileType);
      },
      "Only PDF and Word documents are allowed"
    ),
});

type UploadFormData = z.infer<typeof uploadSchema>;
type SolutionFormData = z.infer<typeof solutionSchema>;

interface UploadFormsProps {
  papers: (Paper | MinimalPaper)[];
  onPaperUpload: () => void;
  onSolutionUpload: () => void;
}

export default function UploadForms({ papers, onPaperUpload, onSolutionUpload }: UploadFormsProps) {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  const {
    register: registerPaper,
    handleSubmit: handleSubmitPaper,
    formState: { errors: paperErrors },
    reset: resetPaper,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  });

  const {
    register: registerSolution,
    handleSubmit: handleSubmitSolution,
    formState: { errors: solutionErrors },
    reset: resetSolution,
  } = useForm<SolutionFormData>({
    resolver: zodResolver(solutionSchema),
  });

  const onPaperSubmit = async (data: UploadFormData) => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      setWarning('');

      // Try to set up the database with our simple approach
      try {
        const setupResponse = await fetch('/api/simple-db-setup');
        const setupResult = await setupResponse.json();
        console.log('Simple database setup result:', setupResult);
      } catch (setupError) {
        console.log('Database setup error:', setupError);
        // Continue anyway
      }

      const fileInput = data.file as FileList;
      const file = fileInput[0];

      // Create form data for API request
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'papers');
      formData.append('title', data.title);

      // Upload file using server API
      const response = await fetch('/api/upload-minimal', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload paper');
      }

      if (result.warning) {
        setWarning(result.warning);
        setSuccessMessage(result.message || 'File uploaded but with warnings');
      } else {
        setSuccessMessage(result.message || 'Paper uploaded successfully!');
      }
      
      resetPaper();
      onPaperUpload();
    } catch (error) {
      console.error('Error uploading paper:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while uploading');
    } finally {
      setLoading(false);
    }
  };

  const onSolutionSubmit = async (data: SolutionFormData) => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      setWarning('');

      // Try to set up the database with our simple approach
      try {
        const setupResponse = await fetch('/api/simple-db-setup');
        const setupResult = await setupResponse.json();
        console.log('Simple database setup result:', setupResult);
      } catch (setupError) {
        console.log('Database setup error:', setupError);
        // Continue anyway
      }

      const fileInput = data.file as FileList;
      const file = fileInput[0];

      // Create form data for API request
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'solutions');
      formData.append('paperId', data.paperId);
      formData.append('questionId', data.question_id);

      // Upload file using server API
      const response = await fetch('/api/upload-minimal', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload solution');
      }

      if (result.warning) {
        setWarning(result.warning);
        setSuccessMessage(result.message || 'File uploaded but with warnings');
      } else {
        setSuccessMessage(result.message || 'Solution uploaded successfully!');
      }
      
      resetSolution();
      onSolutionUpload();
    } catch (error) {
      console.error('Error uploading solution:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while uploading');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Paper Upload Form */}
      <div className="p-6 border rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Upload a Paper</h2>
        <form onSubmit={handleSubmitPaper(onPaperSubmit)} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title
            </label>
            <input
              id="title"
              type="text"
              className="w-full p-2 border rounded-md"
              {...registerPaper('title')}
            />
            {paperErrors.title && (
              <p className="text-red-500 text-sm mt-1">{paperErrors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="paperFile" className="block text-sm font-medium mb-1">
              Upload File (PDF or Word)
            </label>
            <input
              id="paperFile"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="w-full p-2 border rounded-md"
              {...registerPaper('file')}
            />
            {paperErrors.file && (
              <p className="text-red-500 text-sm mt-1">{paperErrors.file.message as string}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Paper
              </>
            )}
          </button>
        </form>
      </div>

      {/* Solution Upload Form */}
      <div className="p-6 border rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Upload a Solution</h2>
        <form onSubmit={handleSubmitSolution(onSolutionSubmit)} className="space-y-4">
          <div>
            <label htmlFor="paperId" className="block text-sm font-medium mb-1">
              Select Paper
            </label>
            <select
              id="paperId"
              className="w-full p-2 border rounded-md"
              {...registerSolution('paperId')}
            >
              <option value="">Select a paper</option>
              {papers.map((paper) => (
                <option key={paper.id} value={paper.id}>
                  {paper.title}
                </option>
              ))}
            </select>
            {solutionErrors.paperId && (
              <p className="text-red-500 text-sm mt-1">{solutionErrors.paperId.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="question_id" className="block text-sm font-medium mb-1">
              Question Identifier
            </label>
            <input
              id="question_id"
              type="text"
              placeholder="e.g., Q1, Problem 2, etc."
              className="w-full p-2 border rounded-md"
              {...registerSolution('question_id')}
            />
            {solutionErrors.question_id && (
              <p className="text-red-500 text-sm mt-1">{solutionErrors.question_id.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="solutionFile" className="block text-sm font-medium mb-1">
              Upload File (PDF or Word)
            </label>
            <input
              id="solutionFile"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="w-full p-2 border rounded-md"
              {...registerSolution('file')}
            />
            {solutionErrors.file && (
              <p className="text-red-500 text-sm mt-1">{solutionErrors.file.message as string}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Solution
              </>
            )}
          </button>
        </form>
      </div>

      {/* Status Messages */}
      {successMessage && (
        <div className="md:col-span-2 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}
      
      {warning && (
        <div className="md:col-span-2 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md mt-2">
          Warning: {warning}
        </div>
      )}
      
      {error && (
        <div className="md:col-span-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md mt-2">
          {error}
        </div>
      )}
    </div>
  );
}