import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../Utils/apiService';
import Card from '../Components/UI/Card';
import Button from '../Components/UI/Button';
import LoadingSpinner from '../Components/UI/LoadingSpinner';
import { 
  Building2, Users, Plus, Settings, Mail, 
  Crown, Shield, User, Trash2, UserPlus, X, Check
} from 'lucide-react';

const Organizations = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchOrganizations(); }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.get('/api/organizations');
      setOrganizations(Array.isArray(response?.data) ? response.data : 
                      Array.isArray(response?.organizations) ? response.organizations : 
                      Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError('Failed to load organizations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await apiService.post('/api/organizations', createForm);
      setShowCreate(false);
      setCreateForm({ name: '', description: '' });
      setSuccess('Organization created successfully!');
      fetchOrganizations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create organization');
    }
  };

  const selectOrg = async (org) => {
    setSelectedOrg(org);
    try {
      const response = await apiService.get(`/api/organizations/${org._id}/members`);
      setMembers(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching members:', err);
      setMembers([]);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !selectedOrg) return;
    setError('');
    try {
      await apiService.post(`/api/organizations/${selectedOrg._id}/members/invite`, {
        email: inviteEmail,
        role: inviteRole
      });
      setInviteEmail('');
      setSuccess('Invitation sent!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to send invitation');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await apiService.delete(`/api/organizations/${selectedOrg._id}/members/${memberId}`);
      setMembers(prev => prev.filter(m => m._id !== memberId));
      setSuccess('Member removed');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to remove member');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading organizations..." fullScreen />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organizations</h1>
        </div>
        <Button onClick={() => setShowCreate(true)} icon={Plus}>
          Create Organization
        </Button>
      </div>

      {/* Alerts */}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">{success}</div>}
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Org List */}
        <div className="lg:col-span-1 space-y-3">
          {organizations.length === 0 ? (
            <Card className="p-8 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No organizations yet</p>
              <Button onClick={() => setShowCreate(true)} size="sm" className="mt-4">Create One</Button>
            </Card>
          ) : (
            organizations.map(org => (
              <Card 
                key={org._id} 
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${selectedOrg?._id === org._id ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => selectOrg(org)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">{org.name}</h3>
                    <p className="text-xs text-gray-500">{org.members?.length || 0} members</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Org Details */}
        <div className="lg:col-span-2">
          {selectedOrg ? (
            <Card className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedOrg.name}</h2>
                  <p className="text-gray-500 text-sm mt-1">{selectedOrg.description || 'No description'}</p>
                </div>
              </div>

              {/* Invite Member */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> Invite Members
                </h3>
                <form onSubmit={handleInvite} className="flex gap-2 mb-3">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="Email address"
                    className="flex-1 px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button type="submit" size="sm" icon={Mail}>Invite</Button>
                </form>
                
                {/* Bulk Invite */}
                <details className="text-sm">
                  <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Bulk invite (paste emails)
                  </summary>
                  <div className="mt-2">
                    <textarea
                      placeholder="Paste emails separated by commas or newlines..."
                      className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      rows={3}
                      id="bulk-emails"
                    />
                    <Button 
                      size="sm" 
                      className="mt-2"
                      onClick={async () => {
                        const text = document.getElementById('bulk-emails').value;
                        const emails = text.split(/[,\n;]/).map(e => e.trim()).filter(e => e.includes('@'));
                        if (emails.length === 0) { setError('No valid emails found'); return; }
                        try {
                          const response = await apiService.post(`/api/organizations/${selectedOrg._id}/members/bulk-invite`, { emails, role: inviteRole });
                          setSuccess(response?.message || `${emails.length} invites processed`);
                          document.getElementById('bulk-emails').value = '';
                          setTimeout(() => setSuccess(''), 4000);
                        } catch (err) { setError(err.message || 'Bulk invite failed'); }
                      }}
                    >
                      Send {inviteRole} invites
                    </Button>
                  </div>
                </details>
              </div>

              {/* Members List */}
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Members ({members.length})
              </h3>
              <div className="space-y-2">
                {members.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center">No members found</p>
                ) : (
                  members.map(member => (
                    <div key={member._id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getRoleIcon(member.role)}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.user?.firstName} {member.user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{member.user?.email} • {member.role}</p>
                        </div>
                      </div>
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select an organization to manage members</p>
            </Card>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Organization</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" icon={Check}>Create</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Organizations;
