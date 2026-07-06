import React, { useEffect, useState } from 'react';
import apiService from '../Utils/apiService';
import { Link, useParams } from 'react-router-dom';
import EventCard from './Events/EventCard';
import Card from './UI/Card';
import Button from './UI/Button';
import LoadingSpinner from './UI/LoadingSpinner';
import { 
  User, 
  Calendar, 
  Ticket, 
  Settings, 
  Plus, 
  TrendingUp,
  Users,
  Star,
  Clock,
  MapPin
} from 'lucide-react';

const ProfilePage = () => {
  const { id: userId } = useParams();

  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [orderedEvents, setOrderedEvents] = useState([]);
  const [organizedEvents, setOrganizedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalTickets: 0,
    totalAttendees: 0,
    upcomingEvents: 0
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user details (returns user directly)
        const userResponse = await apiService.get(`/api/users/${userId}`);
        setUser(userResponse?.data || userResponse);

        // Fetch orders (returns { data: orders })
        const ordersResponse = await apiService.get(`/api/orders/user/${userId}`);
        const ordersData = Array.isArray(ordersResponse?.data) ? ordersResponse.data : 
                          Array.isArray(ordersResponse) ? ordersResponse : [];
        setOrders(ordersData);
        setOrderedEvents(ordersData.map((order) => order.event));

        // Fetch organized events (returns array directly)
        const eventsResponse = await apiService.get(`/api/events/user/${userId}`);
        const eventsData = Array.isArray(eventsResponse) ? eventsResponse : 
                          Array.isArray(eventsResponse?.data) ? eventsResponse.data : [];
        setOrganizedEvents(eventsData);

        // Calculate stats
        const now = new Date();
        const upcomingEvents = eventsData.filter(event => new Date(event.startDateTime) > now);
        
        setStats({
          totalEvents: eventsData.length,
          totalTickets: ordersData.length,
          totalAttendees: eventsData.reduce((sum, event) => sum + (event.attendees?.length || 0), 0),
          upcomingEvents: upcomingEvents.length
        });

      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

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
        <div className="text-center p-8">
          <p className="text-red-500 dark:text-red-400 text-lg mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white"></div>
            </div>
            
            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-purple-100 text-lg">{user?.email}</p>
              <p className="text-purple-200">Event Organizer & Attendee</p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button variant="outline" className="bg-white/20 border-white text-white hover:bg-white dark:bg-gray-800 hover:text-purple-600">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button className="bg-white dark:bg-gray-800 text-purple-600 hover:bg-purple-50">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 text-center">
            <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalEvents}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Events Created</div>
          </Card>
          
          <Card className="p-6 text-center">
            <Ticket className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTickets}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tickets Purchased</div>
          </Card>
          
          <Card className="p-6 text-center">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAttendees}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Attendees</div>
          </Card>
          
          <Card className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.upcomingEvents}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Upcoming Events</div>
          </Card>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Events */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                My Events
              </h2>
              <Link to="/events/create">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-1" />
                  Create New
                </Button>
              </Link>
            </div>
            
            {organizedEvents.length > 0 ? (
              <div className="space-y-4">
                {organizedEvents.slice(0, 3).map((event) => (
                  <div key={event._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-gray-900 mb-2">{event.title}</h3>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(event.startDateTime).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {event.location}
                      </div>
                    </div>
                  </div>
                ))}
                {organizedEvents.length > 3 && (
                  <Link to="/my-events" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                    View all {organizedEvents.length} events →
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No events created yet</p>
                <Link to="/events/create">
                  <Button className="mt-4">Create Your First Event</Button>
                </Link>
              </div>
            )}
          </Card>

          {/* My Tickets */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Ticket className="w-5 h-5 mr-2 text-blue-600" />
                My Tickets
              </h2>
              <Link to="/#events">
                <Button size="sm" variant="outline">
                  Browse Events
                </Button>
              </Link>
            </div>
            
            {orderedEvents.length > 0 ? (
              <div className="space-y-4">
                {orderedEvents.slice(0, 3).map((event, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-gray-900 mb-2">{event.title}</h3>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(event.startDateTime).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        {event.isFree ? 'FREE' : `₹${event.price}`}
                      </div>
                    </div>
                  </div>
                ))}
                {orderedEvents.length > 3 && (
                  <Link to="/my-tickets" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View all {orderedEvents.length} tickets →
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Ticket className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No tickets purchased yet</p>
                <Link to="/#events">
                  <Button className="mt-4">Browse Events</Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;



