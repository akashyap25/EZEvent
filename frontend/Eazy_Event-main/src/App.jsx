import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import './index.css';
import { 
  Home, 
  CreateEvent, 
  EventDetails, 
  UpdateEvent, 
  Profile, 
  Task, 
  AssignedTask,
  AllTasks,
  MyEvents,
  Settings,
  Signin,
  RegisterForm
} from './Components/LazyComponents';
import OAuthCallback from './Pages/OAuthCallback';
import Support from './Pages/Support';
import NotFound from './Pages/NotFound';
import ForgotPassword from './Pages/ForgotPassword';
import ResetPassword from './Pages/ResetPassword';
import VerifyEmail from './Pages/VerifyEmail';
import VerifyAccount from './Pages/VerifyAccount';
import KeyboardShortcuts from './Pages/KeyboardShortcuts';
import Pricing from './Pages/Pricing';
import Organizations from './Pages/Organizations';
import AdminDashboard from './Pages/AdminDashboard';
import Layout from './Components/Layout';
import ErrorBoundary from './Components/ErrorBoundary';
import ScrollToTop from './Components/ScrollToTop';
import LoadingSpinner from './Components/LoadingSpinner';
import ProtectedRoute from './Components/ProtectedRoute';
import Dashboard from './Components/General/Dashboard';
import Bookmarks from './Components/General/Bookmarks';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';

const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/sign-in',
        element: <Signin />,
      },
      {
        path: 'register',
        element: <RegisterForm />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPassword />,
      },
      {
        path: '/reset-password',
        element: <ResetPassword />,
      },
      {
        path: '/shortcuts',
        element: <KeyboardShortcuts />,
      },
      {
        path: '/pricing',
        element: <Pricing />,
      },
      {
        path: '/verify-email/:token',
        element: <VerifyEmail />,
      },
      {
        path: '/verify-account',
        element: <VerifyAccount />,
      },
      {
        path: '/oauth/callback',
        element: <OAuthCallback />,
      },
      {
        path: '/',
        element: <Outlet />,
        children: [
          {
            path: '/',
            element: <Home />,
          },
          {
            path: '/events/create',
            element: <ProtectedRoute><CreateEvent /></ProtectedRoute>
          },
          {
            path: '/events/my',
            element: <ProtectedRoute><MyEvents /></ProtectedRoute>
          },
          {
            path: '/dashboard',
            element: <ProtectedRoute><Dashboard /></ProtectedRoute>
          },
          {
            path: '/bookmarks',
            element: <ProtectedRoute><Bookmarks /></ProtectedRoute>
          },
          {
            path: '/tasks',
            element: <ProtectedRoute><AllTasks /></ProtectedRoute>
          },
          {
            path: '/settings',
            element: <ProtectedRoute><Settings /></ProtectedRoute>
          },
          {
            path: '/organizations',
            element: <ProtectedRoute><Organizations /></ProtectedRoute>
          },
          {
            path: '/admin',
            element: <ProtectedRoute><AdminDashboard /></ProtectedRoute>
          },
          {
            path: '/events/:id',
            element: <EventDetails />
          },
          {
            path: '/events/:id/update',
            element: <ProtectedRoute><UpdateEvent /></ProtectedRoute>
          },
          {
            path: '/profile/:id',
            element: <ProtectedRoute><Profile /></ProtectedRoute>
          },
          {
            path: '/events/:id/tasks',
            element: <ProtectedRoute><Task /></ProtectedRoute>,
          },
          {
            path: '/tasks/:id',
            element: <ProtectedRoute><AssignedTask /></ProtectedRoute>,
          },
          {
            path: '/support',
            element: <Support />
          },
          {
            path: '*',
            element: <NotFound />
          }
        ],
      },
    ],
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});

import { I18nProvider } from './contexts/I18nContext';

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <AuthProvider>
              <RouterProvider router={appRouter} />
            </AuthProvider>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
