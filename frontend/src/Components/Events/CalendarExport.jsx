import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Download, 
  ExternalLink, 
  Copy, 
  Check,
  Globe,
  Mail
} from 'lucide-react';
import axios from 'axios';
import { SERVER_URL } from '../../Utils/Constants';
import Card from '../UI/Card';
import Button from '../UI/Button';

const CalendarExport = ({ event, onClose }) => {
  const [exportOptions, setExportOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState({});

  useEffect(() => {
    if (event) {
      fetchExportOptions();
    }
  }, [event]);

  const fetchExportOptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${SERVER_URL}/api/calendar-export/${event._id}`);

      setExportOptions(response.data.data);
    } catch (error) {
      console.error('Error fetching export options:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadICal = async () => {
    try {
      const response = await axios.get(`${SERVER_URL}/api/calendar-export/${event._id}/ical`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading iCal:', error);
    }
  };

  const openCalendar = (url) => {
    window.open(url, '_blank');
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(prev => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const shareViaEmail = () => {
    const subject = `Event: ${event.title}`;
    const body = `Check out this event: ${event.title}\n\n${event.description}\n\nDate: ${new Date(event.startDateTime).toLocaleDateString()}\nTime: ${new Date(event.startDateTime).toLocaleTimeString()}\nLocation: ${event.location}\n\nAdd to calendar: ${exportOptions?.google?.url}`;
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!exportOptions) {
    return (
      <Card className="p-6 text-center">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Export Options Not Available</h3>
        <p className="text-gray-600 dark:text-gray-400">Unable to load calendar export options for this event.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add to Calendar</h2>
          <p className="text-gray-600 dark:text-gray-400">{event.title}</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Event Details */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          {event.imageUrl && (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-16 h-16 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{event.title}</h3>
            <p className="text-gray-600 text-sm mt-1">{event.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(event.startDateTime).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                {event.location}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* iCal Download */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Download iCal File</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Download a .ics file that works with most calendar applications including Apple Calendar, Outlook, and more.
          </p>
          <Button onClick={downloadICal} className="w-full" icon={Download}>
            Download iCal File
          </Button>
        </Card>

        {/* Google Calendar */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Google Calendar</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Add this event directly to your Google Calendar.
          </p>
          <div className="space-y-2">
            <Button 
              onClick={() => openCalendar(exportOptions.google.url)} 
              className="w-full" 
              icon={ExternalLink}
            >
              Open in Google Calendar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard(exportOptions.google.url, 'google')} 
              className="w-full" 
              icon={copied.google ? Check : Copy}
            >
              {copied.google ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </Card>

        {/* Outlook Calendar */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Outlook Calendar</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Add this event to your Outlook calendar.
          </p>
          <div className="space-y-2">
            <Button 
              onClick={() => openCalendar(exportOptions.outlook.url)} 
              className="w-full" 
              icon={ExternalLink}
            >
              Open in Outlook
            </Button>
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard(exportOptions.outlook.url, 'outlook')} 
              className="w-full" 
              icon={copied.outlook ? Check : Copy}
            >
              {copied.outlook ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </Card>

        {/* Yahoo Calendar */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Yahoo Calendar</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Add this event to your Yahoo Calendar.
          </p>
          <div className="space-y-2">
            <Button 
              onClick={() => openCalendar(exportOptions.yahoo.url)} 
              className="w-full" 
              icon={ExternalLink}
            >
              Open in Yahoo Calendar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard(exportOptions.yahoo.url, 'yahoo')} 
              className="w-full" 
              icon={copied.yahoo ? Check : Copy}
            >
              {copied.yahoo ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Share Options */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Event</h3>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={shareViaEmail} 
            icon={Mail}
          >
            Share via Email
          </Button>
          <Button 
            variant="outline" 
            onClick={() => copyToClipboard(window.location.href, 'url')} 
            icon={copied.url ? Check : Copy}
          >
            {copied.url ? 'URL Copied!' : 'Copy Event URL'}
          </Button>
        </div>
      </Card>

      {/* Event Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Start Time</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {new Date(event.startDateTime).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">End Time</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {new Date(event.endDateTime).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Location</p>
            <p className="font-medium text-gray-900 dark:text-white">{event.location || 'Online Event'}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Price</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {event.isFree ? 'Free' : `$${event.price}`}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CalendarExport;
