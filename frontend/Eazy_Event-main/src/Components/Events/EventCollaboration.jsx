import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  Shield, 
  UserPlus,
  Crown,
  Settings,
  X as CloseIcon
} from 'lucide-react';
import axios from 'axios';
import { SERVER_URL } from '../../Utils/Constants';
import Card from '../UI/Card';
import Button from '../UI/Button';
import LoadingSpinner from '../UI/LoadingSpinner';

const EventCollaboration = ({ eventId, onClose }) => {
  const [collaborators, setCollaborators] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPermissions, setShowPermissions] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('co-organizer');
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  useEffect(() => {
    if (eventId) {
      fetchCollaborators();
      fetchRolesAndPermissions();
    }
  }, [eventId]);

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${SERVER_URL}/api/collaboration/${eventId}/collaborators`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      setCollaborators(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRolesAndPermissions = async () => {
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        axios.get(`${SERVER_URL}/api/collaboration/roles`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }),
        axios.get(`${SERVER_URL}/api/collaboration/permissions`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        })
      ]);

      setRoles(rolesResponse.data?.data || []);
      setPermissions(permissionsResponse.data?.data || []);
    } catch (error) {
      console.error('Error fetching roles and permissions:', error);
    }
  };

  const handleAddCollaborator = async () => {
    try {
      // In a real app, you'd have a user search/selection component
      // For now, we'll use a simple prompt
      const userId = prompt('Enter user ID to add as collaborator:');
      if (!userId) return;

      await axios.post(`${SERVER_URL}/api/collaboration/${eventId}/co-organizers`, {
        userId,
        role: selectedRole,
        permissions: selectedPermissions
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      fetchCollaborators();
      setShowAddForm(false);
      setSearchUser('');
      setSelectedRole('co-organizer');
      setSelectedPermissions([]);
    } catch (error) {
      console.error('Error adding collaborator:', error);
      alert('Failed to add collaborator. Please try again.');
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) return;

    try {
      await axios.delete(`${SERVER_URL}/api/collaboration/${eventId}/co-organizers/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      fetchCollaborators();
    } catch (error) {
      console.error('Error removing collaborator:', error);
      alert('Failed to remove collaborator. Please try again.');
    }
  };

  const handleUpdatePermissions = async (userId, newPermissions) => {
    try {
      await axios.put(`${SERVER_URL}/api/collaboration/${eventId}/co-organizers/${userId}/permissions`, {
        permissions: newPermissions
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      fetchCollaborators();
      setShowPermissions(null);
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Failed to update permissions. Please try again.');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'organizer':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'co-organizer':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'assistant':
        return <Users className="w-4 h-4 text-green-600" />;
      case 'moderator':
        return <Settings className="w-4 h-4 text-purple-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'organizer':
        return 'bg-yellow-100 text-yellow-800';
      case 'co-organizer':
        return 'bg-blue-100 text-blue-800';
      case 'assistant':
        return 'bg-green-100 text-green-800';
      case 'moderator':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event Collaboration</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage co-organizers and their permissions</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddForm(true)}
            icon={UserPlus}
          >
            Add Collaborator
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Add Collaborator Form */}
      {showAddForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Collaborator</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Enter user ID or email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label} - {role.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions
              </label>
              <div className="space-y-2">
                {permissions.map(permission => (
                  <label key={permission.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions([...selectedPermissions, permission.value]);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== permission.value));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{permission.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddCollaborator}>
                Add Collaborator
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Collaborators List */}
      <div className="space-y-4">
        {/* Main Organizer */}
        {collaborators?.organizer && (
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getRoleIcon('organizer')}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {collaborators.organizer.user.firstName} {collaborators.organizer.user.lastName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">@{collaborators.organizer.user.username}</p>
                  <p className="text-sm text-gray-500">{collaborators.organizer.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor('organizer')}`}>
                  Main Organizer
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Co-organizers */}
        {collaborators?.coOrganizers?.map((collaborator, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getRoleIcon(collaborator.role)}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {collaborator.user.firstName} {collaborator.user.lastName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">@{collaborator.user.username}</p>
                  <p className="text-sm text-gray-500">{collaborator.user.email}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {collaborator.permissions.map(permission => (
                      <span
                        key={permission}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {permission.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(collaborator.role)}`}>
                  {collaborator.role.replace('_', ' ')}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPermissions(collaborator)}
                  icon={Settings}
                >
                  Permissions
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveCollaborator(collaborator.user._id)}
                  icon={Trash2}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {(!collaborators?.coOrganizers || collaborators.coOrganizers.length === 0) && (
          <Card className="p-6 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Co-organizers</h3>
            <p className="text-gray-600 mb-4">Add co-organizers to help manage your event.</p>
            <Button onClick={() => setShowAddForm(true)} icon={UserPlus}>
              Add Your First Co-organizer
            </Button>
          </Card>
        )}
      </div>

      {/* Permissions Modal */}
      {showPermissions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <Card className="p-6 max-w-md w-full mx-4 my-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Update Permissions for {showPermissions.user.firstName} {showPermissions.user.lastName}
            </h3>
            <div className="space-y-2 mb-6">
              {permissions.map(permission => (
                <label key={permission.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showPermissions.permissions.includes(permission.value)}
                    onChange={(e) => {
                      const newPermissions = e.target.checked
                        ? [...showPermissions.permissions, permission.value]
                        : showPermissions.permissions.filter(p => p !== permission.value);
                      setShowPermissions({ ...showPermissions, permissions: newPermissions });
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{permission.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleUpdatePermissions(showPermissions.user._id, showPermissions.permissions)}
              >
                Update Permissions
              </Button>
              <Button variant="outline" onClick={() => setShowPermissions(null)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EventCollaboration;
