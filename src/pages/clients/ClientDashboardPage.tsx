import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ArrowLeft, Edit, Building2, MapPin, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { useClientDetails } from './hooks/useClientDetails';
import { useClientPricing } from './hooks/useClientPricing';
import type { ClientStatus } from './types/clientTypes';

export const ClientDashboardPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { client, stats, loading } = useClientDetails(clientId);
  const { pricingData, loading: pricingLoading, fetchClientPricing } = useClientPricing(clientId);
  const [showPricing, setShowPricing] = useState(false);
  const [showElevators, setShowElevators] = useState(true);
  const [showTowns, setShowTowns] = useState(true);

  React.useEffect(() => {
    if (clientId && showPricing) {
      fetchClientPricing({ dateRange: '30days', sortBy: 'date', sortOrder: 'desc' });
    }
  }, [clientId, showPricing, fetchClientPricing]);

  const getStatusColor = (status: ClientStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      case 'Prospect':
        return 'bg-blue-100 text-blue-800';
      case 'Archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-tg-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Client not found</h2>
          <p className="text-gray-600 mb-4">The client you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/clients')}
            className="px-4 py-2 bg-tg-green text-white rounded-lg hover:bg-tg-green/90 transition-colors"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/clients')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Clients
          </button>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-tg-green rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{client.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
                    {client.status}
                  </span>
                  {client.contact_email && (
                    <span className="text-sm text-gray-500">{client.contact_email}</span>
                  )}
                  {client.contact_phone && (
                    <span className="text-sm text-gray-500">{client.contact_phone}</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => {}}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Client
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Elevators</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{stats?.total_elevators || 0}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Towns</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{stats?.total_towns || 0}</p>
                </div>
                <MapPin className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Pricing Entries</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">{pricingData.length}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Last Updated</p>
                  <p className="text-sm font-medium text-orange-900 mt-1">
                    {new Date(client.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setShowElevators(!showElevators)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-tg-green" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    Associated Elevators ({client.elevator_count || 0})
                  </h2>
                </div>
                {showElevators ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>
              {showElevators && (
                <div className="p-4 border-t border-gray-200">
                  {client.client_elevators && client.client_elevators.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {client.client_elevators
                        .filter(ce => ce.is_active)
                        .map(ce => (
                          <div
                            key={ce.id}
                            className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                          >
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">
                              {ce.master_elevators?.name}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No elevators associated</p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setShowTowns(!showTowns)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-tg-green" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    Associated Towns ({client.town_count || 0})
                  </h2>
                </div>
                {showTowns ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>
              {showTowns && (
                <div className="p-4 border-t border-gray-200">
                  {client.client_towns && client.client_towns.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {client.client_towns
                        .filter(ct => ct.is_active)
                        .map(ct => (
                          <div
                            key={ct.id}
                            className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                          >
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-900">
                              {ct.master_towns?.name}
                              {ct.master_towns?.province && `, ${ct.master_towns.province}`}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No towns associated</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowPricing(!showPricing)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-tg-green" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Pricing Analytics (Last 30 Days)
                </h2>
              </div>
              {showPricing ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {showPricing && (
              <div className="p-4 border-t border-gray-200">
                {pricingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-tg-green border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : pricingData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Crop</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Elevator</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Town</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cash Price</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Futures</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Basis</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {pricingData.slice(0, 20).map((entry, index) => (
                          <motion.tr
                            key={entry.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2, delay: index * 0.02 }}
                          >
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(entry.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {entry.master_crops?.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {entry.crop_classes?.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {entry.master_elevators?.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {entry.master_towns?.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                              {entry.cash_price ? `$${entry.cash_price.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              {entry.futures ? `$${entry.futures.toFixed(2)}` : '-'}
                            </td>
                            <td className={`px-4 py-3 text-sm text-right font-medium ${
                              entry.basis && entry.basis > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {entry.basis ? `$${entry.basis.toFixed(2)}` : '-'}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                    {pricingData.length > 20 && (
                      <div className="mt-4 text-sm text-gray-500 text-center">
                        Showing 20 of {pricingData.length} entries
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No pricing data available for this client's associations
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
