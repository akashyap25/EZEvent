import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../Utils/apiService';
import Card from '../Components/UI/Card';
import LoadingSpinner from '../Components/UI/LoadingSpinner';
import { 
  Users, Calendar, ShoppingCart, DollarSign, 
  Search, Shield, UserX, UserCheck, Download,
  TrendingUp, AlertCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { fetchStats(); fetchUsers(); }, []);

  const fetchStats = async () => {
    try {
      const response = await apiService.get('/api/admin/stats');
      setStats(response?.data || response);
    } catch (err) {
      setError('Failed to load admin stats. Ensure you have admin access.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (p = 1) => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 15 });
      if (searchTerm) params.set('search', searchTerm);
      if (roleFilter) params.set('role', roleFilter);
      
      const response = await apiService.get(`/api/admin/users?${params}`);
      setUsers(response?.data || []);
      setTotalPages(response?.pagination?.pages || 1);
      setPage(p);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await apiService.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      setSuccess(`Role updated to ${newRole}`);
      fetchUsers(page);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update role');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await apiService.patch(`/api/admin/users/${userId}/status`, { isActive: !currentStatus });
      setSuccess(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchUsers(page);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update status');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleExport = async (eventId) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/export`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-${eventId}-attendees.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Export failed');
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading admin panel..." fullScreen />;

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-400">You need admin privileges to access this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-purple-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
      </div>

      {/* Alerts */}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">{success}</div>}
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Total Users" value={stats.overview?.totalUsers || 0} color="blue" />
          <StatCard icon={Calendar} label="Total Events" value={stats.overview?.totalEvents || 0} color="green" />
          <StatCard icon={ShoppingCart} label="Orders" value={stats.overview?.totalOrders || 0} color="purple" />
          <StatCard icon={DollarSign} label="Revenue" value={`₹${stats.overview?.totalRevenue || 0}`} color="orange" />
        </div>
      )}

      {/* User Management */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">User Management</h2>
        
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchUsers(1)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); fetchUsers(1); }}
            className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
          </select>
        </div>

        {/* Users Table */}
        {usersLoading ? (
          <LoadingSpinner text="Loading users..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">User</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">Email</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">Role</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-2">
                      <span className="font-medium text-gray-900 dark:text-white">{u.firstName} {u.lastName}</span>
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="py-3 px-2">
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u._id, e.target.value)}
                        className="text-xs px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        disabled={u._id === user?._id}
                      >
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {u._id !== user?._id && (
                        <button
                          onClick={() => handleStatusToggle(u._id, u.isActive)}
                          className={`p-1.5 rounded ${u.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => fetchUsers(p)}
                className={`px-3 py-1 rounded text-sm ${p === page ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20'
  };
  return (
    <Card className="p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </Card>
  );
};

export default AdminDashboard;
