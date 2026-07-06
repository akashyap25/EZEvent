import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Input from '../UI/Input';
import { User, Mail, Lock, UserPlus, Phone } from 'lucide-react';
import SocialLogin from '../SocialLogin';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const { register } = useAuth();
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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions');
      setLoading(false);
      return;
    }

    const { confirmPassword, ...registrationData } = formData;
    const result = await register(registrationData);

    if (result.success) {
      // Redirect to OTP verification page
      navigate(`/verify-account?email=${encodeURIComponent(formData.email)}&phone=${encodeURIComponent(formData.phone)}`);
    } else {
      setError(result.error || 'Registration failed');
    }
    
    setLoading(false);
  };

  return (
    <div className='min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-purple-50/20 to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <h2 className='text-3xl font-bold text-gray-900 dark:text-white'>Create your account</h2>
          <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
            Join thousands of event organizers and attendees
          </p>
        </div>

        <Card className='p-8'>
          {error && (
            <div className='mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md'>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='grid grid-cols-2 gap-4'>
              <Input
                label='First Name'
                name='firstName'
                type='text'
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder='First name'
                leftIcon={<User className='h-4 w-4 text-gray-400' />}
              />

              <Input
                label='Last Name'
                name='lastName'
                type='text'
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder='Last name'
                leftIcon={<User className='h-4 w-4 text-gray-400' />}
              />
            </div>

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
              label='Username'
              name='username'
              type='text'
              value={formData.username}
              onChange={handleChange}
              required
              placeholder='Choose a username'
              leftIcon={<User className='h-4 w-4 text-gray-400' />}
              helperText='3-30 characters, letters, numbers, and underscores only'
            />

            <Input
              label='Phone Number'
              name='phone'
              type='tel'
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder='+91 9876543210'
              leftIcon={<Phone className='h-4 w-4 text-gray-400' />}
              helperText='Required for OTP verification'
            />

            <Input
              label='Password'
              name='password'
              type='password'
              value={formData.password}
              onChange={handleChange}
              required
              placeholder='Create a password'
              leftIcon={<Lock className='h-4 w-4 text-gray-400' />}
              showPasswordToggle
              helperText='Minimum 6 characters'
            />

            <Input
              label='Confirm Password'
              name='confirmPassword'
              type='password'
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder='Confirm your password'
              leftIcon={<Lock className='h-4 w-4 text-gray-400' />}
              showPasswordToggle
            />

            <div className='flex items-start'>
              <input
                type='checkbox'
                id='terms'
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded mt-1 bg-white dark:bg-gray-700'
              />
              <label htmlFor='terms' className='ml-2 block text-sm text-gray-700 dark:text-gray-300'>
                I agree to the{' '}
                <Link to='/support' className='text-blue-600 dark:text-blue-400 hover:underline'>
                  terms and conditions
                </Link>{' '}
                and{' '}
                <Link to='/support' className='text-blue-600 dark:text-blue-400 hover:underline'>
                  privacy policy
                </Link>
              </label>
            </div>

            <Button
              type='submit'
              loading={loading}
              disabled={!agreedToTerms}
              fullWidth
              size='lg'
              icon={UserPlus}
              iconPosition='right'
            >
              Create Account
            </Button>
          </form>

          <SocialLogin mode="register" />

          <p className='mt-6 text-center text-sm text-gray-600 dark:text-gray-400'>
            Already have an account?{' '}
            <Link to='/sign-in' className='font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500'>
              Sign in here
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default RegisterForm;
