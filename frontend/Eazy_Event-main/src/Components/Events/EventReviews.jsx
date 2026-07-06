import React, { useState, useEffect } from 'react';
import { 
  Star, 
  ThumbsUp, 
  Flag, 
  Send, 
  User,
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SERVER_URL } from '../../Utils/Constants';
import Card from '../UI/Card';
import Button from '../UI/Button';

const EventReviews = ({ eventId, isOrganizer }) => {
  const { user, accessToken, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    review: ''
  });

  useEffect(() => {
    fetchReviews();
  }, [eventId]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/reviews/event/${eventId}`);
      const data = await response.json();
      if (data.success && data.data) {
        // API returns { data: { reviews, stats, pagination } }
        const list = data.data.reviews;
        setReviews(Array.isArray(list) ? list : []);
        const s = data.data.stats || {};
        setStats({
          averageRating: s.averageRating ?? data.averageRating ?? 0,
          totalReviews: s.totalReviews ?? data.totalReviews ?? (Array.isArray(list) ? list.length : 0)
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${SERVER_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          ...newReview,
          event: eventId
        })
      });
      const data = await response.json();
      if (data.success && data.data) {
        const next = Array.isArray(reviews) ? reviews : [];
        setReviews([data.data, ...next]);
        setNewReview({ rating: 5, title: '', review: '' });
        setShowForm(false);
        fetchReviews();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    if (!isAuthenticated) return;

    try {
      await fetch(`${SERVER_URL}/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      fetchReviews();
    } catch (error) {
      console.error('Error marking as helpful:', error);
    }
  };

  const renderStars = (rating, interactive = false, onChange = null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={interactive ? () => onChange(star) : undefined}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            disabled={!interactive}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating 
                  ? 'text-yellow-400 fill-yellow-400' 
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="mt-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Reviews & Ratings
            </h3>
            {stats.totalReviews > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-gray-900 dark:text-white">{stats.averageRating.toFixed(1)}</span>
                </div>
                <span className="text-gray-500 dark:text-gray-400">({stats.totalReviews} reviews)</span>
              </div>
            )}
          </div>
          
          {isAuthenticated && !isOrganizer && (
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              Write Review
            </Button>
          )}
        </div>

        {/* Review Form - only for non-organizers */}
        {showForm && !isOrganizer && (
          <form onSubmit={handleSubmitReview} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Rating
              </label>
              {renderStars(newReview.rating, true, (rating) => setNewReview({ ...newReview, rating }))}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </label>
              <input
                type="text"
                value={newReview.title}
                onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                placeholder="Summarize your experience"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Review
              </label>
              <textarea
                value={newReview.review}
                onChange={(e) => setNewReview({ ...newReview, review: e.target.value })}
                placeholder="Share your experience..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" loading={submitting}>
                <Send className="w-4 h-4 mr-2" />
                Submit Review
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : !Array.isArray(reviews) || reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>{isOrganizer ? 'Reviews from attendees will appear here.' : 'No reviews yet. Be the first to review!'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(Array.isArray(reviews) ? reviews : []).map((review) => (
              <div key={review._id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {review.user?.firstName} {review.user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                  {renderStars(review.rating)}
                </div>
                
                {review.title && (
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">{review.title}</h4>
                )}
                <p className="text-gray-600 dark:text-gray-300 mb-3">{review.review}</p>
                
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleMarkHelpful(review._id)}
                    className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Helpful ({review.helpfulVotes || 0})
                  </button>
                  <button className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600">
                    <Flag className="w-4 h-4" />
                    Report
                  </button>
                </div>

                {/* Organizer Response */}
                {review.response && (
                  <div className="mt-3 pl-4 border-l-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-r-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                      Response from organizer
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{review.response.message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default EventReviews;
