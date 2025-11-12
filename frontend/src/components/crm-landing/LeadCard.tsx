/**
 * Lead Card Component - Individual lead in pipeline
 */

import React from 'react';
import { CheckCircle2, Clock, Bot } from 'lucide-react';

interface LeadCardProps {
  name: string;
  status: string;
  statusColor: string;
  value: string;
  probability: string;
  date: string;
  actions: Array<{ text: string; time: string; completed: boolean }>;
}

const LeadCard: React.FC<LeadCardProps> = ({ 
  name, 
  status, 
  statusColor, 
  value, 
  probability, 
  date, 
  actions 
}) => {
  return (
    <div className="bg-white rounded-lg border border-black/5 p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{name}</h4>
            <div className={`px-2 py-0.5 ${statusColor} text-xs rounded-full`}>{status}</div>
          </div>
          <p className="text-xs text-gray-500">{date}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">{value}</div>
          <div className="text-xs text-gray-500">{probability} likely</div>
        </div>
      </div>

      <div className="space-y-2">
        {actions.map((action, index) => (
          <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
            {action.completed ? (
              <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
            ) : (
              <Clock className="w-3 h-3 text-yellow-500 flex-shrink-0" />
            )}
            <span>{action.text}</span>
            <span className="text-gray-400">• {action.time}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between">
        <div className="flex -space-x-2">
          <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white" />
          <div className="w-6 h-6 rounded-full border-2 border-white bg-black flex items-center justify-center">
            <Bot className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="text-xs text-gray-500">Last contact: Today</div>
      </div>
    </div>
  );
};

export default LeadCard;

