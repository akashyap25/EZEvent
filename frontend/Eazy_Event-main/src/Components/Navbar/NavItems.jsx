import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const NavItems = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { user, isAuthenticated } = useAuth();

  const headerLinks = [
    { label: 'Home', route: '/' },
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Create Event', route: '/events/create' },
    { label: 'My Events', route: '/events/my' },
    { label: 'Bookmarks', route: '/bookmarks' },
    { label: 'Support', route: '/support' },
  ];

  if (!isAuthenticated) {
    return (
      <ul className="md:flex-between flex w-full flex-col items-start gap-5 md:flex-row">
        <li className="flex-center p-medium-16 whitespace-nowrap">
          <Link to="/sign-in">Sign In</Link>
        </li>
        <li className="flex-center p-medium-16 whitespace-nowrap">
          <Link to="/register">Register</Link>
        </li>
      </ul>
    );
  }

  return (
    <ul className="md:flex-between flex w-full flex-col items-start gap-5 md:flex-row">
      {headerLinks.map((link) => {
        const isActive = pathname === link.route;

        return (
          <li
            key={link.route}
            className={`${
              isActive ? 'text-primary-500' : ''
            } flex-center p-medium-16 whitespace-nowrap`}
          >
            <Link to={link.route}>{link.label}</Link>
          </li>
        );
      })}
    </ul>
  );
};

export default NavItems;
