import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wheat, Layers, FileText, GitCompare } from 'lucide-react';
import { Card } from '../../../components/Shared/SharedComponents';
import { ManageCrops } from './crop-management/ManageCrops';
import { ManageClasses } from './crop-management/ManageClasses';
import { ManageSpecs } from './crop-management/ManageSpecs';
import { ManageCropComparison } from './crop-management/ManageCropComparison';

export type CropManagementTab = 'crops' | 'classes' | 'specs' | 'comparison';

interface CropManagementTabConfig {
  id: CropManagementTab;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  component: React.ComponentType;
}

const cropManagementTabs: CropManagementTabConfig[] = [
  {
    id: 'crops',
    title: 'Crops',
    icon: Wheat,
    description: 'Manage master crop types',
    component: ManageCrops
  },
  {
    id: 'classes',
    title: 'Classes',
    icon: Layers,
    description: 'Manage crop classes and grades',
    component: ManageClasses
  },
  {
    id: 'specs',
    title: 'Specifications',
    icon: FileText,
    description: 'Manage crop specifications and quality metrics',
    component: ManageSpecs
  },
  {
    id: 'comparison',
    title: 'Crop Comparison',
    icon: GitCompare,
    description: 'Manage crop comparison categories',
    component: ManageCropComparison
  }
];

export const CropManagement: React.FC = () => {
  const [activeTab, setCropTab] = useState<CropManagementTab>('crops');

  const activeTabConfig = cropManagementTabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabConfig?.component || (() => null);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Sub-tab Navigation */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {cropManagementTabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => setCropTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-tg-coral text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.title}</span>
              </motion.button>
            );
          })}
        </div>
        
        {activeTabConfig && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">{activeTabConfig.description}</p>
          </div>
        )}
      </Card>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ActiveComponent />
      </motion.div>
    </div>
  );
};