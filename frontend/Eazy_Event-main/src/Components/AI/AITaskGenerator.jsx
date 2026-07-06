import React, { useState } from 'react';
import { ListTodo, Loader2, Plus, X, Check } from 'lucide-react';
import axios from 'axios';
import { SERVER_URL } from '../../Utils/Constants';

const AITaskGenerator = ({ eventDetails, onTasksGenerated, className = '' }) => {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [error, setError] = useState('');

  const generateTasks = async () => {
    if (!eventDetails?.title) {
      setError('Please enter an event title first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${SERVER_URL}/api/ai/generate-tasks`,
        {
          title: eventDetails.title,
          description: eventDetails.description,
          startDateTime: eventDetails.startDateTime,
          category: eventDetails.category
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        const generatedTasks = response.data.data.tasks;
        setTasks(generatedTasks);
        setSelectedTasks(generatedTasks.map((_, index) => index));
      } else {
        setError(response.data.message || 'Failed to generate tasks');
      }
    } catch (err) {
      console.error('AI task generation error:', err);
      setError(err.response?.data?.message || 'AI service unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (index) => {
    setSelectedTasks(prev => 
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const addSelectedTasks = () => {
    const tasksToAdd = tasks.filter((_, index) => selectedTasks.includes(index));
    if (onTasksGenerated) {
      onTasksGenerated(tasksToAdd);
    }
    setTasks([]);
    setSelectedTasks([]);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-800">AI Task Generator</span>
        </div>
        <span className="text-xs text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded-full">
          Auto-generate tasks
        </span>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <button
          onClick={generateTasks}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
            bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg
            hover:from-blue-700 hover:to-indigo-700 transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Tasks...</span>
            </>
          ) : (
            <>
              <ListTodo className="w-4 h-4" />
              <span>Generate Tasks with AI</span>
            </>
          )}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="max-h-64 overflow-y-auto space-y-2">
            {tasks.map((task, index) => (
              <div
                key={index}
                onClick={() => toggleTask(index)}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                  ${selectedTasks.includes(index)
                    ? 'bg-white dark:bg-gray-800 border-blue-300 shadow-sm'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5
                  ${selectedTasks.includes(index)
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white dark:bg-gray-800 border-gray-300'
                  }`}
                >
                  {selectedTasks.includes(index) && <Check className="w-3 h-3 text-white" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800 text-sm">{task.title}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>
                  )}
                  {task.dueDate && (
                    <p className="text-xs text-gray-400 mt-1">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={addSelectedTasks}
              disabled={selectedTasks.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 
                bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add {selectedTasks.length} Task{selectedTasks.length !== 1 ? 's' : ''}
            </button>
            
            <button
              onClick={() => { setTasks([]); setSelectedTasks([]); }}
              className="flex items-center justify-center gap-2 px-3 py-2 
                bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Select tasks to add to your event planning
      </p>
    </div>
  );
};

export default AITaskGenerator;
