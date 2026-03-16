import { useState, useEffect, useCallback } from 'react';
import { saveReport, submitReport, endDay, getStatus } from '../api/reporting';
import type { WorkdayStatus, BulletItem } from '../api/reporting';
import SlotCard from '../components/SlotCard';

interface ReportingDashboardProps {
  status: WorkdayStatus;
  onStatusUpdate: (status: WorkdayStatus) => void;
  onEndDay: () => void;
  onError: (message: string) => void;
}

function createEmptyBullet(): BulletItem {
  return { text: '', timeFrom: '', timeTo: '' };
}

// Convert old string[] format to BulletItem[] for backward compatibility
function normalizeBullets(bullets: (string | BulletItem)[]): BulletItem[] {
  return bullets.map(b => {
    if (typeof b === 'string') {
      return { text: b, timeFrom: '', timeTo: '' };
    }
    return b;
  });
}

export default function ReportingDashboard({
  status,
  onStatusUpdate,
  onEndDay,
  onError
}: ReportingDashboardProps) {
  const [localReports, setLocalReports] = useState<Record<number, BulletItem[]>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});
  const [endingDay, setEndingDay] = useState(false);
  const [nextUnlock, setNextUnlock] = useState(status.nextUnlockIn);
  const [initialized, setInitialized] = useState(false);

  // Initialize local reports from status - ONLY ONCE
  useEffect(() => {
    if (initialized) return;

    const reports: Record<number, BulletItem[]> = {};
    status.reports.forEach(r => {
      const normalized = normalizeBullets(r.bullets as (string | BulletItem)[]);
      reports[r.slotNumber] = normalized.length > 0 ? normalized : [createEmptyBullet()];
    });
    setLocalReports(reports);
    setInitialized(true);
  }, [status.reports, initialized]);

  // Countdown timer for next unlock
  useEffect(() => {
    if (nextUnlock === null || nextUnlock <= 0) return;

    const interval = setInterval(() => {
      setNextUnlock(prev => {
        if (prev === null || prev <= 1) {
          // Refresh status to get updated slots
          getStatus().then(onStatusUpdate).catch(() => {});
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [nextUnlock, onStatusUpdate]);

  // Auto-save every 30 seconds
  const autoSave = useCallback(async () => {
    for (const slotNumber of status.slotsUnlocked) {
      const report = status.reports.find(r => r.slotNumber === slotNumber);
      if (report?.submitted) continue;

      const bullets = localReports[slotNumber];
      if (!bullets) continue;

      const filteredBullets = bullets.filter(b => b.text.trim());
      if (filteredBullets.length === 0) continue;

      try {
        await saveReport(slotNumber, filteredBullets);
      } catch {
        // Silent fail for auto-save
      }
    }
  }, [localReports, status.slotsUnlocked, status.reports]);

  useEffect(() => {
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [autoSave]);

  const handleBulletsChange = (slotNumber: number, bullets: BulletItem[]) => {
    setLocalReports(prev => ({ ...prev, [slotNumber]: bullets }));
  };

  const handleSave = async (slotNumber: number) => {
    const bullets = localReports[slotNumber]?.filter(b => b.text.trim()) || [];
    setSaving(prev => ({ ...prev, [slotNumber]: true }));

    try {
      await saveReport(slotNumber, bullets);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(prev => ({ ...prev, [slotNumber]: false }));
    }
  };

  const handleSubmit = async (slotNumber: number) => {
    const bullets = localReports[slotNumber]?.filter(b => b.text.trim()) || [];

    if (bullets.length === 0) {
      onError('Please add at least one task before submitting');
      return;
    }

    setSubmitting(prev => ({ ...prev, [slotNumber]: true }));

    try {
      await submitReport(slotNumber, bullets);
      // Refresh status
      const newStatus = await getStatus();
      onStatusUpdate(newStatus);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(prev => ({ ...prev, [slotNumber]: false }));
    }
  };

  const handleEndDay = async () => {
    if (!confirm('Are you sure you want to end your day? This will generate your daily summary.')) {
      return;
    }

    setEndingDay(true);

    try {
      await endDay();
      onEndDay();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to end day');
      setEndingDay(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/New_York'
    });
  };

  const formatCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const today = new Date(status.workday.clockInTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York'
  });

  const allSubmitted = status.reports.every(r => r.submitted);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Blackbow Employee Reporting
          </h1>
          <p className="text-gray-500 mb-4">{today}</p>

          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-gray-600">Clocked In:</span>
              <span className="font-medium">{formatTime(status.workday.clockInTime)} ET</span>
            </span>
          </div>
        </div>

        {/* Report Slots */}
        <div className="space-y-4">
          {[1, 2, 3].map(slotNumber => {
            const report = status.reports.find(r => r.slotNumber === slotNumber);
            const isUnlocked = status.slotsUnlocked.includes(slotNumber);
            const isNextToUnlock = !isUnlocked && slotNumber === status.slotsUnlocked.length + 1;

            return (
              <SlotCard
                key={slotNumber}
                slotNumber={slotNumber}
                bullets={localReports[slotNumber] || [createEmptyBullet()]}
                onBulletsChange={(bullets) => handleBulletsChange(slotNumber, bullets)}
                isUnlocked={isUnlocked}
                isSubmitted={report?.submitted || false}
                isLate={report?.isLate || false}
                submittedAt={report?.submittedAt || null}
                isSaving={saving[slotNumber] || false}
                isSubmitting={submitting[slotNumber] || false}
                onSave={() => handleSave(slotNumber)}
                onSubmit={() => handleSubmit(slotNumber)}
                unlockCountdown={isNextToUnlock && nextUnlock ? formatCountdown(nextUnlock) : null}
              />
            );
          })}
        </div>

        {/* End Day Button */}
        <div className="mt-8">
          <button
            onClick={handleEndDay}
            disabled={endingDay}
            className={`w-full py-4 px-6 rounded-xl font-medium text-lg transition-colors ${
              allSubmitted
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-900 hover:bg-gray-800 text-white'
            } disabled:bg-gray-400 disabled:cursor-not-allowed`}
          >
            {endingDay ? 'Clocking Out...' : 'Clock Out'}
          </button>
          {!allSubmitted && (
            <p className="text-center text-sm text-gray-500 mt-2">
              You can end your day even if some slots are incomplete
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
