import { useEffect, useState } from 'react';
import apiService from '../../Utils/apiService';
import { useParams, Link, useNavigate } from 'react-router-dom';
import formatDateTime from '../../Utils/FormatDate';
import { SERVER_URL } from '../../Utils/Constants';
import { useAuth } from "../../contexts/AuthContext";
import getUser from '../../Utils/GetUser';
import Card from '../UI/Card';
import Button from '../UI/Button';
import LoadingSpinner from '../UI/LoadingSpinner';
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
  Eye,
  ArrowLeft,
  User,
  Tag,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  XCircle,
  Play,
  Pause,
  Download,
  Bookmark,
  MessageCircle,
  ThumbsUp,
  Share,
  Copy,
  Flag,
  BarChart3,
  Calendar as CalendarIcon,
  UserPlus,
  Repeat
} from 'lucide-react';
import { lazy, Suspense } from 'react';

// Lazy load heavy sub-components (only rendered conditionally)
const EventAnalytics = lazy(() => import('./EventAnalytics'));
const CalendarExport = lazy(() => import('./CalendarExport'));
const EventCollaboration = lazy(() => import('./EventCollaboration'));
const ChatRoom = lazy(() => import('./ChatRoom'));
const SocialShare = lazy(() => import('./SocialShare'));
const EventChatbot = lazy(() => import('../AI/EventChatbot'));
const EventReviews = lazy(() => import('./EventReviews'));
const EventCard = lazy(() => import('./EventCard'));
const CheckoutButton = lazy(() => import('../General/CheckoutButton'));
const WaitlistButton = lazy(() => import('./WaitlistButton'));

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCalendarExport, setShowCalendarExport] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSocialShare, setShowSocialShare] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user: currentUser, isAuthenticated } = useAuth(); 
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!currentUser?._id) return;
        const fetchedUser = await getUser(currentUser._id);
        setUser(fetchedUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, [currentUser?._id]);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!id) {
          throw new Error('Event ID is required');
        }
        
        const eventResponse = await apiService.get(`/api/events/${id}`);
        // apiService already unwraps response.data, so eventResponse IS { success, data }
        const eventData = eventResponse?.success ? eventResponse.data : (eventResponse?.data || eventResponse);
        setEvent(eventData);
        
        // Fetch related events only if event data is valid
        if (eventData && eventData.category && eventData.category._id) {
          try {
            const relatedEventsResponse = await apiService.get(`/api/events/related`, {
              params: {
                categoryId: eventData.category._id,
                eventId: eventData._id,
              },
            });
            const relatedData = Array.isArray(relatedEventsResponse) ? relatedEventsResponse : 
                               Array.isArray(relatedEventsResponse?.data) ? relatedEventsResponse.data : [];
            setRelatedEvents(relatedData);
          } catch (relatedError) {
            console.error('Error fetching related events:', relatedError);
            // Don't fail the entire request if related events fail
            setRelatedEvents([]);
          }
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        setError('Failed to load event details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [id]);

  const handleLike = () => {
    if (!isAuthenticated) {
      navigate('/sign-in');
      return;
    }
    setIsLiked(!isLiked);
  };

  const handleBookmark = () => {
    if (!isAuthenticated) {
      navigate('/sign-in');
      return;
    }
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const getEventStatus = () => {
    if (!event) return { status: 'loading', color: 'gray' };
    
    const now = new Date();
    const start = new Date(event.startDateTime);
    const end = new Date(event.endDateTime);

    if (now >= start && now <= end) {
      return { status: 'Live', color: 'red', icon: Play };
    } else if (now < start) {
      return { status: 'Upcoming', color: 'blue', icon: Clock };
    } else {
      return { status: 'Past', color: 'gray', icon: XCircle };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center p-8 max-w-md">
          <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Event Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The event you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  const eventOrganizerId = (event?.organizer?._id ?? event?.organizer)?.toString?.();
  const currentUserId = (currentUser?._id ?? user?._id)?.toString?.();
  const isEventCreator = Boolean(eventOrganizerId && currentUserId && eventOrganizerId === currentUserId);
  const eventStatus = getEventStatus();
  const StatusIcon = eventStatus.icon;

  const { dateOnly: startDateOnly, timeOnly: startTimeOnly } = formatDateTime(event?.startDateTime);
  const { dateOnly: endDateOnly, timeOnly: endTimeOnly } = formatDateTime(event?.endDateTime);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Back Button */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              icon={ArrowLeft}
              className="flex items-center gap-2"
            >
              Back
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                icon={Heart}
                className={isLiked ? 'text-red-500' : 'text-gray-500'}
              >
                {isLiked ? 'Liked' : 'Like'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                icon={Bookmark}
                className={isBookmarked ? 'text-blue-500' : 'text-gray-500'}
              >
                {isBookmarked ? 'Saved' : 'Save'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                icon={Share}
              >
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Event Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            <Card className="overflow-hidden p-0">
              <div className="relative">
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-64 md:h-80 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white bg-${eventStatus.color}-500`}>
                    <StatusIcon className="w-4 h-4" />
                    {eventStatus.status}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white/90 hover:bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    icon={Flag}
                  >
                    Report
                  </Button>
                </div>
              </div>
            </Card>

            {/* Event Details */}
            <Card>
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    {event.title}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        by <span className="font-semibold text-blue-600">
                          {event.organizer.firstName} {event.organizer.lastName}
                        </span>
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-gray-400" />
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                        {event.category.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-blue-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Start Date & Time</p>
                      <p className="text-gray-600 dark:text-gray-400">{startDateOnly} at {startTimeOnly}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-blue-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">End Date & Time</p>
                      <p className="text-gray-600 dark:text-gray-400">{endDateOnly} at {endTimeOnly}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-red-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Location</p>
                      <p className="text-gray-600 dark:text-gray-400">{event.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-green-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Capacity</p>
                      <p className="text-gray-600 dark:text-gray-400">{event.capacity} attendees</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">About This Event</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{event.description}</p>
                </div>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* External Link */}
                {event.url && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Event Website</h3>
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visit Event Website
                    </a>
                  </div>
                )}
              </div>
            </Card>

            {/* Event Reviews Section - only show when event has ended */}
            {new Date(event.endDateTime) < new Date() && (
              <Suspense fallback={<div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading reviews...</div>}>
                <EventReviews eventId={event._id} isOrganizer={isEventCreator} />
              </Suspense>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price & Registration */}
            <Card>
              <div className="text-center space-y-4">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {event.isFree ? 'FREE' : `₹${Number(event.price)}`}
                </div>
                
                <Suspense fallback={<div className="py-3 text-center text-gray-400">Loading...</div>}>
                  <CheckoutButton event={event} isEventCreator={isEventCreator} />
                  <WaitlistButton event={event} />
                </Suspense>
                
                {isEventCreator && (
                  <div className="space-y-2">
                    <Button
                      variant="secondary"
                      fullWidth
                      icon={Edit}
                      onClick={() => navigate(`/events/${event._id}/update`)}
                    >
                      Edit Event
                    </Button>
                    
                    <Button
                      variant="outline"
                      fullWidth
                      icon={Users}
                      onClick={() => navigate(`/events/${event._id}/tasks`)}
                    >
                      Manage Tasks
                    </Button>
                    
                    <Button
                      variant="outline"
                      fullWidth
                      icon={BarChart3}
                      onClick={() => setShowAnalytics(true)}
                    >
                      View Analytics
                    </Button>
                    
                    <Button
                      variant="outline"
                      fullWidth
                      icon={UserPlus}
                      onClick={() => setShowCollaboration(true)}
                    >
                      Manage Team
                    </Button>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    fullWidth
                    icon={MessageCircle}
                    onClick={() => setShowChat(true)}
                  >
                    Join Chat
                  </Button>
                  
                  <Button
                    variant="outline"
                    fullWidth
                    icon={Share2}
                    onClick={() => setShowSocialShare(true)}
                  >
                    Share Event
                  </Button>
                  
                  <Button
                    variant="outline"
                    fullWidth
                    icon={CalendarIcon}
                    onClick={() => setShowCalendarExport(true)}
                  >
                    Add to Calendar
                  </Button>
                  
                  {event.isRecurring && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Repeat className="w-4 h-4" />
                      <span>Recurring Event</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Event Stats */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Event Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Registered</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {typeof event.registeredCount === 'number' ? event.registeredCount : (event.attendees?.length || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Capacity</span>
                  <span className="font-medium text-gray-900 dark:text-white">{event.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <span className={`font-medium text-${eventStatus.color}-600`}>
                    {eventStatus.status}
                  </span>
                </div>
              </div>
            </Card>

            {/* Organizer Info */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Organizer</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {event.organizer.firstName} {event.organizer.lastName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">@{event.organizer.username}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Related Events */}
        {relatedEvents.length > 1 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Related Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
              {relatedEvents
                .filter((relatedEvent) => relatedEvent._id !== event._id)
                .slice(0, 4)
                .map((relatedEvent) => (
                  <EventCard key={relatedEvent._id} event={relatedEvent} />
                ))}
              </Suspense>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <Card className="max-w-md w-full mx-4 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Share Event</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShareModal(false)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <Button
                fullWidth
                onClick={handleCopyLink}
                icon={copied ? CheckCircle : Copy}
                variant={copied ? 'success' : 'outline'}
              >
                {copied ? 'Link Copied!' : 'Copy Link'}
              </Button>
              
              <Button
                fullWidth
                variant="outline"
                icon={Share2}
              >
                Share on Social Media
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Event Management Modals */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event Analytics</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAnalytics(false)}
                  icon={XCircle}
                >
                  Close
                </Button>
              </div>
              <Suspense fallback={<div className="p-4 text-center">Loading analytics...</div>}>
                <EventAnalytics eventId={event._id} />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {showCalendarExport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Export to Calendar</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCalendarExport(false)}
                  icon={XCircle}
                >
                  Close
                </Button>
              </div>
              <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
                <CalendarExport event={event} />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {showCollaboration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Team</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCollaboration(false)}
                  icon={XCircle}
                >
                  Close
                </Button>
              </div>
              <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
                <EventCollaboration eventId={event._id} />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {showChat && (
        <Suspense fallback={null}>
          <ChatRoom 
            eventId={event._id} 
            onClose={() => setShowChat(false)} 
          />
        </Suspense>
      )}

      {showSocialShare && (
        <Suspense fallback={null}>
          <SocialShare 
            event={event} 
            onClose={() => setShowSocialShare(false)} 
          />
        </Suspense>
      )}

      {/* AI Event Chatbot - floating button */}
      <Suspense fallback={null}>
        <EventChatbot eventId={event._id} eventTitle={event.title} />
      </Suspense>
    </div>
  );
};

export default EventDetails;
