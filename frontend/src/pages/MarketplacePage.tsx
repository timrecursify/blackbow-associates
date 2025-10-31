import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { DepositModal } from '../components/DepositModal';
import { Search, SlidersHorizontal, List, Grid, Table as TableIcon, ChevronDown, ChevronRight, X } from 'lucide-react';
import { leadsAPI, usersAPI } from '../services/api';
import { format } from 'date-fns';
import { useNavigate, Link } from 'react-router-dom';

interface Lead {
  id: string;
  pipedriveDealId: number | null;
  weddingDate: string | null;
  location: string;
  city: string | null;
  state: string | null;
  servicesNeeded: string[];
  price: number;
  status: string;
  description: string | null;
  ethnicReligious: string | null;
  createdAt: string;
  active: boolean;
}

type ViewMode = 'list' | 'card' | 'table';
type SortOption = 'date' | 'price' | 'location' | 'newest';

export const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [purchasedLeadIds, setPurchasedLeadIds] = useState<Set<string>>(new Set());

  // Filters
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    fetchLeads();
    fetchBalance();
    fetchPurchasedLeads();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [allLeads, searchTerm, sortBy, selectedStates, selectedServices]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await leadsAPI.getLeads({ status: 'AVAILABLE' });
      // Filter only active leads
      const activeLeads = (response.data.leads || []).filter((lead: Lead) => lead.active !== false);
      setAllLeads(activeLeads);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await usersAPI.getProfile();
      const userData = response.data.user || response.data;
      setBalance(userData.balance !== undefined && userData.balance !== null ? userData.balance : 0);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const fetchPurchasedLeads = async () => {
    try {
      const response = await usersAPI.getPurchasedLeads(1, 1000);
      const purchasedIds = new Set((response.data.leads || []).map((lead: any) => lead.leadId));
      setPurchasedLeadIds(purchasedIds);
    } catch (error) {
      console.error('Failed to fetch purchased leads:', error);
    }
  };

  const applyFiltersAndSort = () => {
    let results = [...allLeads];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(lead => 
        lead.location?.toLowerCase().includes(term) ||
        lead.city?.toLowerCase().includes(term) ||
        lead.state?.toLowerCase().includes(term) ||
        lead.description?.toLowerCase().includes(term) ||
        lead.id.toLowerCase().includes(term)
      );
    }

    if (selectedStates.length > 0) {
      results = results.filter(lead => lead.state && selectedStates.includes(lead.state));
    }

    if (selectedServices.length > 0) {
      results = results.filter(lead =>
        selectedServices.some(service => 
          lead.servicesNeeded.some(s => s.toLowerCase().includes(service.toLowerCase()))
        )
      );
    }

    results.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          if (!a.weddingDate) return 1;
          if (!b.weddingDate) return -1;
          return new Date(a.weddingDate).getTime() - new Date(b.weddingDate).getTime();
        case 'price':
          return a.price - b.price;
        case 'location':
          return (a.location || '').localeCompare(b.location || '');
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    setFilteredLeads(results);
  };

  const handleBuyClick = (lead: Lead) => {
    setSelectedLead(lead);
    if (balance < lead.price) {
      setShowDepositModal(true);
    } else {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!selectedLead) return;

    setPurchasing(selectedLead.id);
    setShowConfirmModal(false);

    try {
      await leadsAPI.purchaseLead(selectedLead.id);
      await Promise.all([fetchLeads(), fetchBalance(), fetchPurchasedLeads()]);

      // Navigate to lead details page after successful purchase
      navigate(`/leads/${selectedLead.id}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to purchase lead';
      alert(errorMessage);
      setPurchasing(null);
      setSelectedLead(null);
    }
  };

  const getUniqueStates = () => Array.from(new Set(allLeads.map(l => l.state).filter(Boolean))).sort();
  const getUniqueServices = () => Array.from(new Set(allLeads.flatMap(l => l.servicesNeeded))).sort();

  const formatDate = (date: string | null) => {
    if (!date) return 'TBD';
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch {
      return date;
    }
  };

  const formatDateTime = (date: string) => {
    try {
      return format(new Date(date), 'MMM d, yyyy h:mm a');
    } catch {
      return date;
    }
  };

  // Service tag colors (pastel)
  const getServiceColor = (service: string) => {
    const colors: Record<string, string> = {
      'Photography': 'bg-blue-50 text-blue-700 border-blue-200',
      'Videography': 'bg-purple-50 text-purple-700 border-purple-200',
      'Drone': 'bg-cyan-50 text-cyan-700 border-cyan-200',
      'Multi-Day': 'bg-orange-50 text-orange-700 border-orange-200',
      'RAW': 'bg-pink-50 text-pink-700 border-pink-200',
    };
    for (const [key, color] of Object.entries(colors)) {
      if (service.includes(key)) return color;
    }
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-handwritten text-4xl sm:text-5xl md:text-6xl text-black mb-2">Lead Marketplace</h1>
          <p className="text-sm sm:text-base text-gray-600">Browse and purchase wedding leads</p>
        </div>

        {/* Mobile: Search Bar First */}
        <div className="block sm:hidden mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leads..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base text-black placeholder-gray-400 focus:outline-none focus:border-black focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Toolbar - Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-6">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search leads..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-black placeholder-gray-400 focus:outline-none focus:border-black focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Switcher */}
            <div className="flex items-center gap-1 bg-gray-100 rounded p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 sm:p-2 rounded transition-all ${viewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                title="Table view"
              >
                <TableIcon size={16} className="sm:w-[18px] sm:h-[18px] text-gray-700" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 sm:p-2 rounded transition-all ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                title="List view"
              >
                <List size={16} className="sm:w-[18px] sm:h-[18px] text-gray-700" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 sm:p-2 rounded transition-all ${viewMode === 'card' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                title="Card view"
              >
                <Grid size={16} className="sm:w-[18px] sm:h-[18px] text-gray-700" />
              </button>
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-2 bg-gray-50 border border-gray-200 rounded text-xs sm:text-sm text-black focus:outline-none focus:border-black appearance-none"
              >
                <option value="newest">Newest</option>
                <option value="date">Date</option>
                <option value="price">Price</option>
                <option value="location">Location</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs sm:text-sm text-black hover:bg-gray-100 transition-all"
            >
              <SlidersHorizontal size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>

        {/* Mobile: Controls Row */}
        <div className="block sm:hidden mb-4 pb-4 border-b border-gray-200">
          <div className="flex flex-col gap-3">
            {/* View Switcher - Full width on mobile */}
            <div className="flex items-center gap-1 bg-gray-100 rounded p-1 w-full">
              <button
                onClick={() => setViewMode('table')}
                className={`flex-1 p-2.5 rounded transition-all min-h-[44px] flex items-center justify-center ${viewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                title="Table view"
              >
                <TableIcon size={20} className="text-gray-700" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 p-2.5 rounded transition-all min-h-[44px] flex items-center justify-center ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                title="List view"
              >
                <List size={20} className="text-gray-700" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`flex-1 p-2.5 rounded transition-all min-h-[44px] flex items-center justify-center ${viewMode === 'card' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                title="Card view"
              >
                <Grid size={20} className="text-gray-700" />
              </button>
            </div>

            {/* Sort & Filter - Full width on mobile */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded text-sm text-black focus:outline-none focus:border-black appearance-none min-h-[44px]"
                >
                  <option value="newest">Newest</option>
                  <option value="date">Date</option>
                  <option value="price">Price</option>
                  <option value="location">Location</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded text-sm text-black hover:bg-gray-100 transition-all min-h-[44px] whitespace-nowrap"
              >
                <SlidersHorizontal size={18} />
                <span>Filter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-4 sm:mb-6 p-5 sm:p-5 bg-gray-50 border border-gray-200 rounded-lg overflow-x-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 min-w-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">State</p>
                <div className="flex flex-wrap gap-2">
                  {getUniqueStates().map(state => (
                    <button
                      key={state}
                      onClick={() => setSelectedStates(prev =>
                        prev.includes(state!) ? prev.filter(s => s !== state) : [...prev, state!]
                      )}
                      className={`px-3 py-2 text-sm font-medium border rounded transition-all whitespace-nowrap min-h-[40px] ${
                        selectedStates.includes(state!)
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Services</p>
                <div className="flex flex-wrap gap-2">
                  {getUniqueServices().map(service => (
                    <button
                      key={service}
                      onClick={() => setSelectedServices(prev =>
                        prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
                      )}
                      className={`px-3 py-2 text-sm font-medium border rounded transition-all whitespace-nowrap min-h-[40px] ${
                        selectedServices.includes(service)
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
          {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
        </div>

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="border border-gray-200 rounded overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20 sm:w-24 hidden sm:table-cell">ID</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Wedding Date</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">Submitted</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Location</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Services</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-20 sm:w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeads.map((lead) => (
                  <React.Fragment key={lead.id}>
                    <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-gray-500 font-mono hidden sm:table-cell">
                        {lead.id.substring(0, 8)}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-black whitespace-nowrap">{formatDate(lead.weddingDate)}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-gray-600 hidden sm:table-cell">{formatDate(lead.createdAt)}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <div className="text-xs sm:text-sm text-black">{lead.city || lead.location}</div>
                        {lead.state && <div className="text-xs text-gray-500">{lead.state}</div>}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <div className="flex flex-wrap gap-1">
                          {lead.servicesNeeded.slice(0, 2).map((service, i) => (
                            <span key={i} className={`px-1.5 sm:px-2 py-0.5 text-xs font-medium border rounded ${getServiceColor(service)}`}>
                              {service}
                            </span>
                          ))}
                          {lead.servicesNeeded.length > 2 && (
                            <span className="px-1.5 sm:px-2 py-0.5 text-xs text-gray-500">+{lead.servicesNeeded.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-black">${lead.price.toFixed(2)}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-right">
                        {purchasing === lead.id ? (
                          <button
                            disabled
                            className="px-3 sm:px-4 py-1 sm:py-1.5 bg-gray-400 text-white text-xs sm:text-sm font-medium rounded disabled:bg-gray-400 whitespace-nowrap"
                          >
                            Buying...
                          </button>
                        ) : purchasedLeadIds.has(lead.id) ? (
                          <Link
                            to={`/leads/${lead.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 bg-green-600 text-white text-xs sm:text-sm font-medium rounded hover:bg-green-700 transition-colors whitespace-nowrap"
                          >
                            View Details
                          </Link>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuyClick(lead);
                            }}
                            className="px-3 sm:px-4 py-1 sm:py-1.5 bg-black text-white text-xs sm:text-sm font-medium rounded hover:bg-gray-800 transition-colors whitespace-nowrap"
                          >
                            Buy
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedLead === lead.id && lead.description && (
                      <tr>
                        <td colSpan={7} className="px-3 sm:px-4 py-3 sm:py-4 bg-gray-50 border-t border-gray-200">
                          <div className="flex items-start gap-2">
                            <ChevronRight size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Package Description</p>
                              <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">{lead.description}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* List and Card views remain similar but simplified */}
        {viewMode === 'list' && (
          <div className="space-y-2">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="p-3 sm:p-4 bg-white border border-gray-200 rounded hover:border-gray-400 transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-1 min-w-0">
                    <div className="text-xs text-gray-500 font-mono">{lead.id.substring(0, 8)}</div>
                    <div className="text-xs sm:text-sm font-medium text-black">{formatDate(lead.weddingDate)}</div>
                    <div className="text-xs sm:text-sm text-black truncate">{lead.city || lead.location}</div>
                    <div className="flex flex-wrap gap-1">
                      {lead.servicesNeeded.map((service, i) => (
                        <span key={i} className={`px-1.5 sm:px-2 py-0.5 text-xs font-medium border rounded ${getServiceColor(service)}`}>
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <span className="text-sm font-semibold text-black">${lead.price.toFixed(2)}</span>
                    {purchasing === lead.id ? (
                      <button
                        disabled
                        className="px-3 sm:px-4 py-1.5 bg-gray-400 text-white text-xs sm:text-sm font-medium rounded disabled:bg-gray-400 whitespace-nowrap"
                      >
                        Buying...
                      </button>
                    ) : purchasedLeadIds.has(lead.id) ? (
                      <Link
                        to={`/leads/${lead.id}`}
                        className="px-3 sm:px-4 py-1.5 bg-green-600 text-white text-xs sm:text-sm font-medium rounded hover:bg-green-700 transition-colors whitespace-nowrap"
                      >
                        View Details
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleBuyClick(lead)}
                        className="px-3 sm:px-4 py-1.5 bg-black text-white text-xs sm:text-sm font-medium rounded hover:bg-gray-800 transition-colors whitespace-nowrap"
                      >
                        Buy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'card' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="p-3 sm:p-4 bg-white border border-gray-200 rounded hover:border-gray-400 transition-all">
                <div className="text-xs text-gray-500 font-mono mb-2">{lead.id.substring(0, 8)}</div>
                <div className="text-sm font-medium text-black mb-1">{formatDate(lead.weddingDate)}</div>
                <div className="text-xs sm:text-sm text-black mb-2">{lead.city || lead.location}</div>
                <div className="mb-3 flex flex-wrap gap-1">
                  {lead.servicesNeeded.map((service, i) => (
                    <span key={i} className={`px-1.5 sm:px-2 py-0.5 text-xs font-medium border rounded ${getServiceColor(service)}`}>
                      {service}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-sm font-semibold text-black">${lead.price.toFixed(2)}</span>
                  {purchasing === lead.id ? (
                    <button
                      disabled
                      className="px-3 py-1.5 bg-gray-400 text-white text-xs sm:text-sm font-medium rounded disabled:bg-gray-400"
                    >
                      Buying...
                    </button>
                  ) : purchasedLeadIds.has(lead.id) ? (
                    <Link
                      to={`/leads/${lead.id}`}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs sm:text-sm font-medium rounded hover:bg-green-700 transition-colors"
                    >
                      View Details
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleBuyClick(lead)}
                      className="px-3 py-1.5 bg-black text-white text-xs sm:text-sm font-medium rounded hover:bg-gray-800 transition-colors"
                    >
                      Buy
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredLeads.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            No leads found matching your criteria.
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 sm:p-6 max-w-md w-full mx-4">
            <h3 className="text-lg sm:text-xl font-bold text-black mb-4">Confirm Purchase</h3>
            <div className="mb-6">
              <p className="text-sm sm:text-base text-gray-700 mb-4">
                Are you sure you want to purchase this lead for <span className="font-bold">${selectedLead.price.toFixed(2)}</span>?
              </p>
              <div className="p-3 sm:p-4 bg-gray-50 rounded border border-gray-200 space-y-2 text-xs sm:text-sm">
                <div><span className="text-gray-600">Wedding Date:</span> <span className="font-medium text-black">{formatDate(selectedLead.weddingDate)}</span></div>
                <div><span className="text-gray-600">Location:</span> <span className="font-medium text-black">{selectedLead.location}</span></div>
                <div><span className="text-gray-600">Services:</span> <span className="font-medium text-black">{selectedLead.servicesNeeded.join(', ')}</span></div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-4">
                After purchase, you can view this lead in your <button onClick={() => { setShowConfirmModal(false); navigate('/account'); window.history.replaceState(null, '', '/account?tab=leads'); }} className="text-black font-medium underline">Account page</button>.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedLead(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded font-medium hover:bg-gray-200 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPurchase}
                className="flex-1 px-4 py-2 bg-black text-white rounded font-medium hover:bg-gray-800 transition-colors text-sm sm:text-base"
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}

      <DepositModal
        isOpen={showDepositModal}
        onClose={() => {
          setShowDepositModal(false);
          setSelectedLead(null);
        }}
        onSuccess={fetchBalance}
      />
    </div>
  );
};
