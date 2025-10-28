import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Building2, Map, Network } from 'lucide-react';
import { ManageRegions } from './region-management/ManageRegions';
import { ManageElevators } from './region-management/ManageElevators';
import { ManageTowns } from './region-management/ManageTowns';
import { ManageAssociations } from './region-management/ManageAssociations';

export type RegionManagementTab = 'regions' | 'elevators' | 'towns' | 'associations';

interface RegionManagementTabConfig {
  id: RegionManagementTab;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  component: React.ComponentType;
}

const regionManagementTabs: RegionManagementTabConfig[] = [
  {
    id: 'regions',
    title: 'Regions',
    icon: Map,
    description: 'Manage geographical regions',
    component: ManageRegions
  },
  {
    id: 'elevators',
    title: 'Elevators',
    icon: Building2,
    description: 'Manage grain elevators',
    component: ManageElevators
  },
  {
    id: 'towns',
    title: 'Towns',
    icon: MapPin,
    description: 'Manage towns and locations',
    component: ManageTowns
  },
  {
    id: 'associations',
    title: 'Associations',
    icon: Network,
    description: 'Manage relationships between regions, elevators, towns, and crops',
    component: ManageAssociations
  }
];

export const RegionManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RegionManagementTab>('regions');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const activeTabConfig = regionManagementTabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabConfig?.component || (() => <div>Component not found</div>);
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Compact Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        {regionManagementTabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 flex-1 justify-center ${
                isActive
                  ? 'bg-white text-tg-green shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.title}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div
        key={activeTab}
      >
        <ActiveComponent />
      </div>
    </div>
  );
};