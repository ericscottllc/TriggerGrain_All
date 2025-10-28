import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Plus, Edit, Trash2, Search, Tag } from 'lucide-react';
import { Card, Button, Input } from '../../../../components/Shared/SharedComponents';
import { supabase } from '../../../../lib/supabase';
import { useNotifications } from '../../../../contexts/NotificationContext';

interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const ManagePermissions: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { success, error } = useNotifications();

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('permissions')
        .select('*')
        .order('resource', { ascending: true });

      if (fetchError) throw fetchError;
      setPermissions(data || []);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      error('Failed to load permissions', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const togglePermissionStatus = async (permissionId: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('permissions')
        .update({ is_active: !currentStatus })
        .eq('id', permissionId);

      if (updateError) throw updateError;

      setPermissions(prev => prev.map(permission => 
        permission.id === permissionId ? { ...permission, is_active: !currentStatus } : permission
      ));

      success('Permission updated', `Permission ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Error updating permission:', err);
      error('Failed to update permission', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const filteredPermissions = permissions.filter(permission =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (permission.description && permission.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group permissions by resource
  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

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
          <Key className="w-6 h-6 text-tg-primary" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Permission Management</h2>
            <p className="text-sm text-gray-600">{permissions.length} total permissions</p>
          </div>
        </div>
        <Button variant="primary" icon={Plus} size="sm">
          Add Permission
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          icon={Search}
          placeholder="Search permissions by name, resource, or action..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
      </Card>

      {/* Permissions List - Grouped by Resource */}
      <div className="space-y-6">
        {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
          <div key={resource}>
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-tg-coral" />
              <h3 className="text-lg font-semibold text-gray-800 capitalize">{resource}</h3>
              <span className="px-2 py-1 bg-tg-coral/10 text-tg-coral text-xs font-medium rounded-full">
                {resourcePermissions.length} permissions
              </span>
            </div>
            
            <div className="grid gap-3">
              {resourcePermissions.map((permission, index) => (
                <motion.div
                  key={permission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-tg-coral rounded-lg flex items-center justify-center">
                          <Key className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{permission.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                              {permission.resource}.{permission.action}
                            </span>
                          </div>
                          {permission.description && (
                            <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          permission.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {permission.is_active ? 'Active' : 'Inactive'}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit}
                          onClick={() => {
                            // TODO: Implement edit permission modal
                            console.log('Edit permission:', permission.id);
                          }}
                        >
                          Edit
                        </Button>
                        
                        <Button
                          variant={permission.is_active ? "danger" : "secondary"}
                          size="sm"
                          icon={permission.is_active ? Trash2 : Plus}
                          onClick={() => togglePermissionStatus(permission.id, permission.is_active)}
                        >
                          {permission.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredPermissions.length === 0 && (
        <Card className="p-8 text-center">
          <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No permissions found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'No permissions have been created yet'}
          </p>
        </Card>
      )}
    </div>
  );
};