import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Copy, Image as ImageIcon } from 'lucide-react';
import { NewsItem } from '../types';

interface NewsCardProps {
  news: NewsItem;
  onSelect: (id: string, selected: boolean) => void;
  onCustomImageUpload: (id: string, file: File) => void;
  onCopySummary: (summary: string, link: string) => void;
}

export function NewsCard({ news, onSelect, onCustomImageUpload, onCopySummary }: NewsCardProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: ([file]) => file && onCustomImageUpload(news.id, file),
  });

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
      <div className="flex items-start p-4">
        <input
          type="checkbox"
          checked={news.selected}
          onChange={(e) => onSelect(news.id, e.target.checked)}
          className="mt-1 h-5 w-5 rounded border-gray-300"
        />
        
        <div className="ml-4 flex-1">
          <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
            <img
              src={news.customImage ? URL.createObjectURL(news.customImage) : news.image}
              alt={news.title}
              className="w-full h-full object-cover"
            />
          </div>
          
          <h3 className="text-xl font-semibold mb-2">{news.title}</h3>
          <p className="text-gray-700 mb-4">{news.summary}</p>
          
          <div className="flex items-center justify-between">
            <a
              href={news.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Read full article
            </a>
            
            <button
              onClick={() => onCopySummary(news.summary, news.link)}
              className="flex items-center px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200"
            >
              <Copy size={16} className="mr-1" />
              Copy Summary
            </button>
          </div>
          
          <div
            {...getRootProps()}
            className={`mt-4 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
          >
            <input {...getInputProps()} />
            <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-1 text-sm text-gray-500">
              {isDragActive ? 'Drop image here' : 'Drag & drop a custom image, or click to select'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}