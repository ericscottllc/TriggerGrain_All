import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Users, MapPin, Wheat } from 'lucide-react';
import { UserManagement } from './components/UserManagement';
import { RegionManagement } from './components/RegionManagement';
import { CropManagement } from './components/CropManagement';

export type SettingsTab = 'users' | 'regions' | 'crops';

interface SettingsTabConfig {
  id: SettingsTab;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  component: React.ComponentType;
}

const settingsTabs: SettingsTabConfig[] = [
  {
    id: 'users',
    title: 'User Management',
    icon: Users,
    description: 'Manage users, roles, and permissions',
    component: UserManagement
  },
  {
    id: 'regions',
    title: 'Region Management',
    icon: MapPin,
    description: 'Manage regions, elevators, and towns',
    component: RegionManagement
  },
  {
    id: 'crops',
    title: 'Crop Management',
    icon: Wheat,
    description: 'Manage crops, classes, and specifications',
    component: CropManagement
  }
];

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('users');

  const activeTabConfig = settingsTabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabConfig?.component || (() => null);

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-tg-grey rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
              <p className="text-sm text-gray-500">Manage system configuration and data</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
            {settingsTabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-tg-grey shadow-sm'
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
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <ActiveComponent />
        </motion.div>
      </div>
    </div>
  );
};