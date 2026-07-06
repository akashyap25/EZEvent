import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Facebook, 
  Twitter, 
  Linkedin, 
  MessageCircle, 
  Send, 
  Globe, 
  Instagram,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Code,
  BarChart3
} from 'lucide-react';
import { SERVER_URL } from '../../Utils/Constants';
import Card from '../UI/Card';
import Button from '../UI/Button';
import LoadingSpinner from '../UI/LoadingSpinner';

const SocialShare = ({ event, onClose }) => {
  const [shareUrls, setShareUrls] = useState({});
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState({});
  const [showEmbed, setShowEmbed] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [embedCode, setEmbedCode] = useState('');
  const [qrData, setQrData] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const platforms = {
    facebook: { name: 'Facebook', icon: Facebook, color: '#1877F2' },
    twitter: { name: 'Twitter', icon: Twitter, color: '#1DA1F2' },
    linkedin: { name: 'LinkedIn', icon: Linkedin, color: '#0077B5' },
    whatsapp: { name: 'WhatsApp', icon: MessageCircle, color: '#25D366' },
    telegram: { name: 'Telegram', icon: Send, color: '#0088CC' },
    reddit: { name: 'Reddit', icon: Globe, color: '#FF4500' },
    instagram: { name: 'Instagram', icon: Instagram, color: '#E4405F' }
  };

  useEffect(() => {
    if (event) {
      loadShareData();
    }
  }, [event]);

  const loadShareData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${SERVER_URL}/api/social/events/${event._id}/share`);
      
      if (!response.ok) {
        throw new Error('Failed to load share data');
      }

      const data = await response.json();
      setShareUrls(data.data.shareUrls);
      setShareData(data.data.shareData);
    } catch (error) {
      console.error('Error loading share data:', error);
      setError('Failed to load share data');
    } finally {
      setLoading(false);
    }
  };

  const loadEmbedCode = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/social/events/${event._id}/embed`);
      
      if (!response.ok) {
        throw new Error('Failed to load embed code');
      }

      const data = await response.json();
      setEmbedCode(data.data.embedCode);
    } catch (error) {
      console.error('Error loading embed code:', error);
    }
  };

  const loadQRData = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/social/events/${event._id}/qr`);
      
      if (!response.ok) {
        throw new Error('Failed to load QR data');
      }

      const data = await response.json();
      setQrData(data.data);
    } catch (error) {
      console.error('Error loading QR data:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/social/events/${event._id}/analytics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }

      const data = await response.json();
      setAnalytics(data.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleShare = (platform) => {
    const shareUrl = shareUrls[platform];
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      trackShare(platform);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareData?.url || '');
      setCopied(prev => ({ ...prev, link: true }));
      setTimeout(() => setCopied(prev => ({ ...prev, link: false })), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(prev => ({ ...prev, embed: true }));
      setTimeout(() => setCopied(prev => ({ ...prev, embed: false })), 2000);
    } catch (error) {
      console.error('Failed to copy embed code:', error);
    }
  };

  const trackShare = async (platform) => {
    try {
      await fetch(`${SERVER_URL}/api/social/track-share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          eventId: event._id,
          platform,
          userId: localStorage.getItem('userId')
        })
      });
    } catch (error) {
      console.error('Failed to track share:', error);
    }
  };

  const handleShowEmbed = () => {
    setShowEmbed(true);
    if (!embedCode) {
      loadEmbedCode();
    }
  };

  const handleShowQR = () => {
    setShowQR(true);
    if (!qrData) {
      loadQRData();
    }
  };

  const handleShowAnalytics = () => {
    setShowAnalytics(true);
    if (!analytics) {
      loadAnalytics();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
        <Card className="p-8 my-8">
          <LoadingSpinner />
          <p className="mt-4 text-center">Loading share options...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Share2 className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Share Event</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              icon={ExternalLink}
            >
              Close
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Event Preview */}
          {shareData && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">{shareData.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{shareData.description}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>🔗 {shareData.url}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyLink}
                  icon={copied.link ? Check : Copy}
                >
                  {copied.link ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          )}

          {/* Share Buttons */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share on Social Media</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(platforms).map(([key, platform]) => {
                const Icon = platform.icon;
                const shareUrl = shareUrls[key];
                
                return (
                  <Button
                    key={key}
                    variant="outline"
                    onClick={() => handleShare(key)}
                    disabled={!shareUrl}
                    className="flex items-center gap-2 justify-start"
                    style={{ borderColor: platform.color }}
                  >
                    <Icon className="w-4 h-4" style={{ color: platform.color }} />
                    {platform.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <Button
              variant="outline"
              fullWidth
              onClick={handleShowEmbed}
              icon={Code}
            >
              Get Embed Code
            </Button>
            
            <Button
              variant="outline"
              fullWidth
              onClick={handleShowQR}
              icon={QrCode}
            >
              Generate QR Code
            </Button>
            
            <Button
              variant="outline"
              fullWidth
              onClick={handleShowAnalytics}
              icon={BarChart3}
            >
              View Sharing Analytics
            </Button>
          </div>

          {/* Embed Code Modal */}
          {showEmbed && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">Embed Code</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmbed(false)}
                >
                  ×
                </Button>
              </div>
              <div className="relative">
                <pre className="bg-white dark:bg-gray-800 p-3 rounded border text-xs overflow-x-auto">
                  {embedCode || 'Loading...'}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyEmbed}
                  className="absolute top-2 right-2"
                  icon={copied.embed ? Check : Copy}
                >
                  {copied.embed ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          )}

          {/* QR Code Modal */}
          {showQR && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">QR Code</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQR(false)}
                >
                  ×
                </Button>
              </div>
              {qrData ? (
                <div>
                  <div className="mb-3">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData.url)}`}
                      alt="QR Code"
                      className="mx-auto"
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{qrData.url}</p>
                </div>
              ) : (
                <LoadingSpinner />
              )}
            </div>
          )}

          {/* Analytics Modal */}
          {showAnalytics && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">Sharing Analytics</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAnalytics(false)}
                >
                  ×
                </Button>
              </div>
              {analytics ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {analytics.metrics.totalShares}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Shares</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {analytics.metrics.clickThroughRate}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Click Rate</div>
                    </div>
                  </div>
                  
                  {analytics.recommendations && analytics.recommendations.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Recommendations</h5>
                      <ul className="space-y-1">
                        {analytics.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                            • {rec.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <LoadingSpinner />
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SocialShare;
