import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Navbar/Header';
import Footer from './Footer';
import LoadingSpinner from './UI/LoadingSpinner';
import ScrollToTop from './ScrollToTop';
import ScrollToTopButton from './ScrollToTopButton';
import Onboarding from './Onboarding';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <ScrollToTop />
      <Onboarding />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
};

export default Layout;