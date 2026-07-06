import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../Utils/apiService';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { Send, Mail, Users, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Attendee Messaging — Organizer can send custom email to all attendees
 * Uses POST /api/email/event/:eventId/custom
 */
const AttendeeMessaging = ({ eventId }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setResult({ type: 'error', text: 'Subject and message are required' });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await apiService.post(`/api/email/event/${eventId}/custom`, {
        subject: subject.trim(),
        message: message.trim()
      });

      setResult({
        type: 'success',
        text: response?.message || `Email sent to ${response?.data?.sent || 0} attendees`
      });
      setSubject('');
      setMessage('');
    } catch (error) {
      setResult({ type: 'error', text: error.message || 'Failed to send email' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
        <Mail className="w-5 h-5 text-blue-600" />
        Message Attendees
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Send a custom email to all registered attendees (parking info, schedule changes, etc.)
      </p>

      <div className="space-y-3">
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject..."
          className="w-full"
          maxLength={200}
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Your message to attendees..."
          rows={4}
          className="w-full"
          maxLength={2000}
        />

        {result && (
          <div className={`flex items-center gap-2 text-sm ${result.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {result.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {result.text}
          </div>
        )}

        <Button
          onClick={handleSend}
          loading={sending}
          icon={Send}
          disabled={!subject.trim() || !message.trim()}
        >
          Send to All Attendees
        </Button>
      </div>
    </Card>
  );
};

export default AttendeeMessaging;
