/**
 * AI Conversation Panel - Interactive chat with 3 modes
 * Highlighted to grab attention, fully mobile optimized
 */

import React, { useState } from 'react';
import { Bot, MessageSquare, User, Sparkles } from 'lucide-react';
import ClientConversationDemo from './ClientConversationDemo';

type ChatMode = 'client' | 'user' | 'capabilities';

const AIConversationPanel: React.FC = () => {
  const [activeMode, setActiveMode] = useState<ChatMode>('client');

  return (
    <div className="w-full lg:w-80 h-full flex flex-col bg-gradient-to-b from-gray-50 to-white border-t lg:border-t-0 border-black/5 relative">
      {/* Attention-grabbing highlight effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-lg animate-pulse pointer-events-none" />
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg opacity-20 blur-sm animate-pulse pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-black/5 flex items-center gap-2 bg-white flex-shrink-0">
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium">AI Concierge</h3>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">Interactive Demo</span>
            </div>
          </div>
        </div>

        {/* Chat Type Tabs - Mobile Optimized */}
        <div className="px-2 sm:px-3 py-2 bg-white border-b border-black/5 flex-shrink-0">
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={() => setActiveMode('client')}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-xs font-medium transition-all ${
                activeMode === 'client'
                  ? 'bg-black text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Client</span>
              <span className="sm:hidden">👰</span>
            </button>
            
            <button
              onClick={() => setActiveMode('user')}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-xs font-medium transition-all ${
                activeMode === 'user'
                  ? 'bg-black text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">You</span>
              <span className="sm:hidden">👤</span>
            </button>
            
            <button
              onClick={() => setActiveMode('capabilities')}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-xs font-medium transition-all ${
                activeMode === 'capabilities'
                  ? 'bg-black text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Powers</span>
              <span className="sm:hidden">✨</span>
            </button>
          </div>
        </div>

        {/* Conversation Demo - Fixed height with scroll */}
        <div className="flex-1 overflow-y-auto">
          <ClientConversationDemo mode={activeMode} />
        </div>

        {/* Footer with mode description */}
        <div className="p-3 border-t border-black/5 bg-white flex-shrink-0">
          <div className="text-center py-2">
            {activeMode === 'client' && (
              <p className="text-xs text-gray-500">Watch AI handle a client from inquiry to booking</p>
            )}
            {activeMode === 'user' && (
              <p className="text-xs text-gray-500">See how you interact with your AI assistant</p>
            )}
            {activeMode === 'capabilities' && (
              <p className="text-xs text-gray-500">Discover everything your AI can do for you</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConversationPanel;
