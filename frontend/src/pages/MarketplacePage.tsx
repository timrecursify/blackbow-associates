import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { LeadCard } from '../components/LeadCard';
import { DepositModal } from '../components/DepositModal';
import { Filter, RefreshCw } from 'lucide-react';
import { leadsAPI, usersAPI } from '../services/api';

interface Lead {
  id: string;
  weddingDate: string | null;
  location: string;
  budgetMin: number | null;
  budgetMax: number | null;
  servicesNeeded: string[];
  price: number;
  status: string;
}

export const MarketplacePage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    location: '',
    minBudget: '',
    maxBudget: '',
    services: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    fetchLeads();
    fetchBalance();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params: any = {};

      if (filters.location) params.location = filters.location;
      if (filters.minBudget) params.minBudget = parseFloat(filters.minBudget);
      if (filters.maxBudget) params.maxBudget = parseFloat(filters.maxBudget);
      if (filters.services) params.services = filters.services;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const response = await leadsAPI.getLeads(params);
      setLeads(response.data.leads);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await usersAPI.getProfile();
      setBalance(response.data.balance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const handlePurchase = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    // Check if user has sufficient balance
    if (balance < lead.price) {
      setShowDepositModal(true);
      return;
    }

    setPurchasing(leadId);
    try {
      await leadsAPI.purchaseLead(leadId);

      // Refresh leads and balance
      await fetchLeads();
      await fetchBalance();

      alert('Lead purchased successfully! View it in your Account page.');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to purchase lead';
      if (errorMessage.includes('Insufficient funds')) {
        setShowDepositModal(true);
      } else {
        alert(errorMessage);
      }
    } finally {
      setPurchasing(null);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    fetchLeads();
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({
      location: '',
      minBudget: '',
      maxBudget: '',
      services: '',
      dateFrom: '',
      dateTo: '',
    });
    fetchLeads();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-handwritten text-4xl md:text-5xl text-black mb-2">
            Lead Marketplace
          </h1>
          <p className="text-gray-700 text-lg">
            Browse and purchase qualified wedding leads
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-medium"
              >
                <Filter size={18} />
                <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
              </button>
              <button
                onClick={fetchLeads}
                className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
              >
                <RefreshCw size={18} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  placeholder="City or State"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Min Budget
                </label>
                <input
                  type="number"
                  value={filters.minBudget}
                  onChange={(e) => handleFilterChange('minBudget', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Max Budget
                </label>
                <input
                  type="number"
                  value={filters.maxBudget}
                  onChange={(e) => handleFilterChange('maxBudget', e.target.value)}
                  placeholder="100000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Services Needed
                </label>
                <input
                  type="text"
                  value={filters.services}
                  onChange={(e) => handleFilterChange('services', e.target.value)}
                  placeholder="e.g., Photography, Catering"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Wedding Date From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Wedding Date To
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900"
                />
              </div>

              <div className="md:col-span-3 flex gap-2">
                <button
                  onClick={handleApplyFilters}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-bold"
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Leads List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-700 text-lg">Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-700 text-lg">
              No leads available at the moment. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-700 font-medium">
              {leads.length} lead{leads.length !== 1 ? 's' : ''} available
            </p>
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onPurchase={handlePurchase}
                isPurchasing={purchasing === lead.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={() => {
          fetchBalance();
          alert('Funds added successfully!');
        }}
      />
    </div>
  );
};
