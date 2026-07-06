import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../Utils/apiService';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { Camera, CheckCircle, XCircle, QrCode, Loader } from 'lucide-react';

/**
 * QR Scanner for event check-in
 * Uses device camera to scan QR codes and validates against backend
 * Falls back to manual email check-in if camera is unavailable
 */
const QRScanner = ({ eventId, onCheckIn }) => {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null); // { success, message }
  const [manualEmail, setManualEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Check camera availability
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraAvailable(false);
    }
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setScanning(true);
      setResult(null);
    } catch (err) {
      setCameraAvailable(false);
      setResult({ success: false, message: 'Camera access denied. Use manual check-in.' });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const handleQRScan = async (qrData) => {
    if (loading) return;
    setLoading(true);
    stopCamera();
    
    try {
      const response = await apiService.post('/api/check-in/scan', {
        qrToken: qrData,
        eventId
      });
      
      setResult({ 
        success: true, 
        message: response?.message || 'Check-in successful!',
        attendee: response?.data?.attendee
      });
      onCheckIn?.();
    } catch (err) {
      setResult({ 
        success: false, 
        message: err.message || 'Invalid QR code or already checked in' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckIn = async (e) => {
    e.preventDefault();
    if (!manualEmail.trim()) return;
    setLoading(true);
    setResult(null);
    
    try {
      const response = await apiService.post('/api/check-in/manual', {
        email: manualEmail.trim(),
        eventId
      });
      
      setResult({ 
        success: true, 
        message: response?.message || `${manualEmail} checked in successfully!`
      });
      setManualEmail('');
      onCheckIn?.();
    } catch (err) {
      setResult({ 
        success: false, 
        message: err.message || 'Check-in failed. User may not be registered.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Simulated QR detection (in production, use a library like @zxing/browser)
  const simulateQRCapture = () => {
    const qrInput = prompt('Paste QR code data (for demo):');
    if (qrInput) {
      handleQRScan(qrInput);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <QrCode className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Event Check-In</h3>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
          )}
          <div>
            <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
              {result.success ? 'Success' : 'Failed'}
            </p>
            <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
              {result.message}
            </p>
          </div>
        </div>
      )}

      {/* Camera Scanner */}
      {cameraAvailable && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Scan QR Code</h4>
          
          {scanning ? (
            <div className="relative">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full rounded-lg bg-black aspect-video"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white/50 rounded-lg" />
              </div>
              <div className="flex gap-2 mt-3">
                <Button onClick={simulateQRCapture} size="sm" icon={QrCode}>
                  Capture QR
                </Button>
                <Button onClick={stopCamera} size="sm" variant="ghost" icon={XCircle}>
                  Stop
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={startCamera} icon={Camera} fullWidth variant="outline">
              Open Camera Scanner
            </Button>
          )}
        </div>
      )}

      {/* Manual Check-in */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Manual Check-In (by email)
        </h4>
        <form onSubmit={handleManualCheckIn} className="flex gap-2">
          <input
            type="email"
            value={manualEmail}
            onChange={e => setManualEmail(e.target.value)}
            placeholder="attendee@email.com"
            className="flex-1 px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
          <Button type="submit" loading={loading} size="sm" icon={CheckCircle}>
            Check In
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default QRScanner;
