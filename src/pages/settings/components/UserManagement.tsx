import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Mail, Calendar, Shield, Trash2, CheckCircle } from 'lucide-react';
import { Card, Input, Button } from '../../../components/Shared/SharedComponents';
import { supabase } from '../../../lib/supabase';
import { useNotifications } from '../../../contexts/NotificationContext';
import { LoadingSpinner } from './shared/LoadingSpinner';
import { EmptyState } from './shared/EmptyState';

interface UserWithRole {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const { success, error } = useNotifications();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=list`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      error('Failed to load users', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setUpdatingUserId(userId);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=update`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, newRole }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }

      await fetchUsers();
      success('Role updated', `User role has been successfully changed to ${newRole}`);
    } catch (err) {
      console.error('Error updating user role:', err);
      error('Failed to update role', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setUpdatingUserId(userId);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=delete`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      await fetchUsers();
      success('User deleted', 'User has been successfully removed from the system');
    } catch (err) {
      console.error('Error deleting user:', err);
      error('Failed to delete user', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner color="tg-primary" />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-tg-primary" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
            <p className="text-sm text-gray-600">Manage user access and roles</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {users.length} total users
        </div>
      </div>

      <Card className="p-4">
        <Input
          icon={Search}
          placeholder="Search users by email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
      </Card>

      <div className="grid gap-4">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-tg-primary rounded-full flex items-center justify-center text-white font-semibold">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{user.email}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-tg-primary/10 text-tg-primary rounded-full text-sm font-medium">
                    {user.role === 'ADMIN' ? (
                      <Shield className="w-4 h-4" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                    <span>{user.role}</span>
                  </div>

                  {user.role === 'PENDING' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={CheckCircle}
                      onClick={() => updateUserRole(user.id, 'ADMIN')}
                      disabled={updatingUserId === user.id}
                    >
                      {updatingUserId === user.id ? 'Approving...' : 'Approve'}
                    </Button>
                  )}

                  {user.role === 'ADMIN' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateUserRole(user.id, 'PENDING')}
                      disabled={updatingUserId === user.id}
                    >
                      {updatingUserId === user.id ? 'Revoking...' : 'Revoke Access'}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => deleteUser(user.id)}
                    disabled={updatingUserId === user.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <EmptyState
            icon={Users}
            title="No users found"
            description={searchTerm ? 'Try adjusting your search terms' : 'No users available'}
          />
        </Card>
      )}
    </div>
  );
};
