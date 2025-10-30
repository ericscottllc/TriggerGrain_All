import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Brain as Grain, DollarSign, Plus, LineChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from './hooks/useDashboardData';
import { PriceTrendCard } from './components/PriceTrendCard';
import { ElevatorPerformanceTable } from './components/ElevatorPerformanceTable';
import { DeliveryMonthTrendChart } from './components/DeliveryMonthTrendChart';
import { LoadingSpinner } from '../../components/Core/LoadingSpinner';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const {
    stats,
    priceTrends,
    topElevators,
    bottomElevators,
    deliveryMonthTrends,
    loading,
    error
  } = useDashboardData();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Error loading dashboard</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const statItems = [
    {
      icon: Grain,
      label: 'Total Entries',
      value: stats?.totalEntries.toLocaleString() || '0',
      color: 'bg-tg-green'
    },
    {
      icon: DollarSign,
      label: 'Avg Price (30d)',
      value: `$${stats?.avgPrice.toFixed(2) || '0.00'}`,
      color: 'bg-tg-primary'
    },
    {
      icon: TrendingUp,
      label: 'Recent (30d)',
      value: stats?.recentEntries.toLocaleString() || '0',
      color: 'bg-tg-coral'
    },
    {
      icon: BarChart3,
      label: 'Active Crops',
      value: stats?.activeCropClasses.toString() || '0',
      color: 'bg-tg-grey'
    },
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
              <p className="text-gray-600 mt-1">Welcome to Trigger Grain</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statItems.map((stat, index) => (
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

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">30-Day Price Trends by Crop Class</h2>
            {priceTrends.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                <p className="text-gray-400">No price trend data available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {priceTrends.map((trend, index) => (
                  <PriceTrendCard key={trend.cropClassId} trend={trend} index={index} />
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ElevatorPerformanceTable elevators={topElevators} type="top" />
            <ElevatorPerformanceTable elevators={bottomElevators} type="bottom" />
          </div>

          <div className="mb-8">
            <DeliveryMonthTrendChart trends={deliveryMonthTrends} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/grain-entries')}
                  className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-tg-green hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Plus className="w-5 h-5 text-tg-green group-hover:text-white" />
                    <div>
                      <p className="font-medium text-gray-800 group-hover:text-white">Add Grain Entry</p>
                      <p className="text-sm text-gray-600 group-hover:text-white">Record new grain price data</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/analytics')}
                  className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-tg-primary hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <LineChart className="w-5 h-5 text-tg-primary group-hover:text-white" />
                    <div>
                      <p className="font-medium text-gray-800 group-hover:text-white">View Analytics</p>
                      <p className="text-sm text-gray-600 group-hover:text-white">Analyze price trends</p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-gradient-to-br from-tg-primary to-tg-green rounded-2xl p-6 shadow-sm text-white"
            >
              <h2 className="text-xl font-semibold mb-4">System Overview</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <span className="text-sm font-medium">Total Entries</span>
                  <span className="text-lg font-bold">{stats?.totalEntries.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <span className="text-sm font-medium">Active Crop Classes</span>
                  <span className="text-lg font-bold">{stats?.activeCropClasses}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <span className="text-sm font-medium">30-Day Activity</span>
                  <span className="text-lg font-bold">{stats?.recentEntries.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
