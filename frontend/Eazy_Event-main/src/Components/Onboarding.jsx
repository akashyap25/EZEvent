import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Calendar, Search, Users, Ticket, Star, ArrowRight, Sparkles, Zap } from 'lucide-react';

const Onboarding = () => {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only show if user has NEVER seen it (persists across all sessions via localStorage)
    const seen = localStorage.getItem('onboarding_completed');
    if (!seen) {
      // Small delay for page to settle
      setTimeout(() => setShow(true), 800);
    }
  }, []);

  const dismiss = useCallback(() => {
    setShow(false);
    // Permanently mark as completed — never shows again for this browser
    localStorage.setItem('onboarding_completed', 'true');
    // Only navigate to home if not already there
    if (location.pathname !== '/') {
      navigate('/');
    }
  }, [navigate, location.pathname]);

  const nextStep = () => {
    setAnimating(true);
    setTimeout(() => {
      setStep(s => s + 1);
      setAnimating(false);
    }, 200);
  };

  const steps = [
    {
      title: 'Welcome to EZEvent',
      description: 'Create, discover, and manage events effortlessly.',
      icon: Sparkles,
      position: 'center', // center of screen
      color: '#007AFF'
    },
    {
      title: 'Create in seconds',
      description: 'Our AI-powered wizard helps you set up events with a few clicks.',
      icon: Zap,
      position: 'top-right', // near the Create button
      color: '#34C759'
    },
    {
      title: 'Find what you love',
      description: 'Press ⌘K anytime to search. Filter by category, date, or price.',
      icon: Search,
      position: 'top-center', // near the search bar
      color: '#FF9500'
    },
    {
      title: 'Secure tickets',
      description: 'Register for free events or pay securely with Stripe.',
      icon: Ticket,
      position: 'center-right',
      color: '#AF52DE'
    },
    {
      title: 'You\'re all set!',
      description: 'Start exploring events or create your own. Welcome aboard.',
      icon: Star,
      position: 'center',
      color: '#FF2D55'
    }
  ];

  if (!show) return null;

  const currentStep = steps[step];
  const Icon = currentStep.icon;
  const isLast = step === steps.length - 1;

  // Apple-style positioning based on what we're pointing to
  const positionClasses = {
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'top-right': 'top-20 right-8',
    'top-center': 'top-20 left-1/2 -translate-x-1/2',
    'center-right': 'top-1/3 right-8',
    'bottom-center': 'bottom-32 left-1/2 -translate-x-1/2',
  };

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Backdrop — subtle, not harsh */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={dismiss} />

      {/* Floating tooltip card — Apple style */}
      <div 
        className={`absolute ${positionClasses[currentStep.position]} transition-all duration-500 ease-out ${animating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      >
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 w-72 overflow-hidden">
          {/* Colored top accent */}
          <div className="h-1 w-full" style={{ background: currentStep.color }} />
          
          <div className="p-5">
            {/* Icon + Title row */}
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: `${currentStep.color}15` }}
              >
                <Icon className="w-5 h-5" style={{ color: currentStep.color }} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {currentStep.title}
              </h3>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed ml-12 mb-4">
              {currentStep.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between ml-12">
              {/* Dots */}
              <div className="flex gap-1">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: i === step ? '16px' : '6px',
                      backgroundColor: i === step ? currentStep.color : '#D1D5DB'
                    }}
                  />
                ))}
              </div>

              {/* Action */}
              {isLast ? (
                <button
                  onClick={dismiss}
                  className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{ color: currentStep.color, background: `${currentStep.color}10` }}
                >
                  Let's go →
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{ color: currentStep.color, background: `${currentStep.color}10` }}
                >
                  Next →
                </button>
              )}
            </div>
          </div>

          {/* Skip link */}
          <div className="px-5 pb-3">
            <button
              onClick={dismiss}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Skip tour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
