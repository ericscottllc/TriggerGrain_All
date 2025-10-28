import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Card, Button, Input } from '../../../../components/Shared/SharedComponents';
import { supabase } from '../../../../lib/supabase';
import { useNotifications } from '../../../../contexts/NotificationContext';

interface CropComparison {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const ManageCropComparison: React.FC = () => {
  const [comparisons, setComparisons] = useState<CropComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { success, error } = useNotifications();

  const fetchComparisons = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('master_crop_comparison')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setComparisons(data || []);
    } catch (err) {
      console.error('Error fetching crop comparisons:', err);
      error('Failed to load crop comparisons', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisons();
  }, []);

  const toggleComparisonStatus = async (comparisonId: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('master_crop_comparison')
        .update({ is_active: !currentStatus })
        .eq('id', comparisonId);

      if (updateError) throw updateError;

      setComparisons(prev => prev.map(comparison => 
        comparison.id === comparisonId ? { ...comparison, is_active: !currentStatus } : comparison
      ));

      success('Comparison updated', `Comparison ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Error updating comparison:', err);
      error('Failed to update comparison', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const filteredComparisons = comparisons.filter(comparison =>
    comparison.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (comparison.code && comparison.code.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <GitCompare className="w-6 h-6 text-tg-coral" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Crop Comparison Management</h2>
            <p className="text-sm text-gray-600">{comparisons.length} total comparison categories</p>
          </div>
        </div>
        <Button variant="primary" icon={Plus} size="sm" className="bg-tg-coral hover:bg-tg-coral/90">
          Add Comparison
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          icon={Search}
          placeholder="Search comparisons by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
      </Card>

      {/* Comparisons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredComparisons.map((comparison, index) => (
          <motion.div
            key={comparison.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-tg-coral rounded-lg flex items-center justify-center">
                    <GitCompare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{comparison.name}</h3>
                    {comparison.code && (
                      <p className="text-sm text-gray-600 font-mono">{comparison.code}</p>
                    )}
                  </div>
                </div>
                
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  comparison.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {comparison.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Edit}
                  onClick={() => {
                    // TODO: Implement edit comparison modal
                    console.log('Edit comparison:', comparison.id);
                  }}
                  fullWidth
                >
                  Edit
                </Button>
                
                <Button
                  variant={comparison.is_active ? "danger" : "secondary"}
                  size="sm"
                  icon={comparison.is_active ? Trash2 : Plus}
                  onClick={() => toggleComparisonStatus(comparison.id, comparison.is_active)}
                  fullWidth
                >
                  {comparison.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredComparisons.length === 0 && (
        <Card className="p-8 text-center">
          <GitCompare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No comparisons found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'No crop comparisons have been created yet'}
          </p>
        </Card>
      )}
    </div>
  );
};