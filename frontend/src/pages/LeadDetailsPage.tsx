import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Calendar, MapPin, DollarSign, Mail, Phone, User, Briefcase, ArrowLeft } from 'lucide-react';
import { leadsAPI } from '../services/api';
import { format } from 'date-fns';

interface Lead {
  id: string;
  weddingDate: string | null;
  location: string;
  budgetMin: number | null;
  budgetMax: number | null;
  servicesNeeded: string[];
  price: number;
  status: string;
  fullInfo: any;
  maskedInfo: any;
}

export const LeadDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchLead(id);
    }
  }, [id]);

  const fetchLead = async (leadId: string) => {
    try {
      setLoading(true);
      const response = await leadsAPI.getLead(leadId);
      setLead(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch lead details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-700 text-lg">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
            <p className="text-red-800 text-lg mb-4">{error || 'Lead not found'}</p>
            <Link
              to="/account"
              className="inline-flex items-center space-x-2 text-black hover:text-gray-700 font-medium"
            >
              <ArrowLeft size={18} />
              <span>Back to Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const info = lead.fullInfo || lead.maskedInfo || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/account"
          className="inline-flex items-center space-x-2 text-gray-700 hover:text-black font-medium mb-6"
        >
          <ArrowLeft size={18} />
          <span>Back to My Leads</span>
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-handwritten text-4xl md:text-5xl text-black mb-2">Lead Details</h1>
          {lead.status === 'SOLD' ? (
            <p className="text-gray-700 text-lg">Full contact information revealed</p>
          ) : (
            <p className="text-gray-700 text-lg">Preview information (purchase to see full details)</p>
          )}
        </div>

        {/* Lead Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <Calendar size={20} className="text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600 font-medium">Wedding Date</p>
                <p className="text-lg text-gray-900 font-bold">
                  {lead.weddingDate ? format(new Date(lead.weddingDate), 'MMMM dd, yyyy') : 'TBD'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin size={20} className="text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600 font-medium">Location</p>
                <p className="text-lg text-gray-900 font-bold">{lead.location}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <DollarSign size={20} className="text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600 font-medium">Budget</p>
                <p className="text-lg text-gray-900 font-bold">
                  {lead.budgetMin && lead.budgetMax
                    ? `$${lead.budgetMin.toLocaleString()} - $${lead.budgetMax.toLocaleString()}`
                    : 'Not specified'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Briefcase size={20} className="text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600 font-medium">Services Needed</p>
                <p className="text-lg text-gray-900 font-bold">
                  {lead.servicesNeeded.join(', ') || 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information (if purchased) */}
          {lead.status === 'SOLD' && lead.fullInfo && (
            <>
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {info.coupleName && (
                    <div className="flex items-start space-x-3">
                      <User size={20} className="text-gray-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Couple</p>
                        <p className="text-lg text-gray-900 font-bold">{info.coupleName}</p>
                      </div>
                    </div>
                  )}

                  {info.email && (
                    <div className="flex items-start space-x-3">
                      <Mail size={20} className="text-gray-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Email</p>
                        <a
                          href={`mailto:${info.email}`}
                          className="text-lg text-blue-600 hover:text-blue-800 font-bold"
                        >
                          {info.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {info.phone && (
                    <div className="flex items-start space-x-3">
                      <Phone size={20} className="text-gray-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Phone</p>
                        <a
                          href={`tel:${info.phone}`}
                          className="text-lg text-blue-600 hover:text-blue-800 font-bold"
                        >
                          {info.phone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Details */}
              {info.notes && (
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Additional Notes</h2>
                  <p className="text-gray-800 whitespace-pre-wrap">{info.notes}</p>
                </div>
              )}
            </>
          )}

          {/* Not Purchased Notice */}
          {lead.status !== 'SOLD' && (
            <div className="border-t border-gray-200 pt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-blue-900 font-medium mb-3">
                  Purchase this lead to see full contact information
                </p>
                <Link
                  to="/marketplace"
                  className="inline-block bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 font-bold"
                >
                  Go to Marketplace
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
