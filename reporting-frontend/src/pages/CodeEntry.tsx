import { useState } from 'react';
import type { FormEvent } from 'react';
import { clockIn, getStatus } from '../api/reporting';
import type { WorkdayStatus } from '../api/reporting';

interface CodeEntryProps {
  onClockIn: (status: WorkdayStatus) => void;
  onDayAlreadyCompleted: () => void;
  onError: (message: string) => void;
}

export default function CodeEntry({ onClockIn, onDayAlreadyCompleted, onError }: CodeEntryProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      onError('Please enter a code');
      return;
    }

    setLoading(true);

    try {
      await clockIn(code.trim().toUpperCase());
      // Fetch full status after clock-in
      const status = await getStatus();
      onClockIn(status);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clock in';
      
      // Check if day was already completed
      if (message.toLowerCase().includes('day already completed')) {
        onDayAlreadyCompleted();
      } else {
        onError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Blackbow Employee Reporting
          </h1>
          <p className="text-gray-500">{today}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Enter your daily code
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={6}
              className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none uppercase"
              autoComplete="off"
              autoFocus
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Clocking In...' : 'Clock In & Start Reporting'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Check your email for today's code
        </p>
      </div>
    </div>
  );
}
