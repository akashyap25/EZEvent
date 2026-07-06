import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  MessageSquare, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SERVER_URL } from '../Utils/Constants';
import Card from '../Components/UI/Card';
import Button from '../Components/UI/Button';
import Input from '../Components/UI/Input';
import LoadingSpinner from '../Components/UI/LoadingSpinner';

const Support = () => {
  const { user, accessToken, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('faqs');
  const [faqs, setFaqs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium'
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFaqs();
    if (isAuthenticated) {
      fetchTickets();
    }
  }, [isAuthenticated]);

  const fetchFaqs = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/support/faqs`);
      const data = await response.json();
      if (data.success) {
        // FAQs come as { faqs: { events: [...], payments: [...], ... } }
        const faqData = data.data?.faqs || data.data;
        if (faqData && typeof faqData === 'object' && !Array.isArray(faqData)) {
          // Flatten all categories into a single array
          const allFaqs = Object.values(faqData).flat();
          setFaqs(allFaqs);
        } else {
          setFaqs(Array.isArray(faqData) ? faqData : []);
        }
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/support/tickets`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTickets(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handleVoteFaq = async (faqId, isHelpful) => {
    try {
      await fetch(`${SERVER_URL}/api/support/faqs/${faqId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ helpful: isHelpful })
      });
      fetchFaqs();
    } catch (error) {
      console.error('Error voting on FAQ:', error);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${SERVER_URL}/api/support/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(newTicket)
      });
      const data = await response.json();
      if (data.success) {
        setTickets([data.data?.ticket || data.data, ...tickets]);
        setNewTicket({ subject: '', description: '', category: 'general', priority: 'medium' });
        setShowNewTicketForm(false);
      } else {
        setError(data.message || 'Failed to create ticket. Please try again.');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMessage = async (ticketId) => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`${SERVER_URL}/api/support/tickets/${ticketId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ message: newMessage })
      });
      const data = await response.json();
      if (data.success) {
        setSelectedTicket(data.data);
        setNewMessage('');
        fetchTickets();
      }
    } catch (error) {
      console.error('Error adding message:', error);
    }
  };

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return <HelpCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Help & Support</h1>
          <p className="text-gray-600 dark:text-gray-400">Find answers or get in touch with our support team</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('faqs')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'faqs'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <HelpCircle className="w-4 h-4 inline mr-2" />
              FAQs
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'tickets'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              My Tickets
            </button>
          </div>
        </div>

        {/* FAQs Tab */}
        {activeTab === 'faqs' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* FAQ List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredFaqs.length === 0 ? (
              <Card className="text-center py-12">
                <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No FAQs found</h3>
                <p className="text-gray-600 dark:text-gray-400">Try a different search term or create a support ticket</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredFaqs.map((faq) => (
                  <Card key={faq._id} className="overflow-hidden">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === faq._id ? null : faq._id)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="font-medium text-gray-900 dark:text-white pr-4">{faq.question}</span>
                      {expandedFaq === faq._id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    
                    {expandedFaq === faq._id && (
                      <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
                        <p className="pt-4 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{faq.answer}</p>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Was this helpful?</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleVoteFaq(faq._id, true)}
                              className="flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-green-100 dark:hover:bg-green-900 text-gray-600 dark:text-gray-300 hover:text-green-600 transition-colors"
                            >
                              <ThumbsUp className="w-4 h-4" />
                              {faq.helpfulVotes || 0}
                            </button>
                            <button
                              onClick={() => handleVoteFaq(faq._id, false)}
                              className="flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900 text-gray-600 dark:text-gray-300 hover:text-red-600 transition-colors"
                            >
                              <ThumbsDown className="w-4 h-4" />
                              {faq.notHelpfulVotes || 0}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {/* Contact Support CTA */}
            <Card className="text-center p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Still need help?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Create a support ticket and our team will get back to you</p>
              <Button onClick={() => { setActiveTab('tickets'); setShowNewTicketForm(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Create Support Ticket
              </Button>
            </Card>
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            {!isAuthenticated ? (
              <Card className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Sign in required</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Please sign in to view or create support tickets</p>
                <Button onClick={() => window.location.href = '/sign-in'}>
                  Sign In
                </Button>
              </Card>
            ) : (
              <>
                {/* New Ticket Button */}
                <div className="flex justify-end">
                  <Button onClick={() => setShowNewTicketForm(!showNewTicketForm)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Ticket
                  </Button>
                </div>

                {/* New Ticket Form */}
                {showNewTicketForm && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Support Ticket</h3>
                    {error && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                      </div>
                    )}
                    <form onSubmit={handleCreateTicket} className="space-y-4">
                      <Input
                        label="Subject"
                        value={newTicket.subject}
                        onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                        required
                        placeholder="Brief description of your issue"
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                          <select
                            value={newTicket.category}
                            onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="general">General</option>
                            <option value="billing">Billing</option>
                            <option value="technical">Technical</option>
                            <option value="account">Account</option>
                            <option value="event">Event Related</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                          <select
                            value={newTicket.priority}
                            onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                          value={newTicket.description}
                          onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                          required
                          rows={4}
                          placeholder="Please describe your issue in detail..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <Button type="submit" loading={submitting}>
                          Submit Ticket
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowNewTicketForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Card>
                )}

                {/* Tickets List */}
                {tickets.length === 0 ? (
                  <Card className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tickets yet</h3>
                    <p className="text-gray-600 dark:text-gray-400">Create a support ticket to get help from our team</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <Card
                        key={ticket._id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedTicket(selectedTicket?._id === ticket._id ? null : ticket)}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getStatusIcon(ticket.status)}
                                <span className="font-medium text-gray-900 dark:text-white">{ticket.subject}</span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{ticket.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                                  {ticket.status?.replace('_', ' ')}
                                </span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                                  {ticket.priority}
                                </span>
                                <span className="text-xs text-gray-500">
                                  #{ticket.ticketNumber}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Expanded Ticket View */}
                          {selectedTicket?._id === ticket._id && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              {/* Messages */}
                              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                                {ticket.messages?.map((msg, idx) => (
                                  <div
                                    key={idx}
                                    className={`p-3 rounded-lg ${
                                      msg.sender === 'user'
                                        ? 'bg-blue-50 dark:bg-blue-900/20 ml-8'
                                        : 'bg-gray-50 dark:bg-gray-700 mr-8'
                                    }`}
                                  >
                                    <p className="text-sm text-gray-900 dark:text-white">{msg.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {new Date(msg.timestamp).toLocaleString()}
                                    </p>
                                  </div>
                                ))}
                              </div>

                              {/* Reply Form */}
                              {ticket.status !== 'closed' && (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddMessage(ticket._id);
                                    }}
                                  >
                                    <Send className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Support;
