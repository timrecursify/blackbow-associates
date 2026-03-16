import type { KeyboardEvent } from 'react';
import type { BulletItem } from '../api/reporting';

interface SlotCardProps {
  slotNumber: number;
  bullets: BulletItem[];
  onBulletsChange: (bullets: BulletItem[]) => void;
  isUnlocked: boolean;
  isSubmitted: boolean;
  isLate: boolean;
  submittedAt: string | null;
  isSaving: boolean;
  isSubmitting: boolean;
  onSave: () => void;
  onSubmit: () => void;
  unlockCountdown: string | null;
}

function createEmptyBullet(): BulletItem {
  return { text: '', timeFrom: '', timeTo: '' };
}

export default function SlotCard({
  slotNumber,
  bullets,
  onBulletsChange,
  isUnlocked,
  isSubmitted,
  isLate,
  submittedAt,
  isSaving,
  isSubmitting,
  onSave,
  onSubmit,
  unlockCountdown
}: SlotCardProps) {
  const handleTextChange = (index: number, value: string) => {
    const newBullets = [...bullets];
    newBullets[index] = { ...newBullets[index], text: value };
    onBulletsChange(newBullets);
  };

  const handleTimeChange = (index: number, field: 'timeFrom' | 'timeTo', value: string) => {
    const newBullets = [...bullets];
    newBullets[index] = { ...newBullets[index], [field]: value };
    onBulletsChange(newBullets);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newBullets = [...bullets];
      newBullets.splice(index + 1, 0, createEmptyBullet());
      onBulletsChange(newBullets);
      setTimeout(() => {
        const inputs = document.querySelectorAll(`[data-slot="${slotNumber}"] input[data-field="text"]`);
        (inputs[index + 1] as HTMLInputElement)?.focus();
      }, 0);
    } else if (e.key === 'Backspace' && bullets[index].text === '' && bullets.length > 1) {
      e.preventDefault();
      const newBullets = bullets.filter((_, i) => i !== index);
      onBulletsChange(newBullets);
      setTimeout(() => {
        const inputs = document.querySelectorAll(`[data-slot="${slotNumber}"] input[data-field="text"]`);
        (inputs[Math.max(0, index - 1)] as HTMLInputElement)?.focus();
      }, 0);
    }
  };

  const addBullet = () => {
    onBulletsChange([...bullets, createEmptyBullet()]);
  };

  const removeBullet = (index: number) => {
    if (bullets.length <= 1) return;
    onBulletsChange(bullets.filter((_, i) => i !== index));
  };

  const formatSubmittedAt = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/New_York'
    });
  };

  const formatTimeDisplay = (timeFrom: string, timeTo: string) => {
    if (timeFrom && timeTo) return `${timeFrom} - ${timeTo}`;
    if (timeFrom) return `${timeFrom} -`;
    if (timeTo) return `- ${timeTo}`;
    return '';
  };

  // Locked state
  if (!isUnlocked) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 opacity-60">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Slot {slotNumber}</h2>
          <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded-full">
            Locked
          </span>
        </div>
        {unlockCountdown && (
          <p className="text-gray-500 text-sm">
            Unlocks in: <span className="font-medium">{unlockCountdown}</span>
          </p>
        )}
      </div>
    );
  }

  // Submitted state
  if (isSubmitted) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-2 border-green-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Slot {slotNumber}</h2>
          <div className="flex items-center gap-2">
            {isLate && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                Late
              </span>
            )}
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
              Submitted
            </span>
          </div>
        </div>
        <ul className="space-y-2 mb-4">
          {bullets.filter(b => b.text.trim()).map((bullet, i) => (
            <li key={i} className="flex items-start gap-2 text-gray-700">
              <span className="text-gray-400 mt-0.5">•</span>
              <div className="flex-1">
                <span className="break-words">{bullet.text}</span>
                {(bullet.timeFrom || bullet.timeTo) && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({formatTimeDisplay(bullet.timeFrom, bullet.timeTo)})
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
        {submittedAt && (
          <p className="text-sm text-gray-500">
            Submitted at {formatSubmittedAt(submittedAt)} ET
          </p>
        )}
      </div>
    );
  }

  // Editable state
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6" data-slot={slotNumber}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Slot {slotNumber}</h2>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
          Open
        </span>
      </div>

      <div className="space-y-4 mb-4">
        {bullets.map((bullet, index) => (
          <div key={index} className="space-y-2 pb-3 border-b border-gray-100 last:border-0">
            {/* Time inputs row */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 hidden md:inline">•</span>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={bullet.timeFrom}
                  onChange={(e) => handleTimeChange(index, 'timeFrom', e.target.value)}
                  className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="time"
                  value={bullet.timeTo}
                  onChange={(e) => handleTimeChange(index, 'timeTo', e.target.value)}
                  className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                />
              </div>
              {bullets.length > 1 && (
                <button
                  onClick={() => removeBullet(index)}
                  className="text-gray-400 hover:text-red-500 px-2 text-xl"
                >
                  ×
                </button>
              )}
            </div>
            {/* Text input row */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 md:hidden">•</span>
              <input
                type="text"
                value={bullet.text}
                onChange={(e) => handleTextChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                placeholder="What did you work on?"
                data-field="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addBullet}
        className="text-sm font-semibold mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600"
      >
        + Add another task
      </button>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 py-3 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Slot'}
        </button>
      </div>
    </div>
  );
}
