import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub, FaFacebook, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { SERVER_URL } from '../Utils/Constants';

const SocialLogin = ({ mode = 'login' }) => {
  const [loading, setLoading] = useState(null);

  const handleOAuth = (provider) => {
    setLoading(provider);
    window.location.href = `${SERVER_URL}/api/auth/${provider}`;
  };

  const socialProviders = [
    {
      id: 'google',
      name: 'Google',
      icon: <FcGoogle className="w-5 h-5" />,
      bgColor: 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:bg-gray-900',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300'
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: <FaGithub className="w-5 h-5" />,
      bgColor: 'bg-gray-900 hover:bg-gray-800',
      textColor: 'text-white',
      borderColor: 'border-gray-900'
    }
  ];

  return (
    <div className="w-full">
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">
            Or {mode === 'login' ? 'sign in' : 'sign up'} with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {socialProviders.map((provider) => (
          <button
            key={provider.id}
            onClick={() => handleOAuth(provider.id)}
            disabled={loading !== null}
            className={`
              flex items-center justify-center gap-2 px-4 py-2.5 
              rounded-lg border ${provider.borderColor} ${provider.bgColor} 
              ${provider.textColor} font-medium text-sm
              transition-all duration-200 
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
            `}
          >
            {loading === provider.id ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              provider.icon
            )}
            <span>{provider.name}</span>
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs text-center text-gray-500">
        By continuing, you agree to our{' '}
        <a href="/terms" className="text-primary-600 hover:underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="text-primary-600 hover:underline">
          Privacy Policy
        </a>
      </p>
    </div>
  );
};

export default SocialLogin;
