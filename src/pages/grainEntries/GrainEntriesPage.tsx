import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain as Grain, Plus, Eye } from 'lucide-react';
import { NewEntriesTab } from './components/NewEntriesTab';
import { ViewEntriesTab } from './components/ViewEntriesTab';

export type GrainEntriesTab = 'new' | 'view';

export const GrainEntriesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GrainEntriesTab>('new');

  const tabs = [
    {
      id: 'new' as const,
      title: 'New Entries',
      icon: Plus,
      description: 'Enter daily grain data'
    },
    {
      id: 'view' as const,
      title: 'View Entries',
      icon: Eye,
      description: 'View historical data'
    }
  ];

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-tg-green rounded-xl flex items-center justify-center">
              <Grain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Grain Entries</h1>
              <p className="text-sm text-gray-500">Manage your daily grain data and pricing</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
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
          {activeTab === 'new' && <NewEntriesTab />}
          {activeTab === 'view' && <ViewEntriesTab />}
        </motion.div>
      </div>
    </div>
  );
};