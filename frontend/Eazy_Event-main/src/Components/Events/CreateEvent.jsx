import React, { useEffect, useState } from 'react';
import apiService from '../../Utils/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import GetUser from '../../Utils/GetUser';
import * as Yup from 'yup';
import { SERVER_URL } from '../../Utils/Constants';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Input from '../UI/Input';
import LoadingSpinner from '../UI/LoadingSpinner';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Users, 
  Tag, 
  Image as ImageIcon,
  Link as LinkIcon,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  X as CloseIcon,
  Plus,
  AlertCircle,
  Info,
  Clock,
  Globe,
  User,
  Settings,
  Eye,
  Save,
  Repeat,
  BarChart3,
  Download,
  UserPlus
} from 'lucide-react';
import RecurringEventForm from './RecurringEventForm';
import DescriptionGenerator from '../AI/DescriptionGenerator';

// Step definitions for the wizard
const STEPS = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Event title, category, and description',
    icon: Info,
    fields: ['title', 'category', 'description']
  },
  {
    id: 2,
    title: 'Event Details',
    description: 'Date, time, location, and capacity',
    icon: Calendar,
    fields: ['startDateTime', 'endDateTime', 'location', 'capacity']
  },
  {
    id: 3,
    title: 'Pricing & Media',
    description: 'Pricing, image, and external links',
    icon: DollarSign,
    fields: ['price', 'isFree', 'imageUrl', 'url']
  },
  {
    id: 4,
    title: 'Advanced Settings',
    description: 'Recurring patterns, collaboration, and tags',
    icon: Settings,
    fields: ['tags']
  },
  {
    id: 5,
    title: 'Review & Publish',
    description: 'Review all details and publish your event',
    icon: Eye,
    fields: []
  }
];

// Validation schemas for each step
const stepValidationSchemas = [
  Yup.object().shape({
    title: Yup.string().min(3, 'Title must be at least 3 characters').required('Title is required'),
    category: Yup.string().required('Category is required'),
    description: Yup.string().min(20, 'Description must be at least 20 characters').required('Description is required'),
  }),
  Yup.object().shape({
    startDateTime: Yup.date().min(new Date(), 'Start date must be in the future').required('Start date is required'),
    endDateTime: Yup.date().min(Yup.ref('startDateTime'), 'End date must be after start date').required('End date is required'),
    location: Yup.string().min(3, 'Location must be at least 3 characters').required('Location is required'),
    capacity: Yup.number().min(1, 'Capacity must be at least 1').required('Capacity is required'),
  }),
  Yup.object().shape({
    price: Yup.number().min(0, 'Price cannot be negative').when('isFree', {
      is: false,
      then: (schema) => schema.required('Price is required for paid events'),
      otherwise: (schema) => schema.notRequired()
    }),
    isFree: Yup.boolean(),
    imageUrl: Yup.string().required('Event image is required').min(1, 'Please upload an event image'),
    url: Yup.string().url('Please enter a valid URL').nullable(),
  }),
  Yup.object().shape({
    tags: Yup.array().min(1, 'At least one tag is required').required('Tags are required'),
  }),
  Yup.object().shape({}) // No validation for review step
];

