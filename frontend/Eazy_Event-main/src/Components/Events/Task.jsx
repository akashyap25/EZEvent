import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiService from '../../Utils/apiService';
import { SERVER_URL } from '../../Utils/Constants';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { useAuth } from '../../contexts/AuthContext';
import getUser from '../../Utils/GetUser';
import formatDateTime from '../../Utils/FormatDate';
import Card from '../UI/Card';
import Button from '../UI/Button';
import LoadingSpinner from '../UI/LoadingSpinner';
import {
  ArrowLeft,
  Plus,
  Target,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  User,
  Bell,
  Star,
  Eye,
  Settings,
  BarChart3,
  List,
  Grid3X3,
  CheckSquare,
  Square,
  Download,
  Archive,
  TrendingUp,
  X as CloseIcon
} from 'lucide-react';

const Task = () => {
  const { id: eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [event, setEvent] = useState(null);
  const [creatorId, setCreatorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('deadline');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user data
        if (user?._id) {
          const fetchedUser = await getUser(user._id);
          if (fetchedUser && fetchedUser._id) {
            setCreatorId(fetchedUser._id);
          }
        }
        
        // Fetch event data - returns { success, data: event }
        const eventResponse = await apiService.get(`/api/events/${eventId}`);
        setEvent(eventResponse?.data || eventResponse);
        
        // Fetch tasks for this event - returns raw array
        const tasksResponse = await apiService.get(`/api/tasks/event/${eventId}`);
        setTasks(Array.isArray(tasksResponse) ? tasksResponse : tasksResponse?.data || []);
        
        // Fetch registered users for this event - returns { data: users }
        const usersResponse = await apiService.get(`/api/orders/rgstduser/${eventId}`);
        setUsers(Array.isArray(usersResponse?.data) ? usersResponse.data : []);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load event tasks. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, user?._id]);

  const handleTaskSubmit = async (values, { resetForm, setSubmitting }) => {
    try {
      setSubmitting(true);
        await apiService.post(`/api/tasks`, { ...values, event: eventId });
      resetForm();
      setShowCreateForm(false);
      await refreshTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await apiService.delete(`/api/tasks/${taskId}`);
      await refreshTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task. Please try again.');
    }
  };

  const refreshTasks = async () => {
    setRefreshing(true);
    try {
      const response = await apiService.get(`/api/tasks/event/${eventId}`);
      setTasks(response.data || []);
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task => {
      const matchesSearch = searchTerm === '' || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesCompleted = showCompleted || task.status !== 'completed';

      return matchesSearch && matchesStatus && matchesPriority && matchesCompleted;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority] || 0;
          const bPriority = priorityOrder[b.priority] || 0;
          comparison = aPriority - bPriority;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'deadline':
        default:
          comparison = new Date(a.deadline) - new Date(b.deadline);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Get task statistics
  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const overdue = tasks.filter(t => isOverdue(t.deadline, t.status)).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, inProgress, overdue, completionRate };
  };

  const stats = getTaskStats();

  // Toggle task selection
  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const selectAllTasks = () => {
    setSelectedTasks(filteredTasks.map(task => task._id));
  };

  const clearSelection = () => {
    setSelectedTasks([]);
  };

  const validationSchema = Yup.object().shape({
    title: Yup.string().required('Title is required'),
    description: Yup.string(),
    assignee: Yup.string().required('Assignee is required'),
    deadline: Yup.string().required('Deadline is required'),
    priority: Yup.string().oneOf(['low', 'medium', 'high', 'urgent']).required('Priority is required'),
  });

  // Check if task is overdue
  const isOverdue = (deadline, status) => {
    return new Date(deadline) < new Date() && status !== 'completed';
  };

  // Get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'in-progress':
        return { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-100' };
      case 'overdue':
        return { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100' };
      default:
        return { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <LoadingSpinner size="lg" text="Loading event tasks..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="text-center py-12">
            <div className="text-red-500 mb-4">
              <AlertCircle className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Error Loading Tasks
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button 
              variant="primary" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      {/* Header with Back Button */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(`/events/${eventId}`)}
              icon={ArrowLeft}
              className="flex items-center gap-2"
            >
              Back to Event
            </Button>
            
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Event Tasks</h1>
                {event && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{event.title}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshTasks}
                loading={refreshing}
                icon={RefreshCw}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateForm(true)}
                icon={Plus}
              >
                Create Task
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.completed}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.inProgress}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.overdue}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.completionRate}%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Enhanced Filters and Controls */}
        <Card className="p-6 mb-8">
          <div className="space-y-4">
            {/* Top Row: Search and View Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* View Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'list' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    icon={List}
                  >
                    List
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    icon={Grid3X3}
                  >
                    Grid
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={showCompleted}
                      onChange={(e) => setShowCompleted(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Show Completed
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Row: Filters and Sort */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="deadline">Deadline</option>
                    <option value="priority">Priority</option>
                    <option value="title">Title</option>
                    <option value="status">Status</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    icon={sortOrder === 'asc' ? TrendingUp : TrendingUp}
                    className="transform rotate-180"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Selection Controls */}
            {filteredTasks.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllTasks}
                    icon={CheckSquare}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    icon={Square}
                  >
                    Clear Selection
                  </Button>
                  {selectedTasks.length > 0 && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedTasks.length} selected
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Download}
                  >
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Archive}
                  >
                    Archive Selected
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Create Task Form Modal */}
        {showCreateForm && (
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Task</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(false)}
                icon={CloseIcon}
              >
                Close
              </Button>
            </div>
            
            <Formik
              initialValues={{ 
                title: '', 
                description: '', 
                assignee: '', 
                deadline: '',
                priority: 'medium'
              }}
              validationSchema={validationSchema}
              onSubmit={handleTaskSubmit}
            >
              {({ values, handleChange, handleSubmit, touched, errors, isSubmitting }) => (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Task Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={values.title}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter task title"
                      />
                      {touched.title && errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority *
                      </label>
                      <select
                        name="priority"
                        value={values.priority}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                      {touched.priority && errors.priority && (
                        <p className="mt-1 text-sm text-red-600">{errors.priority}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={values.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter task description"
                    />
                    {touched.description && errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign To *
                      </label>
                      <select
                        name="assignee"
                        value={values.assignee}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select assignee</option>
                        {users?.map((user) => (
                          <option
                            key={user._id}
                            value={user._id}
                            disabled={user._id === creatorId}
                          >
                            {user.firstName} {user.lastName} ({user.email})
                          </option>
                        ))}
                      </select>
                      {touched.assignee && errors.assignee && (
                        <p className="mt-1 text-sm text-red-600">{errors.assignee}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deadline *
                      </label>
                      <input
                        type="datetime-local"
                        name="deadline"
                        value={values.deadline}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {touched.deadline && errors.deadline && (
                        <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={isSubmitting}
                      icon={Plus}
                    >
                      Create Task
                    </Button>
                  </div>
                </form>
              )}
            </Formik>
          </Card>
        )}

        {/* Tasks Display */}
        {filteredTasks.length === 0 ? (
          <Card className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {tasks.length === 0 ? 'No Tasks Created' : 'No Tasks Match Your Filters'}
            </h3>
            <p className="text-gray-600 mb-6">
              {tasks.length === 0 
                ? 'Create your first task to get started with event management.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {tasks.length === 0 && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setShowCreateForm(true)}
              >
                Create First Task
              </Button>
            )}
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredTasks.map((task) => {
              const statusInfo = getStatusInfo(task.status);
              const StatusIcon = statusInfo.icon;
              const isTaskOverdue = isOverdue(task.deadline, task.status);
              const isSelected = selectedTasks.includes(task._id);
              
              return (
                <Card 
                  key={task._id} 
                  className={`p-6 hover:shadow-lg transition-all duration-200 ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  } ${viewMode === 'grid' ? 'h-full' : ''}`}
                >
                  <div className={viewMode === 'grid' ? 'h-full flex flex-col' : 'flex items-start justify-between'}>
                    {/* Selection Checkbox */}
                    <div className="flex items-start gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTaskSelection(task._id)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority || 'medium')}`}>
                              {task.priority || 'medium'}
                            </span>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {task.status || 'pending'}
                            </div>
                            {isTaskOverdue && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100">
                                Overdue
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {task.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {formatDateTime(task.deadline).dateOnly}</span>
                          </div>
                          {task.assignedTo && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span className="truncate">
                                {task.assignedTo.firstName} {task.assignedTo.lastName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Star}
                          className="text-gray-400 hover:text-yellow-500"
                        >
                          Star
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Bell}
                          className="text-gray-400 hover:text-blue-500"
                        >
                          Notify
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Link to={`/tasks/${task._id}/update`}>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={Edit}
                          >
                            Edit
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTask(task._id)}
                          icon={Trash2}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Task;
