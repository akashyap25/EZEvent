import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, CheckCircle, Star } from 'lucide-react';
import Button from '../UI/Button';
import heroImg from '../../assets/images/hero.png';

const HeroSection = ({ isAuthenticated, stats }) => {
  const features = [
    'Easy event creation',
    'Real-time analytics',
    'Secure payments',
    'Mobile responsive'
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-purple-600/50"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl"></div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-white">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Star className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="text-sm font-medium">Trusted by 10,000+ organizers</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Host, Connect,{' '}
              <span className="text-yellow-400 relative">
                Celebrate
                <div className="absolute -bottom-2 left-0 right-0 h-3 bg-yellow-400/20 rounded-full"></div>
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
              Your Events, Our Platform! Join thousands of organizers creating unforgettable experiences that bring people together.
            </p>

            {/* Features List */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center text-blue-100">
                  <CheckCircle className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button
                size="lg"
                variant="accent"
                className="shadow-lg hover:shadow-xl transition-all duration-300"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Events
              </Button>
              
              {!isAuthenticated && (
                <button
                  onClick={() => window.location.href = '/register'}
                  className="px-8 py-3 text-base font-semibold rounded-lg border-2 border-white/80 text-white bg-white/10 backdrop-blur-sm hover:bg-white dark:bg-gray-800 hover:text-gray-900 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.97]"
                >
                  Get Started Free
                </button>
              )}
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">{stats.totalEvents}+</div>
                <div className="text-blue-100 text-sm">Events</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">{stats.totalUsers}+</div>
                <div className="text-blue-100 text-sm">Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">{stats.totalCategories}+</div>
                <div className="text-blue-100 text-sm">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">{stats.successRate}%</div>
                <div className="text-blue-100 text-sm">Success Rate</div>
              </div>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="relative">
            {/* Floating Cards */}
            <div className="absolute -top-4 -left-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-2xl z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Event Created!</div>
                  <div className="text-xs text-gray-500">2 minutes ago</div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-2xl z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Play className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Live Event</div>
                  <div className="text-xs text-gray-500">1,234 attendees</div>
                </div>
              </div>
            </div>

            {/* Main Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl transform rotate-6"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl">
                <img
                  src={heroImg}
                  alt="Event Platform"
                  className="w-full h-auto rounded-2xl"
                />
                
                {/* Overlay Stats */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl flex items-end p-6">
                  <div className="text-white">
                    <div className="text-2xl font-bold">Tech Conference 2024</div>
                    <div className="text-sm text-gray-200">2,500+ attendees • Live now</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;