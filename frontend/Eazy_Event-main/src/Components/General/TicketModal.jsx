import React, { useState } from 'react';
import { X, Calendar, MapPin, Clock, User, CreditCard, Download, QrCode } from 'lucide-react';
import { SERVER_URL } from '../../Utils/Constants';
import Button from '../UI/Button';
import Card from '../UI/Card';

const TicketModal = ({ ticket, event, isOpen, onClose }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  if (!isOpen || !ticket) {
    return null;
  }

  const generateQRCode = () => {
    // Use backend QR endpoint if available, fallback to external service
    if (qrCodeUrl) return qrCodeUrl;
    const qrData = `Event: ${event.title}\nOrder: ${ticket.orderId}\nDate: ${new Date(event.startDateTime).toLocaleDateString()}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  };

  const handleDownloadPDF = () => {
    // Generate PDF content
    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Event Ticket - ${event.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .ticket { background: white; border-radius: 12px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
        .event-title { font-size: 28px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
        .event-subtitle { color: #6b7280; font-size: 16px; }
        .ticket-body { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
        .ticket-info h3 { color: #374151; margin-bottom: 15px; font-size: 18px; }
        .info-item { display: flex; align-items: center; margin-bottom: 12px; }
        .info-item svg { width: 20px; height: 20px; margin-right: 10px; color: #6b7280; }
        .info-text { color: #4b5563; }
        .qr-section { text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px; }
        .qr-code { width: 150px; height: 150px; margin: 0 auto; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        .order-details { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .order-details h4 { margin-bottom: 15px; color: #374151; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .detail-label { font-weight: 600; color: #6b7280; }
        .detail-value { color: #1f2937; }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="header">
            <div class="event-title">${event.title}</div>
            <div class="event-subtitle">Event Ticket</div>
        </div>
        
        <div class="order-details">
            <h4>Order Information</h4>
            <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">${ticket.orderId}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Quantity:</span>
                <span class="detail-value">${ticket.quantity || 1}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Total Amount:</span>
                <span class="detail-value">₹${ticket.totalAmount || event.price}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Payment ID:</span>
                <span class="detail-value">${ticket.paymentId || 'N/A'}</span>
            </div>
        </div>

        <div class="ticket-body">
            <div class="ticket-info">
                <h3>Event Details</h3>
                <div class="info-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <span class="info-text">${new Date(event.startDateTime).toLocaleDateString()}</span>
                </div>
                <div class="info-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="info-text">${new Date(event.startDateTime).toLocaleTimeString()}</span>
                </div>
                <div class="info-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <span class="info-text">${event.location}</span>
                </div>
            </div>
            
            <div class="qr-section">
                <h3>QR Code</h3>
                <img src="${generateQRCode()}" alt="QR Code" class="qr-code" />
                <p style="margin-top: 10px; color: #6b7280; font-size: 14px;">Scan for verification</p>
            </div>
        </div>
        
        <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>Present this ticket at the event entrance</p>
        </div>
    </div>
</body>
</html>
    `;
    
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${event.title.replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      style={{ zIndex: 9999 }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event Ticket</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Ticket Content */}
          <Card className="p-6 mb-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">Event Ticket</p>
            </div>

            {/* Order Details */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Order Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Order ID:</span>
                  <p className="font-mono text-gray-900 dark:text-white">{ticket.orderId}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                  <p className="font-semibold text-gray-900 dark:text-white">{ticket.quantity || 1}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                  <p className="font-semibold text-green-600">₹{ticket.totalAmount || event.price}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Payment ID:</span>
                  <p className="font-mono text-gray-900 text-xs">{ticket.paymentId || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Event Details</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-700 dark:text-gray-300">{new Date(event.startDateTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-700 dark:text-gray-300">{new Date(event.startDateTime).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-700 dark:text-gray-300">{event.location}</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-3">QR Code</h4>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-200 inline-block">
                  <img 
                    src={generateQRCode()} 
                    alt="QR Code" 
                    className="w-32 h-32 mx-auto"
                  />
                  <p className="text-xs text-gray-500 mt-2">Scan for verification</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              onClick={handleDownloadPDF}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketModal;
