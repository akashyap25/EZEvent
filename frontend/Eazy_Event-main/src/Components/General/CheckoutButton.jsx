import {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import getUser from '../../Utils/GetUser';
import CheckoutModal from './CheckoutModal';
import TicketModal from './TicketModal';
import apiService from '../../Utils/apiService';
import { generateTicketPDF } from '../../Utils/generatePDF';
import Button from '../UI/Button';
import { Ticket, Download, Eye } from 'lucide-react';

const CheckoutButton = ({ event, isEventCreator = false }) => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const hasEventFinished = new Date(event.endDateTime) < new Date();

  // Event creator cannot register for their own event
  const organizerId = event?.organizer?._id?.toString?.() || event?.organizer?.toString?.();
  const isOrganizer = isEventCreator || (currentUser?._id && organizerId && currentUser._id.toString() === organizerId);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!currentUser?._id) return;
        const fetchedUser = await getUser(currentUser._id);
        setUser(fetchedUser);
        
        // Check if user is already registered for this event
        checkRegistrationStatus();
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, [currentUser?._id, event._id]);

  const checkRegistrationStatus = async () => {
    try {
      if (!currentUser?._id) return;
      setLoading(true);
      const response = await apiService.get(`/api/orders/user/${currentUser._id}`);
      // Backend returns { data: orders } without success wrapper
      const userOrders = Array.isArray(response?.data) ? response.data : 
                        Array.isArray(response) ? response : [];
      const eventOrder = userOrders.find(order =>
        order.event === event._id ||
        (order.event && order.event._id === event._id)
      );
      if (eventOrder) {
        setIsRegistered(true);
        setTicketData(eventOrder);
      } else {
        setIsRegistered(false);
        setTicketData(null);
      }
    } catch (error) {
      console.error('Error checking registration:', error);
      setIsRegistered(false);
      setTicketData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    const currentPath = window.location.pathname;
    navigate(`/sign-in?redirect=${encodeURIComponent(currentPath)}`); 
  };

  const handleCheckoutSuccess = (ticket) => {
    setTicketData(ticket);
    setIsRegistered(true);
    setShowCheckout(false);
    // Force a re-render by updating state
    setUser({...user, hasRegistered: true});
    
    // Force refresh the registration status
    setTimeout(() => {
      checkRegistrationStatus();
    }, 1000);
  };

  const handleViewTicketFromModal = (ticket) => {
    setTicketData(ticket);
    setShowTicket(true);
  };

  const handleDownloadTicket = async () => {
    if (!ticketData || downloading) return;
    
    setDownloading(true);
    try {
      await generateTicketPDF(ticketData, event);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleViewTicket = () => {
    if (!ticketData) return;
    setShowTicket(true);
  };

  if (hasEventFinished) {
    return (
      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400 font-medium">This event has ended.</p>
      </div>
    );
  }

  if (isOrganizer) {
    return (
      <div className="p-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
        <p className="text-gray-700 dark:text-gray-300 font-medium">You are the organizer</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Registration is for attendees only.</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button 
        variant="primary" 
        onClick={handleSignIn}
        size="lg"
        fullWidth
      >
        Get Tickets
      </Button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
        <span className="text-gray-600 dark:text-gray-400">Checking registration...</span>
      </div>
    );
  }

  if (isRegistered) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={handleViewTicket}
          size="md"
          icon={Eye}
        >
          View Ticket
        </Button>
        <Button
          variant="success"
          onClick={handleDownloadTicket}
          size="md"
          disabled={downloading}
          icon={Download}
        >
          {downloading ? 'Generating...' : 'Download'}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button 
        variant="primary" 
        onClick={() => setShowCheckout(true)}
        size="lg"
        fullWidth
        icon={Ticket}
      >
        Get Tickets
      </Button>
      
      <CheckoutModal
        event={event}
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSuccess={handleCheckoutSuccess}
        onViewTicket={handleViewTicketFromModal}
      />
      
      <TicketModal
        ticket={ticketData}
        event={event}
        isOpen={showTicket}
        onClose={() => {
          console.log('Closing ticket modal');
          setShowTicket(false);
        }}
      />
    </>
  );
};

export default CheckoutButton;
