import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Eye, 
  CheckCircle, 
  TrendingUp, 
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import apiService from '../../Utils/apiService';
import { SERVER_URL } from '../../Utils/Constants';
import Card from '../UI/Card';
import Button from '../UI/Button';
import LoadingSpinner from '../UI/LoadingSpinner';

const EventAnalytics = ({ eventId, onClose }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (eventId) {
      fetchAnalytics();
    }
  }, [eventId, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.get(`/api/analytics/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format = 'json') => {
    try {
      const response = await apiService.get(`/api/analytics/${eventId}/report?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (format === 'json') {
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `event-analytics-${eventId}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={fetchAnalytics} icon={RefreshCw}>
          Try Again
        </Button>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-6 text-center">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-600 dark:text-gray-400">Analytics data will appear here once your event starts receiving traffic.</p>
      </Card>
    );
  }

  const { views, registrations, attendance, engagement, calculated } = analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">{analytics.event?.title}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportReport('json')}
            icon={Download}
          >
            Export Report
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Views</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{views?.total || 0}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {views?.unique || 0} unique views
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Registrations</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{registrations?.total || 0}</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {calculated?.conversionRate?.toFixed(1) || 0}% conversion rate
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Attendance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{attendance?.checkIns || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {calculated?.attendanceRate?.toFixed(1) || 0}% attendance rate
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Engagement</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{calculated?.engagementScore || 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Engagement score
            </span>
          </div>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views by Source */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Views by Source</h3>
          <div className="space-y-3">
            {views?.bySource && Object.entries(views.bySource).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{source}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(count / views.total) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Views by Device */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Views by Device</h3>
          <div className="space-y-3">
            {views?.byDevice && Object.entries(views.byDevice).map(([device, count]) => (
              <div key={device} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{device}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(count / views.total) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Engagement Metrics */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Likes</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{engagement?.likes || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Shares</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{engagement?.shares || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Comments</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{engagement?.comments || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bookmarks</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{engagement?.bookmarks || 0}</span>
            </div>
          </div>
        </Card>

        {/* Registration Timeline */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Timeline</h3>
          <div className="space-y-2">
            {registrations?.byDate?.slice(-7).map((entry, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(entry.date).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${(entry.count / Math.max(...registrations.byDate.map(e => e.count))) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{entry.count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Event Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Event Title</p>
            <p className="font-medium text-gray-900 dark:text-white">{analytics.event?.title}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
            <p className="font-medium text-gray-900 dark:text-white">{analytics.event?.category}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Start Date</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {analytics.event?.startDateTime ? 
                new Date(analytics.event.startDateTime).toLocaleDateString() : 
                'N/A'
              }
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Organizer</p>
            <p className="font-medium text-gray-900 dark:text-white">{analytics.event?.organizer}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EventAnalytics;
