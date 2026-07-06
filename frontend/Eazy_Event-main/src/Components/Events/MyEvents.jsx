import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SERVER_URL } from '../../Utils/Constants';
import apiService from '../../Utils/apiService';
import EventCard from './EventCard';
import Card from '../UI/Card';
import Button from '../UI/Button';
import LoadingSpinner from '../UI/LoadingSpinner';
import { Calendar, Plus, Filter, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyEvents = () => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Fetch user's events
  useEffect(() => {
    const fetchMyEvents = async () => {
      if (!isAuthenticated || !currentUser?._id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.get(`/api/events/user/${currentUser._id}`);
        // Handle both { success, data } and direct array formats
        const eventsData = Array.isArray(response) ? response : 
                          Array.isArray(response?.data) ? response.data : [];
        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching my events:', error);
        setError('Failed to load your events. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyEvents();
  }, [isAuthenticated, currentUser?._id]);

  // Filter and sort events
  const filteredAndSortedEvents = events
    .filter(event => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'startDate':
          return new Date(a.startDateTime) - new Date(b.startDateTime);
        default:
          return 0;
      }
    });

  // Get event status
  const getEventStatus = (event) => {
    const now = new Date();
    const start = new Date(event.startDateTime);
    const end = new Date(event.endDateTime);

    if (now >= start && now <= end) {
      return 'ongoing';
    } else if (now < start) {
      return 'upcoming';
    } else {
      return 'completed';
    }
  };

  // Update event status
  const updateEventStatus = (eventId, newStatus) => {
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event._id === eventId ? { ...event, status: newStatus } : event
      )
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Please Sign In
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need to be signed in to view your events.
            </p>
            <Link to="/sign-in">
              <Button variant="primary">
                Sign In
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <LoadingSpinner size="lg" text="Loading your events..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="text-center py-12">
            <div className="text-red-500 mb-4">
              <Calendar className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Error Loading Events
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Button 
              variant="primary" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                My Events
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage and view all your created events
              </p>
            </div>
            <Link to="/events/create">
              <Button variant="primary" className="mt-4 sm:mt-0">
                <Plus className="w-4 h-4 mr-2" />
                Create New Event
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Events</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{events.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upcoming</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {events.filter(e => getEventStatus(e) === 'upcoming').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ongoing</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {events.filter(e => getEventStatus(e) === 'ongoing').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Calendar className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {events.filter(e => getEventStatus(e) === 'completed').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title A-Z</option>
                <option value="startDate">Start Date</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Events List */}
        {filteredAndSortedEvents.length === 0 ? (
          <Card className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {events.length === 0 ? 'No Events Created' : 'No Events Match Your Filters'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {events.length === 0 
                ? 'You haven\'t created any events yet. Start by creating your first event!'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {events.length === 0 && (
              <Link to="/events/create">
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Event
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                showActions={true}
                onStatusUpdate={(newStatus) => updateEventStatus(event._id, newStatus)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEvents;
