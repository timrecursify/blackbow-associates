import React, { useState, useEffect } from 'react';
import { Bell, Mail, Check, X } from 'lucide-react';
import { usersAPI } from '../../services/api';
import Notification from '../../components/Notification';
import { logger } from '../../utils/logger';

interface NotificationPreferences {
  states: string[];
  frequency: 'INSTANT' | 'DAILY' | 'WEEKLY';
  enabled: boolean;
}

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'Washington DC' }
];

export const NotificationsTab: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    states: [],
    frequency: 'INSTANT',
    enabled: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getNotificationPreferences();
      if (response.data?.preferences) {
        setPreferences(response.data.preferences);
      }
    } catch (error) {
      logger.error('Failed to fetch notification preferences:', error);
      setNotification({ message: 'Failed to load notification settings', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await usersAPI.updateNotificationPreferences(preferences);
      setNotification({ message: 'Notification settings saved successfully', type: 'success' });
    } catch (error: any) {
      logger.error('Failed to save notification preferences:', error);
      setNotification({ message: error.response?.data?.message || 'Failed to save settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const toggleState = (stateCode: string) => {
    setPreferences(prev => ({
      ...prev,
      states: prev.states.includes(stateCode)
        ? prev.states.filter(s => s !== stateCode)
        : [...prev.states, stateCode]
    }));
  };

  const selectAllStates = () => {
    setPreferences(prev => ({
      ...prev,
      states: US_STATES.map(s => s.code)
    }));
  };

  const clearAllStates = () => {
    setPreferences(prev => ({
      ...prev,
      states: []
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading notification settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Bell className="w-6 h-6 text-gray-700" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-black">Email Notifications</h2>
          <p className="text-sm text-gray-600">Get notified when new leads match your preferences</p>
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium text-black">Enable Lead Notifications</p>
              <p className="text-sm text-gray-500">Receive email alerts for new leads in your selected states</p>
            </div>
          </div>
          <button
            onClick={() => setPreferences(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.enabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {preferences.enabled && (
        <>
          {/* Frequency Selector */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
            <h3 className="font-medium text-black mb-4">Notification Frequency</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'INSTANT', label: 'Instant', desc: 'Get notified immediately when a lead arrives' },
                { value: 'DAILY', label: 'Daily Digest', desc: 'Receive a daily summary of new leads' },
                { value: 'WEEKLY', label: 'Weekly Digest', desc: 'Receive a weekly summary of new leads' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setPreferences(prev => ({ ...prev, frequency: option.value as any }))}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    preferences.frequency === option.value
                      ? 'border-black bg-gray-50 ring-1 ring-black'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-black">{option.label}</span>
                    {preferences.frequency === option.value && (
                      <Check className="w-4 h-4 text-black" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* State Selector */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-medium text-black">Select States</h3>
                <p className="text-sm text-gray-500">
                  {preferences.states.length === 0
                    ? 'No states selected'
                    : `${preferences.states.length} state${preferences.states.length > 1 ? 's' : ''} selected`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={selectAllStates}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={clearAllStates}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {US_STATES.map(state => (
                <button
                  key={state.code}
                  onClick={() => toggleState(state.code)}
                  className={`px-3 py-2 text-sm font-medium rounded border transition-all ${
                    preferences.states.includes(state.code)
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                  title={state.name}
                >
                  {state.code}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>How it works:</strong> When a new lead is posted in one of your selected states,
          you'll receive an email notification based on your chosen frequency. This helps you stay
          ahead of the competition and respond to leads quickly.
        </p>
      </div>

      <Notification
        message={notification?.message || ''}
        type={notification?.type || 'info'}
        isOpen={!!notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
};

export default NotificationsTab;
