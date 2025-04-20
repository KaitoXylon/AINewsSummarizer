import React, { useState } from 'react';
import { Newspaper, Facebook, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { NewsCard } from './components/NewsCard';
import { fetchNewsFromAI } from './api';
import { NewsItem } from './types';

function App() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFetchNews = async () => {
    setLoading(true);
    try {
      const response = await fetchNewsFromAI();
      const newsItems = response.news.map((item, index) => ({
        id: `news-${index}`,
        title: item.title,
        summary: item.summary,
        link: item.link,
        image: item.image,
        selected: false,
      }));
      setNews(newsItems);
      toast.success('News fetched successfully!');
    } catch (error: any) {
      console.error('Error:', error);

      if (error?.status === 429 || (error?.error?.code === 429)) {
        toast.error('API rate limit reached. Please try again in a few minutes.');
      } else if (error.message.includes('Invalid JSON format')) {
        toast.error('Unable to process AI response. Please try again.');
      } else if (error.message.includes('Invalid news data format')) {
        toast.error('Received unexpected data format. Please try again later.');
      } else {
        toast.error('Failed to fetch news. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id: string, selected: boolean) => {
    setNews(news.map(item =>
      item.id === id ? { ...item, selected } : item
    ));
  };

  const handleCustomImageUpload = (id: string, file: File) => {
    setNews(news.map(item =>
      item.id === id ? { ...item, customImage: file } : item
    ));
  };

  const handleCopySummary = (summary: string, link: string) => {
    const text = `${summary}\n\nRead more: ${link}`;
    navigator.clipboard.writeText(text);
    toast.success('Summary copied to clipboard');
  };

  const handlePostToFacebook = () => {
    // TODO: Implement Facebook Graph API integration
    toast.error('Facebook integration coming soon!');
  };

  // Get the current date and time
  const currentTime = new Date();

  return (
    <div className="min-h-screen bg-[#EEE5DA]">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Container for title and time */}
        <div className="mb-8">
          <div className="flex items-baseline justify-between"> {/* Align title and time baseline */}
            <h1 className="text-4xl font-bold text-[#262424]">
              AI-Powered News Summarizer
            </h1>
            {/* Display current time */}
            <p className="text-sm text-gray-600">
              Current Time: {currentTime.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Container for buttons */}
        <div className="flex justify-between mb-8">
          <button
            onClick={handleFetchNews}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-[#262424] text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <Newspaper className="mr-2" />
            )}
            Fetch News
          </button>

          <button
            onClick={handlePostToFacebook}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Facebook className="mr-2" />
            Post to Facebook
          </button>
        </div>


        <div className="space-y-6">
          {news.map(item => (
            <NewsCard
              key={item.id}
              news={item}
              onSelect={handleSelect}
              onCustomImageUpload={handleCustomImageUpload}
              onCopySummary={handleCopySummary}
            />
          ))}
        </div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;