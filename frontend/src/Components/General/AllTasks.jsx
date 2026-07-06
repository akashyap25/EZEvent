import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SERVER_URL } from '../../Utils/Constants';
import apiService from '../../Utils/apiService';
import Card from '../UI/Card';
import Button from '../UI/Button';
import LoadingSpinner from '../UI/LoadingSpinner';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  User, 
  Calendar,
  Filter,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  MoreVertical,
  CheckSquare,
  Square,
  TrendingUp,
  Target,
  Users,
  Bell,
  Star,
  Archive,
  RefreshCw,
  Download,
  Upload,
  Settings,
  BarChart3,
  PieChart,
  List,
  Grid3X3
} from 'lucide-react';
import formatDateTime from '../../Utils/FormatDate';

const AllTasks = () => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState('deadline'); // 'deadline', 'priority', 'title', 'status'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showCompleted, setShowCompleted] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all tasks for the current user
  useEffect(() => {
    const fetchAllTasks = async () => {
      if (!isAuthenticated || !currentUser?._id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch tasks where user is either creator or assigned to
        const response = await apiService.get(`/api/tasks/user/${currentUser._id}`);
        // Tasks endpoint returns direct array
        const tasksData = Array.isArray(response) ? response : 
                         Array.isArray(response?.data) ? response.data : [];
        setTasks(tasksData);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setError('Failed to load tasks. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllTasks();
  }, [isAuthenticated, currentUser?._id]);

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

      // Priority filter
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

      // Show completed filter
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

  // Check if task is overdue
  const isOverdue = (deadline, status) => {
    return new Date(deadline) < new Date() && status !== 'completed';
  };

  // Toggle task selection
  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Select all tasks
  const selectAllTasks = () => {
    setSelectedTasks(filteredTasks.map(task => task._id));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedTasks([]);
  };

  // Refresh tasks
  const refreshTasks = async () => {
    setRefreshing(true);
    try {
      const response = await apiService.get(`/api/tasks/user/${currentUser._id}`);
      setTasks(Array.isArray(response) ? response : response?.data || []);
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    } finally {
      setRefreshing(false);
    }
  };

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Please Sign In
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need to be signed in to view your tasks.
            </p>
            <Link to="/sign-in">
              <Button variant="primary">
                Sign In
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <LoadingSpinner size="lg" text="Loading your tasks..." />
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
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Error Loading Tasks
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
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
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              icon={ArrowLeft}
              className="flex items-center gap-2"
            >
              Back
            </Button>
            
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Tasks</h1>
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
                variant="ghost"
                size="sm"
                icon={Settings}
              >
                Settings
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
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
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
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
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
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
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
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
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
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
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
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
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

        {/* Tasks Display */}
        {filteredTasks.length === 0 ? (
          <Card className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {tasks.length === 0 ? 'No Tasks Assigned' : 'No Tasks Match Your Filters'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {tasks.length === 0 
                ? 'You don\'t have any tasks assigned to you yet.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {tasks.length === 0 && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => navigate('/events')}
              >
                Browse Events
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
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {task.status}
                            </div>
                            {isTaskOverdue && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100">
                                Overdue
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {task.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {formatDateTime(task.deadline).dateOnly}</span>
                          </div>
                          {task.event && (
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <Link 
                                to={`/events/${task.event._id}`}
                                className="text-blue-600 hover:text-blue-800 truncate"
                              >
                                {task.event.title}
                              </Link>
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
                        <Link to={`/events/${task.event?._id}/tasks`}>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={Eye}
                          >
                            View
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={MoreVertical}
                        >
                          More
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

export default AllTasks;
