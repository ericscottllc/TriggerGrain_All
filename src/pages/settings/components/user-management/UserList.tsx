import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Card, Button, Input } from '../../../../components/Shared/SharedComponents';
import { supabase } from '../../../../lib/supabase';
import { useNotifications } from '../../../../contexts/NotificationContext';

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system_role: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const ManageRoles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { success, error } = useNotifications();

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('roles')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setRoles(data || []);
    } catch (err) {
      console.error('Error fetching roles:', err);
      error('Failed to load roles', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const toggleRoleStatus = async (roleId: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('roles')
        .update({ is_active: !currentStatus })
        .eq('id', roleId);

      if (updateError) throw updateError;

      setRoles(prev => prev.map(role => 
        role.id === roleId ? { ...role, is_active: !currentStatus } : role
      ));

      success('Role updated', `Role ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Error updating role:', err);
      error('Failed to update role', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-tg-primary" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Role Management</h2>
            <p className="text-sm text-gray-600">{roles.length} total roles</p>
          </div>
        </div>
        <Button variant="primary" icon={Plus} size="sm">
          Add Role
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          icon={Search}
          placeholder="Search roles by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
      </Card>

      {/* Roles List */}
      <div className="grid gap-4">
        {filteredRoles.map((role, index) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-tg-primary rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{role.name}</h3>
                      {role.is_system_role && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          System Role
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {role.description || 'No description provided'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    role.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {role.is_active ? 'Active' : 'Inactive'}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit}
                    onClick={() => {
                      // TODO: Implement edit role modal
                      console.log('Edit role:', role.id);
                    }}
                  >
                    Edit
                  </Button>
                  
                  {!role.is_system_role && (
                    <Button
                      variant={role.is_active ? "danger" : "secondary"}
                      size="sm"
                      icon={role.is_active ? Trash2 : Plus}
                      onClick={() => toggleRoleStatus(role.id, role.is_active)}
                    >
                      {role.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <Card className="p-8 text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No roles found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'No roles have been created yet'}
          </p>
        </Card>
      )}
    </div>
  );
};