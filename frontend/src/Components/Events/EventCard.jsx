import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  Edit, 
  Trash2, 
  Heart,
  Share2,
  Eye
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../Utils/apiService';
import formatDateTime from '../../Utils/FormatDate';
import DeleteConfirmation from '../General/DeleteConfirmation';
import Card from '../UI/Card';
import Button from '../UI/Button';

const EventCard = ({ event, hidePrice, showActions = false, onStatusUpdate }) => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const eventOrganizerId = event?.organizer?._id?.toString();
  const isEventCreator = currentUser?._id === eventOrganizerId;

  // Check if event is bookmarked on mount
  useEffect(() => {
    if (isAuthenticated && event?._id) {
      apiService.get('/api/bookmarks').then(res => {
        const bookmarks = res?.data || res?.bookmarks || [];
        if (Array.isArray(bookmarks)) {
          const isBookmarked = bookmarks.some(b => 
            (b.event?._id || b.event) === event._id
          );
          setIsLiked(isBookmarked);
        }
      }).catch(() => {});
    }
  }, [isAuthenticated, event?._id]);

  const { dateOnly: startDateOnly, timeOnly: startTimeOnly } = formatDateTime(event?.startDateTime);
  const { dateOnly: endDateOnly, timeOnly: endTimeOnly } = formatDateTime(event?.endDateTime);

  const isEventLive = new Date(event.startDateTime) <= new Date() && new Date(event.endDateTime) >= new Date();
  const isEventUpcoming = new Date(event.startDateTime) > new Date();
  const isEventPast = new Date(event.endDateTime) < new Date();

  const getEventStatus = () => {
    if (isEventLive) return { text: 'Live', color: 'bg-red-500', textColor: 'text-red-500' };
    if (isEventUpcoming) return { text: 'Upcoming', color: 'bg-green-500', textColor: 'text-green-500' };
    return { text: 'Past', color: 'bg-gray-50 dark:bg-gray-9000', textColor: 'text-gray-500' };
  };

  const status = getEventStatus();

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    
    try {
      await apiService.post(`/api/bookmarks/${event._id}`);
      setIsLiked(!isLiked);
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: `Check out this event: ${event.title}`,
        url: window.location.origin + `/events/${event._id}`
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + `/events/${event._id}`);
    }
  };

  return (
    <Card 
      className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Event Image */}
      <div className="relative h-48 overflow-hidden">
        <Link to={`/events/${event._id}`}>
          <img
            src={event.imageUrl}
            alt={event.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-20">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${status.color}`}>
            {status.text}
          </span>
        </div>

        {/* Price Badge */}
        {!hidePrice && (
          <div className="absolute top-3 right-3">
            <span className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-900 dark:text-white">
              {event.isFree ? 'FREE' : `₹${Number(event.price)}`}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-12 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          {isAuthenticated && (
            <>
              <button
                onClick={handleLike}
                className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white dark:bg-gray-800 transition-colors z-10 pointer-events-auto"
                title="Like event"
              >
                <Heart 
                  className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-600'}`} 
                />
              </button>
              <button
                onClick={handleShare}
                className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white dark:bg-gray-800 transition-colors z-10 pointer-events-auto"
                title="Share event"
              >
                <Share2 className="w-4 h-4 text-gray-600" />
              </button>
            </>
          )}
        </div>

        {/* Creator Actions */}
        {isEventCreator && (
          <div className="absolute bottom-3 right-3 flex gap-2 z-10 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Link to={`/events/${event._id}/update`}>
              <Button
                size="sm"
                variant="primary"
                className="shadow-lg z-10"
                icon={Edit}
              >
                Edit
              </Button>
            </Link>
            <DeleteConfirmation eventId={event._id} />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-0" />
      </div>

      {/* Event Content */}
      <div className="p-6">
        {/* Category */}
        {event.category?.name && (
        <div className="mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
            {event.category.name}
          </span>
        </div>
        )}

        {/* Event Title */}
        <Link to={`/events/${event._id}`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {event.title}
          </h3>
        </Link>

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span>
              {startDateOnly === endDateOnly
                ? `${startDateOnly} ${startTimeOnly} - ${endTimeOnly}`
                : `${startDateOnly} - ${endDateOnly}`}
            </span>
          </div>
          
          {event.location && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>

        {/* Organizer */}
        {event.organizer?.firstName && (
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {event.organizer.firstName[0]}{event.organizer.lastName?.[0] || ''}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {event.organizer.firstName} {event.organizer.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Organizer</p>
            </div>
          </div>

          {/* View Button */}
          <Link to={`/events/${event._id}`}>
            <Button
              size="sm"
              variant="outline"
              icon={Eye}
            >
              View
            </Button>
          </Link>
        </div>
        )}

        {/* Action Buttons for My Events */}
        {showActions && isEventCreator && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex gap-2">
              <Link to={`/events/${event._id}/update`} className="flex-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  icon={Edit}
                >
                  Edit
                </Button>
              </Link>
              <Link to={`/events/${event._id}/tasks`} className="flex-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  icon={Users}
                >
                  Tasks
                </Button>
              </Link>
              <DeleteConfirmation
                eventId={event._id}
                eventTitle={event.title}
                onDelete={() => {
                  // Remove from local state if onStatusUpdate is provided
                  if (onStatusUpdate) {
                    onStatusUpdate('deleted');
                  }
                }}
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                  icon={Trash2}
                >
                  Delete
                </Button>
              </DeleteConfirmation>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

EventCard.propTypes = {
  event: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    imageUrl: PropTypes.string.isRequired,
    isFree: PropTypes.bool.isRequired,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    category: PropTypes.shape({
      name: PropTypes.string.isRequired,
    }).isRequired,
    startDateTime: PropTypes.string.isRequired,
    endDateTime: PropTypes.string.isRequired,
    organizer: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired,
    }).isRequired,
    location: PropTypes.string,
  }).isRequired,
  hidePrice: PropTypes.bool,
  showActions: PropTypes.bool,
  onStatusUpdate: PropTypes.func,
};

export default EventCard;