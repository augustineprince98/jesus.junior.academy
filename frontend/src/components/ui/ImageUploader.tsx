'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/useStore';
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/runtime-config';

interface ImageUploaderProps {
  onUpload: (url: string) => void;
  category?: string;
  prefix?: string;
  currentImage?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'wide';
}

export default function ImageUploader({
  onUpload,
  category = 'images',
  prefix = '',
  currentImage,
  className = '',
  aspectRatio = 'video',
}: ImageUploaderProps) {
  const { token } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
  };

  const handleFileSelect = useCallback(async (file: File) => {
    if (!token) {
      setError('Please login to upload images');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      if (prefix) formData.append('prefix', prefix);

      const response = await fetch(`${API_BASE_URL}/uploads/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data = await response.json();
      onUpload(`${API_BASE_URL}${data.file_path}`);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  }, [token, category, prefix, onUpload, currentImage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const clearImage = () => {
    setPreview(null);
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {preview ? (
        <div className={`relative ${aspectClasses[aspectRatio]} rounded-xl overflow-hidden bg-gray-100`}>
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          {uploading ? (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          ) : (
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                title="Change image"
              >
                <Upload className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={clearImage}
                className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          disabled={uploading}
          className={`w-full ${aspectClasses[aspectRatio]} rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-3 ${
            dragOver
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          } ${uploading ? 'cursor-wait' : 'cursor-pointer'}`}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          ) : (
            <>
              <ImageIcon className="w-10 h-10 text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            </>
          )}
        </button>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
