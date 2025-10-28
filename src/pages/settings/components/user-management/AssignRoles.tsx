import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Search, Plus, X } from 'lucide-react';
import { Card, Button, Input } from '../../../../components/Shared/SharedComponents';
import { supabase } from '../../../../lib/supabase';
import { useNotifications } from '../../../../contexts/NotificationContext';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface UserRole {
  id: string;
  role_id: string;
  assigned_at: string;
  roles: Role;
}

interface UserWithRoles extends User {
  user_roles: UserRole[];
}

export const AssignRoles: React.FC = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { success, error } = useNotifications();

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch users with their roles
      const { data: usersData, error: usersError } = await supabase
        .from('public_users')
        .select(`
          *,
          user_roles!user_roles_user_id_fkey (
            id,
            role_id,
            assigned_at,
            roles (
              id,
              name,
              description,
              is_active
            )
          )
        `)
        .eq('is_active', true)
        .order('email', { ascending: true });

      if (usersError) throw usersError;

      // Fetch all available roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (rolesError) throw rolesError;

      setUsers(usersData || []);
      setRoles(rolesData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      error('Failed to load data', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const assignRole = async (userId: string, roleId: string) => {
    try {
      const { error: assignError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleId,
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (assignError) throw assignError;

      // Refresh data
      await fetchData();
      success('Role assigned', 'Role has been successfully assigned to the user');
    } catch (err) {
      console.error('Error assigning role:', err);
      error('Failed to assign role', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const removeRole = async (userRoleId: string) => {
    try {
      const { error: removeError } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', userRoleId);

      if (removeError) throw removeError;

      // Refresh data
      await fetchData();
      success('Role removed', 'Role has been successfully removed from the user');
    } catch (err) {
      console.error('Error removing role:', err);
      error('Failed to remove role', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-tg-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <UserCheck className="w-6 h-6 text-tg-primary" />
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Assign Roles</h2>
          <p className="text-sm text-gray-600">Manage user role assignments</p>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          icon={Search}
          placeholder="Search users by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
      </Card>

      {/* Users List */}
      <div className="grid gap-6">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-tg-primary rounded-full flex items-center justify-center text-white font-semibold">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {user.full_name || 'No name set'}
                    </h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Current Roles */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Roles:</h4>
                <div className="flex flex-wrap gap-2">
                  {user.user_roles.length > 0 ? (
                    user.user_roles.map((userRole) => (
                      <div
                        key={userRole.id}
                        className="flex items-center gap-2 px-3 py-1 bg-tg-primary/10 text-tg-primary rounded-full text-sm"
                      >
                        <span>{userRole.roles?.name || 'Unknown Role'}</span>
                        <button
                          onClick={() => removeRole(userRole.id)}
                          className="hover:bg-red-100 hover:text-red-600 rounded-full p-1 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500 italic">No roles assigned</span>
                  )}
                </div>
              </div>

              {/* Available Roles */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Available Roles:</h4>
                <div className="flex flex-wrap gap-2">
                  {roles
                    .filter(role => !user.user_roles.some(ur => ur.role_id === role.id))
                    .map((role) => (
                      <button
                        key={role.id}
                        onClick={() => assignRole(user.id, role.id)}
                        className="flex items-center gap-2 px-3 py-1 border border-gray-300 hover:border-tg-primary hover:bg-tg-primary/5 rounded-full text-sm transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{role.name}</span>
                      </button>
                    ))}
                </div>
                {roles.filter(role => !user.user_roles.some(ur => ur.role_id === role.id)).length === 0 && (
                  <span className="text-sm text-gray-500 italic">All available roles assigned</span>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card className="p-8 text-center">
          <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No users found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'No active users available'}
          </p>
        </Card>
      )}
    </div>
  );
};