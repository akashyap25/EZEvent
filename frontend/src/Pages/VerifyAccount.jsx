import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { SERVER_URL } from '../Utils/Constants';
import Card from '../Components/UI/Card';
import { CheckCircle, Shield, Mail, Phone } from 'lucide-react';

const VerifyAccount = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const phone = searchParams.get('phone') || '';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [method, setMethod] = useState('email');
  const otpRefs = useRef([]);

  // Start countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Auto-send OTP on mount
  useEffect(() => {
    if (email) {
      sendOTP();
    }
  }, []);

  const sendOTP = async (resend = false) => {
    try {
      await axios.post(`${SERVER_URL}/api/users/send-verification-otp`, { 
        email, 
        phone,
        method 
      });
      if (resend) setResendTimer(60);
    } catch (err) {
      if (resend) setError('Failed to resend. Please try again.');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await axios.post(`${SERVER_URL}/api/users/verify-account-otp`, { 
        email, 
        otp: otpCode 
      });
      setVerified(true);
      setTimeout(() => navigate('/sign-in'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // OTP input handling
  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    paste.split('').forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    if (paste.length === 6) otpRefs.current[5]?.focus();
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <Card className="max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Account Verified!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your account is now active. Redirecting to sign in...
          </p>
          <Link to="/sign-in" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium">
            Go to Sign In
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Card className="max-w-md w-full p-8">
        <div className="text-center mb-6">
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verify Your Account</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            We sent a 6-digit verification code to complete your registration.
          </p>
        </div>

        {/* Method toggle */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => { setMethod('email'); sendOTP(true); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              method === 'email'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Mail className="w-4 h-4" /> Email
          </button>
          {phone && (
            <button
              type="button"
              onClick={() => { setMethod('sms'); sendOTP(true); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                method === 'sms'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Phone className="w-4 h-4" /> SMS
            </button>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          Code sent to: <span className="font-medium text-gray-900 dark:text-white">{method === 'email' ? email : phone}</span>
        </p>

        <form onSubmit={handleVerify} className="space-y-6">
          {/* OTP Input */}
          <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (otpRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-colors"
              />
            ))}
          </div>

          {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || otp.join('').length !== 6}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Verifying...' : 'Verify Account'}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Didn't receive the code?{' '}
              {resendTimer > 0 ? (
                <span className="text-gray-500">Resend in {resendTimer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => sendOTP(true)}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Resend Code
                </button>
              )}
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default VerifyAccount;
