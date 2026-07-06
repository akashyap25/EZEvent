import React, { useState } from 'react';
import { X, CreditCard, Download, Eye, Calendar, MapPin, User, CheckCircle } from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';
import LoadingSpinner from '../UI/LoadingSpinner';
import apiService from '../../Utils/apiService';
import { generateTicketPDF } from '../../Utils/generatePDF';

const CheckoutModal = ({ event, isOpen, onClose, onSuccess, onViewTicket }) => {
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [step, setStep] = useState('checkout'); // 'checkout', 'payment', 'success'
  const [ticketData, setTicketData] = useState(null);
  const [formData, setFormData] = useState({
    quantity: 1,
    paymentMethod: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
    email: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get current user ID from localStorage or use a dummy ID
      const token = localStorage.getItem('accessToken');
      let currentUserId = null;
      
      if (token) {
        try {
          // Decode JWT to get user ID
          const payload = JSON.parse(atob(token.split('.')[1]));
          currentUserId = payload.userId || payload.id;
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      }
      
      // If no user ID found, use a dummy ID for testing
      if (!currentUserId) {
        currentUserId = '507f1f77bcf86cd799439011'; // Dummy ObjectId
      }
      
      // Create dummy order
      const orderData = {
        event: event._id,
        buyer: currentUserId,
        quantity: formData.quantity,
        totalAmount: (parseFloat(event.price) * formData.quantity).toString(),
        paymentMethod: formData.paymentMethod,
        paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const response = await apiService.post('/api/orders', orderData);
      
      const ticketData = {
        orderId: response?.order?._id || response?.data?._id || response?._id,
        _id: response?.order?._id || response?.data?._id || response?._id,
        event: event,
        quantity: formData.quantity,
        totalAmount: orderData.totalAmount,
        paymentId: orderData.paymentId,
        purchaseDate: new Date().toISOString()
      };
      
      setTicketData(ticketData);
      
      setStep('success');
    } catch (error) {
      console.error('Checkout error:', error);
      let errorMessage = 'Payment failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show error in a more user-friendly way
      alert(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
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
    // This will be handled by the parent component (CheckoutButton)
    // The TicketModal will be opened from there
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {step === 'checkout' && 'Complete Purchase'}
              {step === 'payment' && 'Payment Details'}
              {step === 'success' && 'Purchase Successful!'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Event Details */}
          <Card className="p-4 mb-6">
            <div className="flex items-start space-x-3">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{event.title}</h3>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(event.startDateTime).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <MapPin className="w-4 h-4 mr-1" />
                  {event.location}
                </div>
                <div className="text-lg font-semibold text-green-600 mt-2">
                  {event.isFree ? 'FREE' : `₹${event.price}`}
                </div>
              </div>
            </div>
          </Card>

          {/* Checkout Step */}
          {step === 'checkout' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Tickets
                </label>
                <select
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num} ticket{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Price per ticket:</span>
                  <span>{event.isFree ? 'FREE' : `₹${event.price}`}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Quantity:</span>
                  <span>{formData.quantity}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg mt-2 pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span>{event.isFree ? 'FREE' : `₹${(parseFloat(event.price) * formData.quantity).toFixed(2)}`}</span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={loading}
                className={`w-full transition-all duration-200 ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 hover:shadow-lg transform hover:scale-105'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing Payment...
                  </div>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Complete Purchase
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Payment Successful!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  You have successfully registered for <strong>{event.title}</strong>
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-left">
                <h4 className="font-semibold mb-2">Order Details:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Order ID:</span>
                    <span className="font-mono">{ticketData.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <span>{ticketData.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>₹{ticketData.totalAmount}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    onViewTicket?.(ticketData);
                    onClose();
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Ticket
                </Button>
                <Button
                  onClick={handleDownloadTicket}
                  disabled={downloading}
                  className={`flex-1 ${downloading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {downloading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
              </div>

              <Button
                onClick={() => {
                  onSuccess?.(ticketData);
                  onClose();
                }}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
