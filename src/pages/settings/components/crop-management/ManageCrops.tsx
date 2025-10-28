import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wheat, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Card, Button, Input } from '../../../../components/Shared/SharedComponents';
import { supabase } from '../../../../lib/supabase';
import { useNotifications } from '../../../../contexts/NotificationContext';

interface Crop {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const ManageCrops: React.FC = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { success, error } = useNotifications();

  const fetchCrops = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('master_crops')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setCrops(data || []);
    } catch (err) {
      console.error('Error fetching crops:', err);
      error('Failed to load crops', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  const toggleCropStatus = async (cropId: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('master_crops')
        .update({ is_active: !currentStatus })
        .eq('id', cropId);

      if (updateError) throw updateError;

      setCrops(prev => prev.map(crop => 
        crop.id === cropId ? { ...crop, is_active: !currentStatus } : crop
      ));

      success('Crop updated', `Crop ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Error updating crop:', err);
      error('Failed to update crop', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const filteredCrops = crops.filter(crop =>
    crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (crop.code && crop.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          <Wheat className="w-6 h-6 text-tg-coral" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Crop Management</h2>
            <p className="text-sm text-gray-600">{crops.length} total crops</p>
          </div>
        </div>
        <Button variant="primary" icon={Plus} size="sm" className="bg-tg-coral hover:bg-tg-coral/90">
          Add Crop
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          icon={Search}
          placeholder="Search crops by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
      </Card>

      {/* Crops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCrops.map((crop, index) => (
          <motion.div
            key={crop.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-tg-coral rounded-lg flex items-center justify-center">
                    <Wheat className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{crop.name}</h3>
                    {crop.code && (
                      <p className="text-sm text-gray-600 font-mono">{crop.code}</p>
                    )}
                  </div>
                </div>
                
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  crop.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {crop.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Edit}
                  onClick={() => {
                    // TODO: Implement edit crop modal
                    console.log('Edit crop:', crop.id);
                  }}
                  fullWidth
                >
                  Edit
                </Button>
                
                <Button
                  variant={crop.is_active ? "danger" : "secondary"}
                  size="sm"
                  icon={crop.is_active ? Trash2 : Plus}
                  onClick={() => toggleCropStatus(crop.id, crop.is_active)}
                  fullWidth
                >
                  {crop.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredCrops.length === 0 && (
        <Card className="p-8 text-center">
          <Wheat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No crops found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'No crops have been created yet'}
          </p>
        </Card>
      )}
    </div>
  );
};