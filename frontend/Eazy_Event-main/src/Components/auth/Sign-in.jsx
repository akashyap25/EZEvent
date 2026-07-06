import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Input from '../UI/Input';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import SocialLogin from '../SocialLogin';

const Signin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData);

    if (result.success) {
      // Get the intended destination from URL params or default to home
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirect') || '/';
      navigate(redirectTo);
    } else {
      setError(result.error || 'Login failed');
    }
    
    setLoading(false);
  };

  return (
    <div className='min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <h2 className='text-3xl font-bold text-gray-900 dark:text-white'>Welcome back</h2>
          <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
            Sign in to your account to continue
          </p>
        </div>

        <Card className='p-8'>
          {error && (
            <div className='mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-6'>
            <Input
              label='Email Address'
              name='email'
              type='email'
              value={formData.email}
              onChange={handleChange}
              required
              placeholder='Enter your email'
              leftIcon={<Mail className='h-4 w-4 text-gray-400' />}
            />

            <Input
              label='Password'
              name='password'
              type='password'
              value={formData.password}
              onChange={handleChange}
              required
              placeholder='Enter your password'
              leftIcon={<Lock className='h-4 w-4 text-gray-400' />}
              showPasswordToggle
            />

            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <input
                  id='remember-me'
                  name='remember-me'
                  type='checkbox'
                  className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700'
                />
                <label htmlFor='remember-me' className='ml-2 block text-sm text-gray-900 dark:text-gray-300'>
                  Remember me
                </label>
              </div>

              <div className='text-sm'>
                <Link to='/forgot-password' className='font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500'>
                  Forgot your password?
                </Link>
              </div>
            </div>

            <Button
              type='submit'
              loading={loading}
              fullWidth
              size='lg'
              icon={ArrowRight}
              iconPosition='right'
            >
              Sign in
            </Button>
          </form>

          <SocialLogin mode="login" />

          <p className='mt-6 text-center text-sm text-gray-600 dark:text-gray-400'>
            Don't have an account?{' '}
            <Link to='/register' className='font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500'>
              Sign up for free
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Signin; 