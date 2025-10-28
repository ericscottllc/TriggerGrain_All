import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, Plus, Edit, Trash2, Search, Wheat } from 'lucide-react';
import { Card, Button, Input } from '../../../../components/Shared/SharedComponents';
import { supabase } from '../../../../lib/supabase';
import { useNotifications } from '../../../../contexts/NotificationContext';

interface CropClass {
  id: string;
  crop_id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  master_crops: { name: string };
}

export const ManageClasses: React.FC = () => {
  const [classes, setClasses] = useState<CropClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { success, error } = useNotifications();

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('crop_classes')
        .select(`
          *,
          master_crops (name)
        `)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setClasses(data || []);
    } catch (err) {
      console.error('Error fetching crop classes:', err);
      error('Failed to load crop classes', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const toggleClassStatus = async (classId: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('crop_classes')
        .update({ is_active: !currentStatus })
        .eq('id', classId);

      if (updateError) throw updateError;

      setClasses(prev => prev.map(cropClass => 
        cropClass.id === classId ? { ...cropClass, is_active: !currentStatus } : cropClass
      ));

      success('Class updated', `Class ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Error updating class:', err);
      error('Failed to update class', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const filteredClasses = classes.filter(cropClass =>
    cropClass.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cropClass.master_crops.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cropClass.code && cropClass.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cropClass.description && cropClass.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group classes by crop
  const groupedClasses = filteredClasses.reduce((acc, cropClass) => {
    const cropName = cropClass.master_crops.name;
    if (!acc[cropName]) {
      acc[cropName] = [];
    }
    acc[cropName].push(cropClass);
    return acc;
  }, {} as Record<string, CropClass[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-tg-coral border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="w-6 h-6 text-tg-coral" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Crop Class Management</h2>
            <p className="text-sm text-gray-600">{classes.length} total classes</p>
          </div>
        </div>
        <Button variant="primary" icon={Plus} size="sm" className="bg-tg-coral hover:bg-tg-coral/90">
          Add Class
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          icon={Search}
          placeholder="Search classes by name, crop, code, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
      </Card>

      {/* Classes List - Grouped by Crop */}
      <div className="space-y-6">
        {Object.entries(groupedClasses).map(([cropName, cropClasses]) => (
          <div key={cropName}>
            <div className="flex items-center gap-2 mb-4">
              <Wheat className="w-5 h-5 text-tg-coral" />
              <h3 className="text-lg font-semibold text-gray-800">{cropName}</h3>
              <span className="px-2 py-1 bg-tg-coral/10 text-tg-coral text-xs font-medium rounded-full">
                {cropClasses.length} classes
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cropClasses.map((cropClass, index) => (
                <motion.div
                  key={cropClass.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-tg-coral rounded-lg flex items-center justify-center">
                          <Layers className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{cropClass.name}</h4>
                          {cropClass.code && (
                            <p className="text-sm text-gray-600 font-mono">{cropClass.code}</p>
                          )}
                          {cropClass.description && (
                            <p className="text-sm text-gray-600 mt-1">{cropClass.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        cropClass.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {cropClass.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit}
                        onClick={() => {
                          // TODO: Implement edit class modal
                          console.log('Edit class:', cropClass.id);
                        }}
                        fullWidth
                      >
                        Edit
                      </Button>
                      
                      <Button
                        variant={cropClass.is_active ? "danger" : "secondary"}
                        size="sm"
                        icon={cropClass.is_active ? Trash2 : Plus}
                        onClick={() => toggleClassStatus(cropClass.id, cropClass.is_active)}
                        fullWidth
                      >
                        {cropClass.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <Card className="p-8 text-center">
          <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No classes found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'No crop classes have been created yet'}
          </p>
        </Card>
      )}
    </div>
  );
};