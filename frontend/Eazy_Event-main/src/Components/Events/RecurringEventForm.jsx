import React, { useState } from 'react';
import { Calendar, Clock, Repeat, X as CloseIcon } from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';

const RecurringEventForm = ({ onSave, onCancel, initialData = {} }) => {
  const [recurringData, setRecurringData] = useState({
    isRecurring: initialData.isRecurring || false,
    type: initialData.type || 'weekly',
    interval: initialData.interval || 1,
    daysOfWeek: initialData.daysOfWeek || [],
    dayOfMonth: initialData.dayOfMonth || 1,
    endDate: initialData.endDate || '',
    occurrences: initialData.occurrences || 10
  });

  const [errors, setErrors] = useState({});

  const recurringTypes = [
    { value: 'daily', label: 'Daily', description: 'Every day' },
    { value: 'weekly', label: 'Weekly', description: 'Every week' },
    { value: 'monthly', label: 'Monthly', description: 'Every month' },
    { value: 'yearly', label: 'Yearly', description: 'Every year' }
  ];

  const daysOfWeek = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' }
  ];

  const handleInputChange = (field, value) => {
    setRecurringData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleDayToggle = (dayValue) => {
    setRecurringData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(dayValue)
        ? prev.daysOfWeek.filter(d => d !== dayValue)
        : [...prev.daysOfWeek, dayValue]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (recurringData.isRecurring) {
      if (recurringData.interval < 1) {
        newErrors.interval = 'Interval must be at least 1';
      }

      if (recurringData.type === 'weekly' && recurringData.daysOfWeek.length === 0) {
        newErrors.daysOfWeek = 'Please select at least one day of the week';
      }

      if (recurringData.type === 'monthly' && (recurringData.dayOfMonth < 1 || recurringData.dayOfMonth > 31)) {
        newErrors.dayOfMonth = 'Day of month must be between 1 and 31';
      }

      if (recurringData.occurrences && (recurringData.occurrences < 1 || recurringData.occurrences > 1000)) {
        newErrors.occurrences = 'Occurrences must be between 1 and 1000';
      }

      if (recurringData.endDate && recurringData.occurrences) {
        newErrors.endDate = 'Cannot specify both end date and occurrences';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(recurringData);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Repeat className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Recurring Event Settings</h3>
      </div>

      <div className="space-y-6">
        {/* Enable Recurring */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isRecurring"
            checked={recurringData.isRecurring}
            onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Make this a recurring event
          </label>
        </div>

        {recurringData.isRecurring && (
          <div className="space-y-4 pl-6 border-l-2 border-blue-100">
            {/* Recurring Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repeat
              </label>
              <div className="grid grid-cols-2 gap-2">
                {recurringTypes.map(type => (
                  <label
                    key={type.value}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                      recurringData.type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={recurringData.type === type.value}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Interval */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Every {recurringData.type === 'daily' ? 'days' : 
                       recurringData.type === 'weekly' ? 'weeks' : 
                       recurringData.type === 'monthly' ? 'months' : 'years'}
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={recurringData.interval}
                onChange={(e) => handleInputChange('interval', parseInt(e.target.value) || 1)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.interval ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.interval && (
                <p className="mt-1 text-sm text-red-600">{errors.interval}</p>
              )}
            </div>

            {/* Days of Week (for weekly) */}
            {recurringData.type === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days of the week
                </label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => handleDayToggle(day.value)}
                      className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                        recurringData.daysOfWeek.includes(day.value)
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
                {errors.daysOfWeek && (
                  <p className="mt-1 text-sm text-red-600">{errors.daysOfWeek}</p>
                )}
              </div>
            )}

            {/* Day of Month (for monthly) */}
            {recurringData.type === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day of the month
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={recurringData.dayOfMonth}
                  onChange={(e) => handleInputChange('dayOfMonth', parseInt(e.target.value) || 1)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.dayOfMonth ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.dayOfMonth && (
                  <p className="mt-1 text-sm text-red-600">{errors.dayOfMonth}</p>
                )}
              </div>
            )}

            {/* End Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End condition
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="endByDate"
                    name="endCondition"
                    checked={!recurringData.occurrences}
                    onChange={() => handleInputChange('occurrences', '')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="endByDate" className="text-sm text-gray-700 dark:text-gray-300">
                    End by date
                  </label>
                </div>
                {!recurringData.occurrences && (
                  <input
                    type="date"
                    value={recurringData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}

                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="endByOccurrences"
                    name="endCondition"
                    checked={!!recurringData.occurrences}
                    onChange={() => handleInputChange('occurrences', 10)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="endByOccurrences" className="text-sm text-gray-700 dark:text-gray-300">
                    End after
                  </label>
                </div>
                {recurringData.occurrences && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={recurringData.occurrences}
                      onChange={(e) => handleInputChange('occurrences', parseInt(e.target.value) || 1)}
                      className={`w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.occurrences ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">occurrences</span>
                  </div>
                )}
              </div>
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          onClick={onCancel}
          icon={CloseIcon}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          icon={Calendar}
        >
          {recurringData.isRecurring ? 'Save Recurring Settings' : 'Save Event'}
        </Button>
      </div>
    </Card>
  );
};

export default RecurringEventForm;
