import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClientData } from './hooks/useClientData';
import { useNotifications } from '../../contexts/NotificationContext';
import type { ClientStatus } from './types/clientTypes';

export const ClientsPage = () => {
  const navigate = useNavigate();
  const { clients, loading, deleteClient } = useClientData();
  const { success, error: showError } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'All'>('All');

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || client.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete ${clientName}?`)) return;

    try {
      await deleteClient(clientId);
      success('Client deleted', `${clientName} has been removed successfully`);
    } catch (err) {
      showError('Failed to delete client', err instanceof Error ? err.message : 'Unknown error');
    }
  };

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

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-tg-green rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
                <p className="text-sm text-gray-500">
                  Manage your client relationships and pricing analytics
                </p>
              </div>
            </div>
            <button
              onClick={() => {}}
              className="flex items-center gap-2 px-4 py-2 bg-tg-green text-white rounded-lg hover:bg-tg-green/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Client
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ClientStatus | 'All')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green text-sm"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Prospect">Prospect</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Elevators
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Towns
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClients.map((client, index) => (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-tg-green/10 rounded-full flex items-center justify-center mr-3">
                          <Users className="w-4 h-4 text-tg-green" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          {client.contact_email && (
                            <div className="text-xs text-gray-500">{client.contact_email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{client.elevator_count || 0}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{client.town_count || 0}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {new Date(client.updated_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/clients/${client.id}`);
                          }}
                          className="p-1 text-gray-400 hover:text-tg-green transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClient(client.id, client.name);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {filteredClients.length === 0 && (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">No clients found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'All'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first client'}
                </p>
              </div>
            )}
          </div>

          {filteredClients.length > 0 && (
            <div className="mt-4 text-sm text-gray-500 text-center">
              Showing {filteredClients.length} of {clients.length} clients
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
