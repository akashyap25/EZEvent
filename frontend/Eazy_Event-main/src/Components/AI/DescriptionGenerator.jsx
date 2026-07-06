import React, { useState } from 'react';
import { Sparkles, Loader2, RefreshCw, Check, X } from 'lucide-react';
import { SERVER_URL } from '../../Utils/Constants';

const DescriptionGenerator = ({ 
  eventDetails, 
  onGenerated, 
  className = '' 
}) => {
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const generateDescription = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${SERVER_URL}/api/ai/generate-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventDetails)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGeneratedText(data.data.description);
        setShowPreview(true);
      } else {
        setError(data.message || 'Failed to generate description');
      }
    } catch (err) {
      setError('Failed to connect to AI service');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    onGenerated(generatedText);
    setShowPreview(false);
    setGeneratedText('');
  };

  const handleReject = () => {
    setShowPreview(false);
    setGeneratedText('');
  };

  if (showPreview) {
    return (
      <div className={`bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-800">AI Generated Description</span>
        </div>
        
        <p className="text-gray-700 text-sm mb-4 whitespace-pre-wrap">
          {generatedText}
        </p>
        
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
          >
            <Check className="w-4 h-4" />
            Use This
          </button>
          <button
            onClick={generateDescription}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
          <button
            onClick={handleReject}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        onClick={generateDescription}
        disabled={loading || !eventDetails?.title}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {loading ? 'Generating...' : 'Generate with AI'}
      </button>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      
      {!eventDetails?.title && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Enter event title first</p>
      )}
    </div>
  );
};

export default DescriptionGenerator;