const CreateEvent = ({ editEventId } = {}) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const isEditMode = !!editEventId;
  
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    startDateTime: '',
    endDateTime: '',
    location: '',
    capacity: 50,
    price: 0,
    isFree: false,
    imageUrl: '',
    url: '',
    tags: [],
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  
  // New feature states
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [recurringData, setRecurringData] = useState({
    isRecurring: false,
    type: 'weekly',
    interval: 1,
    daysOfWeek: [],
    dayOfMonth: 1,
    endDate: '',
    occurrences: 10
  });
  const [coOrganizers, setCoOrganizers] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories - API returns { success, categories }
        const categoriesResponse = await apiService.get(`/api/categories`);
        setCategories(categoriesResponse?.categories || []);
        
        // Fetch user data
        if (currentUser?._id) {
          const fetchedUser = await GetUser(currentUser._id);
          if (fetchedUser && fetchedUser._id) {
            setUser(fetchedUser);
            setFormData(prev => ({ ...prev, organizer: fetchedUser._id }));
          }
        }

        // If edit mode, fetch existing event data
        if (isEditMode) {
          const eventRes = await apiService.get(`/api/events/${editEventId}`);
          const event = eventRes?.data || eventRes;
          if (event) {
            setFormData({
              title: event.title || '',
              category: (event.category?._id || event.category) || '',
              description: event.description || '',
              startDateTime: event.startDateTime ? new Date(event.startDateTime).toISOString().slice(0, 16) : '',
              endDateTime: event.endDateTime ? new Date(event.endDateTime).toISOString().slice(0, 16) : '',
              location: event.location || '',
              capacity: event.capacity || 50,
              price: event.price || 0,
              isFree: event.isFree || false,
              imageUrl: event.imageUrl || '',
              url: event.url || '',
              tags: Array.isArray(event.tags) ? event.tags : [],
              notes: event.notes || '',
              organizer: event.organizer?._id || event.organizer || ''
            });
            if (event.imageUrl) {
              setImagePreview(event.imageUrl);
              setCurrentImageUrl(event.imageUrl);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        Swal.fire('Error', 'Failed to load required data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser?._id]);

  // Cleanup effect for object URLs
  useEffect(() => {
    return () => {
      if (currentImageUrl && currentImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentImageUrl);
      }
    };
  }, [currentImageUrl]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle image upload
  const handleImageUpload = async (file) => {
    if (!file) return;
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire('Error', 'File size must be less than 5MB', 'error');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      Swal.fire('Error', 'Please select an image file', 'error');
      return;
    }
    
    setUploadingImage(true);
    
    // Check if Cloudinary is configured
    const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const cloudinaryUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
      // Fallback: Use local preview without upload
      console.warn('Cloudinary not configured, using local preview only');
      const localUrl = URL.createObjectURL(file);
      setImagePreview(localUrl);
      setFormData(prev => ({ ...prev, imageUrl: localUrl }));
      setUploadingImage(false);
      
      Swal.fire({
        title: 'Image Preview Only',
        text: 'Cloudinary not configured. Image will be previewed locally but not uploaded.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", cloudinaryUploadPreset);

    try {
      
      // Use native fetch API to avoid axios CORS issues
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
          // Don't set Content-Type header, let browser set it with boundary
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.secure_url) {
        // Clean up previous image if it exists and is from Cloudinary
        if (currentImageUrl && currentImageUrl.startsWith('https://res.cloudinary.com/')) {
          // Note: In a production app, you might want to delete the old image from Cloudinary
          // For now, we'll just track the new URL
        }
        
        setImagePreview(data.secure_url);
        setCurrentImageUrl(data.secure_url);
        setFormData(prev => ({ ...prev, imageUrl: data.secure_url }));
        Swal.fire('Success', 'Image uploaded successfully!', 'success');
      } else {
        throw new Error('No secure URL returned from Cloudinary');
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      
      // Fallback to local preview
      const localUrl = URL.createObjectURL(file);
      setImagePreview(localUrl);
      setCurrentImageUrl(localUrl);
      setFormData(prev => ({ ...prev, imageUrl: localUrl }));
      
      let errorMessage = 'Failed to upload to Cloudinary';
      if (error.message) {
        errorMessage = error.message;
      }
      
      Swal.fire({
        title: 'Upload Warning',
        text: `${errorMessage}. Using local preview instead.`,
        icon: 'warning',
        confirmButtonText: 'OK'
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Validate current step
  const validateCurrentStep = async () => {
    try {
      const currentSchema = stepValidationSchemas[currentStep - 1];
      if (currentSchema) {
        await currentSchema.validate(formData, { abortEarly: false });
        setErrors({});
        return true;
      }
      return true;
    } catch (error) {
      const newErrors = {};
      error.inner.forEach(err => {
        newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
      return false;
    }
  };

  // Navigate to next step
  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Navigate to previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async (isDraft = false) => {
    try {
      setLoading(true);
      
      // Prepare data for submission with proper formatting
      const submitData = {
        ...formData,
        price: formData.isFree ? '0' : formData.price.toString(),
        url: formData.url || '',
        tags: formData.tags.length > 0 ? formData.tags : ['general'],
        status: isDraft ? 'draft' : 'upcoming'
      };
      
      let response;
      if (isEditMode) {
        response = await apiService.put(`/api/events/${editEventId}`, submitData);
      } else {
        response = await apiService.post(`/api/events/create`, submitData);
      }
      
      // apiService returns the response body directly
      const eventId = response?.eventId || response?.event?._id || response?.data?._id || editEventId;
      if (response?.success !== false && eventId) {
        Swal.fire({
          title: 'Success!',
          text: isEditMode ? 'Event updated successfully!' : 'Event created successfully!',
          icon: 'success',
          confirmButtonText: 'View Event'
        }).then(() => {
          navigate(`/events/${eventId}`);
        });
      } else {
        Swal.fire('Error', response?.message || `Failed to ${isEditMode ? 'update' : 'create'} event`, 'error');
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} event:`, error);
      const message = error?.response?.data?.message || error?.message || `Failed to ${isEditMode ? 'update' : 'create'} event`;
      Swal.fire('Error', message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add tag
  const addTag = (tag) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  // Remove tag
  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isEditMode ? 'Update Your Event' : 'Create Your Event'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isEditMode ? 'Modify your event details below' : 'Follow the steps below to create an amazing event'}
          </p>
        </div>

        {/* Progress Bar - items-start keeps all steps aligned to top */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-2">
            {STEPS.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const StepIcon = step.icon;
              
              return (
                <div key={step.id} className="flex flex-col items-center flex-1 min-w-0">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-200 flex-shrink-0
                    ${isCompleted ? 'bg-green-500 text-white' : 
                      isActive ? 'bg-blue-500 text-white' : 
                      'bg-gray-200 text-gray-500'}
                  `}>
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : <StepIcon className="w-6 h-6" />}
                  </div>
                  <div className="text-center min-h-[2.5rem]">
                    <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400 hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                  <div className={`hidden sm:block w-full max-w-4 h-0.5 mt-4 flex-shrink-0 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <Card className="p-8">
          {currentStep === 1 && (
            <BasicInfoStep 
              formData={formData} 
              errors={errors}
              categories={categories}
              onInputChange={handleInputChange}
            />
          )}
          
          
          {currentStep === 2 && (
            <EventDetailsStep 
              formData={formData} 
              errors={errors}
              onInputChange={handleInputChange}
            />
          )}
          
          {currentStep === 3 && (
            <PricingMediaStep 
              formData={formData} 
              errors={errors}
              imagePreview={imagePreview}
              uploadingImage={uploadingImage}
              onInputChange={handleInputChange}
              onImageUpload={handleImageUpload}
              onImageRemove={() => {
                setImagePreview(null);
                setCurrentImageUrl(null);
                setFormData(prev => ({ ...prev, imageUrl: '' }));
                // Clear the file input
                const fileInput = document.getElementById('image-upload');
                if (fileInput) {
                  fileInput.value = '';
                }
              }}
            />
          )}
          
          
          {currentStep === 4 && (
            <div className="space-y-8">
              {/* Recurring Settings Section */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Repeat className="w-5 h-5 mr-2" />
                  Recurring Settings
                </h3>
                <RecurringEventForm 
                  recurringData={recurringData}
                  onRecurringChange={setRecurringData}
                />
              </div>

              {/* Collaboration Settings Section */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Collaboration
                </h3>
                <p className="text-gray-600 mb-4">Add co-organizers and set permissions for your event</p>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    This feature allows you to invite co-organizers to help manage your event.
                    You can set different permission levels for each team member.
                  </p>
                </div>
              </div>

              {/* Additional Settings Section */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Additional Settings
                </h3>
                <AdditionalSettingsStep 
                  formData={formData} 
                  errors={errors}
                  onInputChange={handleInputChange}
                  onAddTag={addTag}
                  onRemoveTag={removeTag}
                />
              </div>
            </div>
          )}
          
          {currentStep === 5 && (
            <ReviewStep 
              formData={formData}
              categories={categories}
              user={user}
              recurringData={recurringData}
              coOrganizers={coOrganizers}
            />
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              icon={ArrowLeft}
            >
              Previous
            </Button>
            
            <div className="flex gap-3">
              {currentStep < STEPS.length ? (
                <Button
                  onClick={handleNext}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Next
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSubmit(true)}
                    variant="ghost"
                    loading={loading}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => handleSubmit(false)}
                    loading={loading}
                    icon={Save}
                    iconPosition="right"
                  >
                    Publish Event
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Step 1: Basic Information
const BasicInfoStep = ({ formData, errors, categories, onInputChange }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Info className="w-12 h-12 text-blue-500 mx-auto mb-3" />
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Basic Information</h2>
        <p className="text-gray-600 dark:text-gray-400">Let's start with the essential details about your event</p>
      </div>

      <div className="space-y-6">
        <Input
          label="Event Title"
          value={formData.title}
          onChange={(e) => onInputChange('title', e.target.value)}
          error={errors.title}
          placeholder="Enter an engaging title for your event"
          helperText="Make it catchy and descriptive"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => onInputChange('category', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
              errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description <span className="text-red-500">*</span>
            </label>
            <DescriptionGenerator
              eventDetails={{
                title: formData.title,
                category: formData.category,
                location: formData.location
              }}
              onGenerated={(text) => onInputChange('description', text)}
            />
          </div>
          <textarea
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            rows={6}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
              errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Describe your event in detail. What will attendees learn or experience?"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
          )}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {formData.description.length}/500 characters (minimum 20)
          </p>
        </div>
      </div>
    </div>
  );
};

// Step 2: Event Details
const EventDetailsStep = ({ formData, errors, onInputChange }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Calendar className="w-12 h-12 text-blue-500 mx-auto mb-3" />
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Event Details</h2>
        <p className="text-gray-600 dark:text-gray-400">When and where will your event take place?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start Date & Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={formData.startDateTime}
            onChange={(e) => onInputChange('startDateTime', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.startDateTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.startDateTime && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.startDateTime}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            End Date & Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={formData.endDateTime}
            onChange={(e) => onInputChange('endDateTime', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.endDateTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.endDateTime && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.endDateTime}</p>
          )}
        </div>
      </div>

      <Input
        label="Location"
        value={formData.location}
        onChange={(e) => onInputChange('location', e.target.value)}
        error={errors.location}
        placeholder="Enter the event location"
        helperText="Include venue name and address"
        leftIcon={<MapPin className="w-4 h-4 text-gray-400" />}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Capacity <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min="1"
          value={formData.capacity}
          onChange={(e) => onInputChange('capacity', parseInt(e.target.value))}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.capacity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="Maximum number of attendees"
        />
        {errors.capacity && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.capacity}</p>
        )}
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          How many people can attend your event?
        </p>
      </div>
    </div>
  );
};

// Step 3: Pricing & Media
const PricingMediaStep = ({ formData, errors, imagePreview, uploadingImage, onInputChange, onImageUpload, onImageRemove }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <DollarSign className="w-12 h-12 text-blue-500 mx-auto mb-3" />
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Pricing & Media</h2>
        <p className="text-gray-600 dark:text-gray-400">Set pricing and add visual content to your event</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isFree"
              checked={formData.isFree}
              onChange={(e) => onInputChange('isFree', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isFree" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              This is a free event
            </label>
          </div>

          {!formData.isFree && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => onInputChange('price', parseFloat(e.target.value))}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.price && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.price}</p>
              )}
            </div>
          )}

          <Input
            label="Event Website (Optional)"
            value={formData.url}
            onChange={(e) => onInputChange('url', e.target.value)}
            error={errors.url}
            placeholder="https://example.com"
            helperText="Link to your event's official website"
            leftIcon={<LinkIcon className="w-4 h-4 text-gray-400" />}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Event Image <span className="text-red-500">*</span>
          </label>
          <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            errors.imageUrl
              ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
              : uploadingImage 
                ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' 
                : imagePreview 
                  ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}>
            {uploadingImage ? (
              <div className="space-y-3">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-blue-600 font-medium">
                  Uploading image...
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Please wait while we upload your image
                </p>
              </div>
            ) : imagePreview ? (
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="Event preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={onImageRemove}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                  ✓ Uploaded
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          onImageUpload(file);
                        }
                      }}
                      className="hidden"
                      id="replace-image-upload"
                    />
                    <label
                      htmlFor="replace-image-upload"
                      className="inline-flex items-center px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 dark:bg-gray-900 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Replace Image
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-3">
                  Upload an image for your event
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      onImageUpload(file);
                    }
                  }}
                  className="hidden"
                  id="image-upload"
                  disabled={uploadingImage}
                />
                <label
                  htmlFor="image-upload"
                  className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:bg-gray-900 cursor-pointer transition-colors ${
                    uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Image
                </label>
              </div>
            )}
          </div>
          {errors.imageUrl && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.imageUrl}</p>
          )}
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <p>• Required — recommended size: 1200x630px</p>
            <p>• Max file size: 5MB</p>
            <p>• Supported formats: JPG, PNG, GIF, WebP</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 4: Additional Settings
const AdditionalSettingsStep = ({ formData, errors, onInputChange, onAddTag, onRemoveTag }) => {
  const [newTag, setNewTag] = useState('');

  const handleAddTag = (e) => {
    e.preventDefault();
    if (newTag.trim()) {
      onAddTag(newTag);
      setNewTag('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Settings className="w-12 h-12 text-blue-500 mx-auto mb-3" />
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Additional Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">Add tags to help people discover your event</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tags <span className="text-red-500">*</span>
        </label>
        
        <form onSubmit={handleAddTag} className="flex gap-2 mb-3">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Enter a tag"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Button type="submit" size="sm" icon={Plus}>
            Add
          </Button>
        </form>

        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="ml-1 hover:text-blue-600"
                >
                  <CloseIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {errors.tags && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tags}</p>
        )}
        
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Add relevant tags to help people find your event. Examples: "workshop", "networking", "tech"
        </p>
      </div>

      {/* Private Notes (organizer only) */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Private Notes (organizer only)
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => onInputChange('notes', e.target.value)}
          placeholder="Add private notes about this event (logistics, contacts, reminders)..."
          rows={3}
          maxLength={2000}
          className="w-full"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          These notes are only visible to you and co-organizers. Not shown to attendees.
        </p>
      </div>
    </div>
  );
};

// Step 5: Review & Publish - matches the flow of other steps
const ReviewStep = ({ formData, categories, user }) => {
  const selectedCategory = categories.find(cat => cat._id === formData.category);

  const reviewSections = [
    {
      title: 'Basic Information',
      icon: Info,
      items: [
        { label: 'Title', value: formData.title },
        { label: 'Category', value: selectedCategory?.name || 'Not selected' },
        { label: 'Description', value: formData.description, multiline: true }
      ]
    },
    {
      title: 'Event Details',
      icon: Calendar,
      items: [
        { label: 'Start', value: formData.startDateTime ? new Date(formData.startDateTime).toLocaleString() : 'Not set' },
        { label: 'End', value: formData.endDateTime ? new Date(formData.endDateTime).toLocaleString() : 'Not set' },
        { label: 'Location', value: formData.location },
        { label: 'Capacity', value: `${formData.capacity} attendees` }
      ]
    },
    {
      title: 'Pricing & Media',
      icon: DollarSign,
      items: [
        { label: 'Price', value: formData.isFree ? 'Free' : `$${formData.price}` },
        ...(formData.url ? [{ label: 'Website', value: formData.url, link: true }] : []),
        ...(formData.imageUrl ? [{ label: 'Image', value: formData.imageUrl, image: true }] : [])
      ]
    },
    {
      title: 'Tags & Organizer',
      icon: Tag,
      items: [
        { label: 'Organizer', value: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() },
        { label: 'Tags', value: formData.tags?.join(', ') || 'None', tags: formData.tags }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Eye className="w-12 h-12 text-blue-500 mx-auto mb-3" />
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Review Your Event</h2>
        <p className="text-gray-600 dark:text-gray-400">Please review all details before publishing</p>
      </div>

      <div className="space-y-6 max-w-2xl mx-auto">
        {reviewSections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <div
              key={section.title}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6"
            >
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <SectionIcon className="w-5 h-5 text-blue-500" />
                {section.title}
              </h3>
              <div className="space-y-3">
                {section.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-28 flex-shrink-0">
                      {item.label}
                    </p>
                    <div className="flex-1 min-w-0">
                      {item.multiline ? (
                        <p className="text-gray-900 dark:text-white text-sm whitespace-pre-wrap">{item.value}</p>
                      ) : item.tags ? (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : item.image ? (
                        <img src={item.value} alt="Event" className="h-24 object-cover rounded-lg" />
                      ) : item.link ? (
                        <a href={item.value} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-sm truncate block">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-gray-900 dark:text-white text-sm">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Temporarily disabled step components
// const TemplatesStep = ...
// const RecurringSettingsStep = ...
// const CollaborationStep = ...

export default CreateEvent;
