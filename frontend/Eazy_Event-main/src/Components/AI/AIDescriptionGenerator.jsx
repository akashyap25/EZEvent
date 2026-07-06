import React, { useState } from 'react';
import { Sparkles, Loader2, Copy, Check, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { SERVER_URL } from '../../Utils/Constants';

const AIDescriptionGenerator = ({ eventDetails, onGenerated, className = '' }) => {
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const generateDescription = async () => {
    if (!eventDetails?.title) {
      setError('Please enter an event title first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${SERVER_URL}/api/ai/generate-description`,
        {
          title: eventDetails.title,
          category: eventDetails.category,
          location: eventDetails.location,
          startDateTime: eventDetails.startDateTime,
          endDateTime: eventDetails.endDateTime,
          targetAudience: eventDetails.targetAudience
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setGeneratedText(response.data.data.description);
        if (onGenerated) {
          onGenerated(response.data.data.description);
        }
      } else {
        setError(response.data.message || 'Failed to generate description');
      }
    } catch (err) {
      console.error('AI generation error:', err);
      setError(err.response?.data?.message || 'AI service unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const useDescription = () => {
    if (onGenerated && generatedText) {
      onGenerated(generatedText);
    }
  };

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span className="font-medium text-gray-800">AI Description Generator</span>
        </div>
        <span className="text-xs text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded-full">
          Powered by Gemini
        </span>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      {!generatedText ? (
        <button
          onClick={generateDescription}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
            bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg
            hover:from-purple-700 hover:to-blue-700 transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Description with AI</span>
            </>
          )}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 max-h-48 overflow-y-auto">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{generatedText}</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={useDescription}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 
                bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Check className="w-4 h-4" />
              Use This
            </button>
            
            <button
              onClick={copyToClipboard}
              className="flex items-center justify-center gap-2 px-3 py-2 
                bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
            
            <button
              onClick={generateDescription}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-3 py-2 
                bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm
                disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        AI-generated descriptions may need review and editing
      </p>
    </div>
  );
};

export default AIDescriptionGenerator;
