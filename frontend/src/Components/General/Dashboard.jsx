import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../Utils/apiService';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../UI/Card';
import LoadingSpinner from '../UI/LoadingSpinner';
import { 
  Calendar, Bookmark, CheckSquare, Bell, 
  TrendingUp, Clock, MapPin, ArrowRight 
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    upcomingEvents: [],
    bookmarkedEvents: [],
    myTasks: [],
    recentOrders: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [eventsRes, bookmarksRes, tasksRes] = await Promise.allSettled([
        apiService.get('/api/events/my'),
        apiService.get('/api/bookmarks'),
        apiService.get(`/api/tasks/user/${user?._id}`)
      ]);

      setStats({
        // /api/events/my returns { success, data: [...] }
        upcomingEvents: eventsRes.status === 'fulfilled' ? 
          (Array.isArray(eventsRes.value?.data) ? eventsRes.value.data : []).slice(0, 5) : [],
        // /api/bookmarks returns { success, data: [...] }
        bookmarkedEvents: bookmarksRes.status === 'fulfilled' ? 
          (Array.isArray(bookmarksRes.value?.data) ? bookmarksRes.value.data : []).slice(0, 5) : [],
        // /api/tasks/user/:id returns direct array
        myTasks: tasksRes.status === 'fulfilled' ? 
          (Array.isArray(tasksRes.value) ? tasksRes.value : 
           Array.isArray(tasksRes.value?.data) ? tasksRes.value.data : []).slice(0, 5) : [],
        recentOrders: []
      });
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading dashboard..." fullScreen />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.firstName || 'User'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Here's what's happening with your events.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Calendar} label="My Events" value={stats.upcomingEvents.length} color="blue" />
        <StatCard icon={Bookmark} label="Bookmarked" value={stats.bookmarkedEvents.length} color="purple" />
        <StatCard icon={CheckSquare} label="Tasks" value={stats.myTasks.length} color="green" />
        <StatCard icon={Bell} label="Notifications" value={0} color="orange" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Events</h2>
            <Link to="/events/my" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {stats.upcomingEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No events yet. <Link to="/events/create" className="text-blue-600">Create one!</Link></p>
          ) : (
            <div className="space-y-3">
              {stats.upcomingEvents.map(event => (
                <Link key={event._id} to={`/events/${event._id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{event.title}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(event.startDateTime).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    event.status === 'upcoming' ? 'bg-green-100 text-green-700' :
                    event.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{event.status || 'upcoming'}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Pending Tasks */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Tasks</h2>
            <Link to="/tasks" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {stats.myTasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tasks assigned.</p>
          ) : (
            <div className="space-y-3">
              {stats.myTasks.map(task => (
                <div key={task._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className={`w-3 h-3 rounded-full ${
                    task.priority === 'high' ? 'bg-red-500' :
                    task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.status || 'pending'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Bookmarked Events */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bookmarked Events</h2>
          </div>
          {stats.bookmarkedEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No bookmarked events. Browse and save events you're interested in!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.bookmarkedEvents.map(bookmark => {
                const event = bookmark.event || bookmark;
                return (
                  <Link key={bookmark._id} to={`/events/${event._id}`} className="p-4 border rounded-lg hover:shadow-md transition-shadow dark:border-gray-700">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">{event.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {event.location || 'Online'}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> {event.startDateTime ? new Date(event.startDateTime).toLocaleDateString() : 'TBD'}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

// Stat Card component
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20'
  };

  return (
    <Card className="p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </Card>
  );
};

export default Dashboard;
