import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../Utils/apiService';
import Card from '../UI/Card';
import LoadingSpinner from '../UI/LoadingSpinner';
import { Bookmark, Calendar, MapPin, Clock, Trash2 } from 'lucide-react';

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/api/bookmarks');
      setBookmarks(response?.data || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (eventId) => {
    try {
      await apiService.post(`/api/bookmarks/${eventId}`);
      setBookmarks(prev => prev.filter(b => (b.event?._id || b.event) !== eventId));
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading bookmarks..." fullScreen />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Bookmark className="w-8 h-8 text-purple-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Saved Events</h1>
      </div>

      {bookmarks.length === 0 ? (
        <Card className="p-12 text-center">
          <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No saved events</h2>
          <p className="text-gray-500 mb-6">Browse events and click the bookmark icon to save them here.</p>
          <Link to="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block">
            Browse Events
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map(bookmark => {
            const event = bookmark.event || {};
            return (
              <Card key={bookmark._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {event.imageUrl && (
                  <img src={event.imageUrl} alt={event.title} className="w-full h-40 object-cover" />
                )}
                <div className="p-5">
                  <Link to={`/events/${event._id}`}>
                    <h3 className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                  </Link>
                  
                  <div className="mt-3 space-y-2 text-sm text-gray-500">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {event.startDateTime ? new Date(event.startDateTime).toLocaleDateString('en-US', { 
                        weekday: 'short', month: 'short', day: 'numeric' 
                      }) : 'TBD'}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {event.location || 'Online'}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {event.isFree ? 'Free' : `₹${event.price}`}
                    </p>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      event.status === 'upcoming' ? 'bg-green-100 text-green-700' :
                      event.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{event.status || 'upcoming'}</span>
                    
                    <button
                      onClick={() => removeBookmark(event._id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
