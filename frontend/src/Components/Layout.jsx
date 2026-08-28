import { Suspense, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { EventGridSkeleton } from './UI/Skeleton';
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
  const location = useLocation();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // brief hide to trigger fade-in on route change
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, [location.pathname]);

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
      <main className="flex-1 min-h-[60vh] relative">
        <Suspense fallback={<div className="absolute inset-0 p-6 overflow-auto"><EventGridSkeleton /></div>}>
          <div className={`h-full transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <Outlet />
          </div>
        </Suspense>
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
};

export default Layout;