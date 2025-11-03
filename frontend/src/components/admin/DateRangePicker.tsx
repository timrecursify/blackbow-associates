import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onChange: (start: Date, end: Date) => void;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onChange
}: DateRangePickerProps) {
  const presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'All time', days: 365 }
  ];

  const handlePresetClick = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    onChange(start, end);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
      <Calendar className="w-5 h-5 text-gray-500 hidden sm:block" />
      <select
        value=""
        onChange={(e) => {
          const days = parseInt(e.target.value);
          if (days) handlePresetClick(days);
        }}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="">Date Range</option>
        {presets.map(preset => (
          <option key={preset.days} value={preset.days}>
            {preset.label}
          </option>
        ))}
      </select>
      <span className="text-sm md:text-base text-gray-700 font-medium">
        {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
      </span>
    </div>
  );
}
