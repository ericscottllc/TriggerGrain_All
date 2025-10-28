import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Edit, Trash2, Search, Layers, Wheat } from 'lucide-react';
import { Card, Button, Input } from '../../../../components/Shared/SharedComponents';
import { supabase } from '../../../../lib/supabase';
import { useNotifications } from '../../../../contexts/NotificationContext';

interface CropSpec {
  id: string;
  class_id: string;
  protein_percent: number | null;
  moisture_percent: number | null;
  other_specs: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  crop_classes: {
    name: string;
    master_crops: { name: string };
  };
}

export const ManageSpecs: React.FC = () => {
  const [specs, setSpecs] = useState<CropSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { success, error } = useNotifications();

  const fetchSpecs = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('crop_specs')
        .select(`
          *,
          crop_classes (
            name,
            master_crops (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setSpecs(data || []);
    } catch (err) {
      console.error('Error fetching crop specs:', err);
      error('Failed to load crop specifications', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecs();
  }, []);

  const toggleSpecStatus = async (specId: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('crop_specs')
        .update({ is_active: !currentStatus })
        .eq('id', specId);

      if (updateError) throw updateError;

      setSpecs(prev => prev.map(spec => 
        spec.id === specId ? { ...spec, is_active: !currentStatus } : spec
      ));

      success('Specification updated', `Specification ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Error updating spec:', err);
      error('Failed to update specification', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const filteredSpecs = specs.filter(spec =>
    spec.crop_classes.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spec.crop_classes.master_crops.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (spec.protein_percent && spec.protein_percent.toString().includes(searchTerm)) ||
    (spec.moisture_percent && spec.moisture_percent.toString().includes(searchTerm))
  );

  // Group specs by crop and class
  const groupedSpecs = filteredSpecs.reduce((acc, spec) => {
    const cropName = spec.crop_classes.master_crops.name;
    const className = spec.crop_classes.name;
    const key = `${cropName} - ${className}`;
    
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(spec);
    return acc;
  }, {} as Record<string, CropSpec[]>);

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
          <FileText className="w-6 h-6 text-tg-coral" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Crop Specifications</h2>
            <p className="text-sm text-gray-600">{specs.length} total specifications</p>
          </div>
        </div>
        <Button variant="primary" icon={Plus} size="sm" className="bg-tg-coral hover:bg-tg-coral/90">
          Add Specification
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          icon={Search}
          placeholder="Search specifications by crop, class, or values..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
      </Card>

      {/* Specifications List - Grouped by Crop and Class */}
      <div className="space-y-6">
        {Object.entries(groupedSpecs).map(([groupKey, groupSpecs]) => {
          const [cropName, className] = groupKey.split(' - ');
          
          return (
            <div key={groupKey}>
              <div className="flex items-center gap-2 mb-4">
                <Wheat className="w-4 h-4 text-tg-coral" />
                <span className="text-lg font-semibold text-gray-800">{cropName}</span>
                <Layers className="w-4 h-4 text-gray-500" />
                <span className="text-lg font-medium text-gray-700">{className}</span>
                <span className="px-2 py-1 bg-tg-coral/10 text-tg-coral text-xs font-medium rounded-full">
                  {groupSpecs.length} specs
                </span>
              </div>
              
              <div className="grid gap-4">
                {groupSpecs.map((spec, index) => (
                  <motion.div
                    key={spec.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-tg-coral rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700">Protein %</h4>
                              <p className="text-lg font-semibold text-gray-900">
                                {spec.protein_percent ? `${spec.protein_percent}%` : 'Not specified'}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-700">Moisture %</h4>
                              <p className="text-lg font-semibold text-gray-900">
                                {spec.moisture_percent ? `${spec.moisture_percent}%` : 'Not specified'}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-700">Other Specs</h4>
                              <p className="text-sm text-gray-900">
                                {spec.other_specs && Object.keys(spec.other_specs).length > 0 
                                  ? `${Object.keys(spec.other_specs).length} additional specs`
                                  : 'None'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            spec.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {spec.is_active ? 'Active' : 'Inactive'}
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Edit}
                            onClick={() => {
                              // TODO: Implement edit spec modal
                              console.log('Edit spec:', spec.id);
                            }}
                          >
                            Edit
                          </Button>
                          
                          <Button
                            variant={spec.is_active ? "danger" : "secondary"}
                            size="sm"
                            icon={spec.is_active ? Trash2 : Plus}
                            onClick={() => toggleSpecStatus(spec.id, spec.is_active)}
                          >
                            {spec.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Show other specs if they exist */}
                      {spec.other_specs && Object.keys(spec.other_specs).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Additional Specifications:</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {Object.entries(spec.other_specs).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <span className="font-medium text-gray-600">{key}:</span>
                                <span className="ml-1 text-gray-900">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filteredSpecs.length === 0 && (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No specifications found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'No crop specifications have been created yet'}
          </p>
        </Card>
      )}
    </div>
  );
};