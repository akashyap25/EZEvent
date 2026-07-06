import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService, { eventApi } from '../Utils/apiService';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  ArrowRight, 
  Search as SearchIcon, 
  Filter,
  TrendingUp,
  Shield,
  Zap,
  Heart,
  ChevronRight,
  Play,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { extractApiArray } from '../Utils/apiUtils';
import EventCard from './Events/EventCard';
import SearchComponent from './General/Search';
import CategoryFilter from './General/CategoryFilter';
import Card from './UI/Card';
import Button from './UI/Button';
import LoadingSpinner from './UI/LoadingSpinner';
import { EventGridSkeleton } from './UI/Skeleton';
import HeroSection from './Sections/HeroSection';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(8);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalUsers: 0,
    totalCategories: 0,
    successRate: 0
  });

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const [eventsResponse, statsResponse] = await Promise.all([
          eventApi.getAll(),
          apiService.get('/api/stats').catch(() => null)
        ]);
        const eventsData = extractApiArray(eventsResponse);
        setEvents(eventsData);
        
        // Use real platform stats from API
        const statsData = statsResponse?.data || {};
        setStats({
          totalEvents: statsData.totalEvents || eventsData.length,
          totalUsers: statsData.totalUsers || 0,
          totalCategories: statsData.totalCategories || 0,
          successRate: statsData.totalOrders || 0
        });
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filter events
  useEffect(() => {
    // Ensure events is an array before processing
    if (!Array.isArray(events)) {
      setFilteredEvents([]);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const query = params.get('query') || '';
    const category = params.get('category') || '';

    let filtered = events;

    if (query) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (category && category !== 'All') {
      filtered = filtered.filter(event => 
        event.category.name === category
      );
    }

    const now = new Date();
    
    // Show upcoming events first, then ongoing, then recent past events
    const upcomingEvents = filtered
      .filter(event => new Date(event.startDateTime) > now)
      .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

    const ongoingEvents = filtered
      .filter(event => new Date(event.startDateTime) <= now && new Date(event.endDateTime) >= now)
      .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

    // Show recent past events (within last 60 days) for better content
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const recentPastEvents = filtered
      .filter(event => {
        const eventDate = new Date(event.endDateTime);
        return eventDate < now && eventDate > sixtyDaysAgo;
      })
      .sort((a, b) => new Date(b.endDateTime) - new Date(a.endDateTime))
      .slice(0, 8); // Limit to 8 recent past events

    // If we don't have enough events, show more past events
    let allEvents = [...upcomingEvents, ...ongoingEvents, ...recentPastEvents];
    
    if (allEvents.length < 6) {
      const morePastEvents = filtered
        .filter(event => {
          const eventDate = new Date(event.endDateTime);
          return eventDate < now;
        })
        .sort((a, b) => new Date(b.endDateTime) - new Date(a.endDateTime))
        .slice(0, 12 - allEvents.length);
      
      allEvents = [...allEvents, ...morePastEvents];
    }
    
    setFilteredEvents(allEvents);
  }, [events, window.location.search]);

  const features = [
    {
      icon: Calendar,
      title: 'Easy Event Creation',
      description: 'Create and manage events in minutes with our intuitive interface'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Connect with thousands of event organizers and attendees'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Bank-level security with 99.9% uptime guarantee'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized performance for the best user experience'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Event Organizer',
      content: 'EZEvent has transformed how I organize events. The platform is intuitive and the community is amazing!',
      rating: 5
    },
    {
      name: 'Mike Chen',
      role: 'Marketing Director',
      content: 'The analytics and insights provided help us make data-driven decisions for our events.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Community Manager',
      content: 'The best event platform I\'ve used. Highly recommend for anyone serious about events.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <HeroSection isAuthenticated={isAuthenticated} stats={stats} />

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose EZEvent?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Everything you need to create, manage, and promote amazing events in one powerful platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Discover Amazing Events
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Find events that match your interests and connect with like-minded people.
              </p>
            </div>
            {isAuthenticated && (
              <Button
                size="lg"
                variant="primary"
                icon={Calendar}
                iconPosition="left"
                className="mt-6 lg:mt-0"
                onClick={() => window.location.href = '/events/create'}
              >
                Create Event
              </Button>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <SearchComponent />
            </div>
            <div className="md:w-64">
              <CategoryFilter />
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <EventGridSkeleton count={8} />
          ) : error ? (
            <Card className="text-center py-16">
              <div className="text-red-500 mb-4">
                <Calendar className="w-16 h-16 mx-auto opacity-50" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} size="sm">Try Again</Button>
            </Card>
          ) : filteredEvents.length === 0 ? (
            <Card className="text-center py-16">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search criteria or create a new event.
              </p>
              {isAuthenticated && (
                <Button size="lg" icon={Calendar} onClick={() => window.location.href = '/events/create'}>
                  Create Your First Event
                </Button>
              )}
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredEvents.slice(0, visibleCount).map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
              {filteredEvents.length > visibleCount && (
                <div className="text-center mt-8">
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => setVisibleCount(prev => prev + 8)}
                  >
                    Show More Events ({filteredEvents.length - visibleCount} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Join thousands of satisfied event organizers and attendees.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Create Your Next Event?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of event organizers who trust EZEvent to make their events unforgettable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Button
                size="lg"
                variant="outline"
                className="bg-white dark:bg-gray-800 text-blue-600 hover:bg-gray-100 border-2 border-white"
                icon={Calendar}
                iconPosition="right"
                onClick={() => window.location.href = '/events/create'}
              >
                Create Event
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  variant="accent"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => window.location.href = '/register'}
                >
                  Get Started Free
                </Button>
                <button
                  onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-3 text-base font-semibold rounded-lg border-2 border-white/80 text-white bg-white/10 backdrop-blur-sm hover:bg-white dark:bg-gray-800 hover:text-gray-900 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.97]"
                >
                  Learn More
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;