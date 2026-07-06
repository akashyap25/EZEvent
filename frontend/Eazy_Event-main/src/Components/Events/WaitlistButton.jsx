import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../Utils/apiService';
import Button from '../UI/Button';
import { Clock, Users, X, Check } from 'lucide-react';

const WaitlistButton = ({ event }) => {
  const { user, isAuthenticated } = useAuth();
  const [onWaitlist, setOnWaitlist] = useState(false);
  const [position, setPosition] = useState(null);
  const [totalWaiting, setTotalWaiting] = useState(0);
  const [loading, setLoading] = useState(false);

  const isFull = event?.capacity > 0 && (event?.attendees?.length || 0) >= event?.capacity;

  useEffect(() => {
    if (isAuthenticated && event?._id && isFull) {
      checkWaitlistStatus();
    }
  }, [event?._id, isAuthenticated]);

  const checkWaitlistStatus = async () => {
    try {
      const response = await apiService.get(`/api/waitlist/${event._id}/position`);
      if (response?.onWaitlist) {
        setOnWaitlist(true);
        setPosition(response.data?.position);
        setTotalWaiting(response.data?.totalWaiting || 0);
      }
    } catch (err) {
      // Not on waitlist
    }
  };

  const joinWaitlist = async () => {
    setLoading(true);
    try {
      const response = await apiService.post(`/api/waitlist/${event._id}`);
      setOnWaitlist(true);
      setPosition(response?.data?.position);
      setTotalWaiting((response?.data?.position || 0));
    } catch (err) {
      alert(err.message || 'Failed to join waitlist');
    } finally {
      setLoading(false);
    }
  };

  const leaveWaitlist = async () => {
    setLoading(true);
    try {
      await apiService.delete(`/api/waitlist/${event._id}`);
      setOnWaitlist(false);
      setPosition(null);
    } catch (err) {
      alert(err.message || 'Failed to leave waitlist');
    } finally {
      setLoading(false);
    }
  };

  // Only show if event is full
  if (!isFull || !isAuthenticated) return null;

  // Don't show to event organizer
  if (user?._id === (event?.organizer?._id || event?.organizer)) return null;

  return (
    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Event is full</span>
      </div>
      
      {onWaitlist ? (
        <div>
          <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
            You're on the waitlist at position <strong>#{position}</strong>
            {totalWaiting > 0 && ` of ${totalWaiting} waiting`}. 
            We'll notify you if a spot opens up.
          </p>
          <Button
            onClick={leaveWaitlist}
            loading={loading}
            size="sm"
            variant="outline"
            icon={X}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Leave Waitlist
          </Button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
            All spots are taken. Join the waitlist to be notified when a spot opens.
          </p>
          <Button
            onClick={joinWaitlist}
            loading={loading}
            size="sm"
            icon={Clock}
          >
            Join Waitlist
          </Button>
        </div>
      )}
    </div>
  );
};

export default WaitlistButton;
