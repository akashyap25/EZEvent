const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

// Log warnings for missing environment variables
if (!import.meta.env.VITE_SERVER_URL) {
  console.warn('⚠️ VITE_SERVER_URL not set, using default: http://localhost:5000');
}

if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
  console.warn('⚠️ VITE_STRIPE_PUBLISHABLE_KEY not set, Stripe features will not work');
}

export { SERVER_URL, STRIPE_KEY };
