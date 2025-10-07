import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Brain as Grain, DollarSign } from 'lucide-react';

export const DashboardPage = () => {
  const stats = [
    { icon: Grain, label: 'Total Entries', value: '0', color: 'bg-tg-green' },
    { icon: DollarSign, label: 'Avg Price', value: '$0.00', color: 'bg-tg-primary' },
    { icon: TrendingUp, label: 'This Month', value: '0', color: 'bg-tg-coral' },
    { icon: BarChart3, label: 'Active Crops', value: '0', color: 'bg-tg-grey' },
  ];

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome to TriggerGrain Management</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className={`${stat.color} p-3 rounded-xl`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
              <div className="text-center py-12 text-gray-400">
                <p>No recent activity</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <p className="font-medium text-gray-800">Add Grain Entry</p>
                  <p className="text-sm text-gray-600">Record new grain price data</p>
                </button>
                <button className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <p className="font-medium text-gray-800">View Analytics</p>
                  <p className="text-sm text-gray-600">Analyze price trends</p>
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
