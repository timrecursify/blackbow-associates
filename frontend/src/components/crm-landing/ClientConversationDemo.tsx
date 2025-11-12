/**
 * Animated Conversation Demo - 3 modes: client, user, capabilities
 * Wedding-vendor specific workflows, iMessage style, highly interactive
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Bot, FileText, Calendar, CreditCard, CheckCircle2, Download, ExternalLink, User, Sparkles, DollarSign, MapPin, Users, Clock } from 'lucide-react';

interface Message {
  id: number;
  type: 'client' | 'ai' | 'user' | 'system';
  content: string | React.ReactNode;
  delay: number;
  isTyping?: boolean;
}

type ChatMode = 'client' | 'user' | 'capabilities';

interface Props {
  mode: ChatMode;
}

const ClientConversationDemo: React.FC<Props> = ({ mode }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Client conversation - Wedding photography booking journey
  const clientConversation: Message[] = useMemo(() => [
    { id: 1, type: 'client', content: 'Hi! Looking for a photographer for June 15, 2025', delay: 0 },
    { id: 2, type: 'ai', content: '', delay: 600, isTyping: true },
    { id: 3, type: 'ai', content: 'Hey! 👋 June 15th is available!', delay: 1400 },
    { id: 4, type: 'ai', content: 'Tell me about your celebration', delay: 1800 },
    { id: 5, type: 'client', content: 'Villa Roma, outdoor ceremony, about 120 guests', delay: 3000 },
    { id: 6, type: 'ai', content: '', delay: 3800, isTyping: true },
    { id: 7, type: 'ai', content: 'Villa Roma is stunning! 😍', delay: 4600 },
    { id: 8, type: 'ai', content: 'A few quick questions:', delay: 5000 },
    { id: 9, type: 'ai', content: 'What time is your ceremony?', delay: 5400 },
    { id: 10, type: 'client', content: '4pm ceremony, reception until 11pm', delay: 6800 },
    { id: 11, type: 'ai', content: '', delay: 7400, isTyping: true },
    { id: 12, type: 'ai', content: 'Perfect! And your budget range?', delay: 8200 },
    { id: 13, type: 'client', content: 'Around 8 to 10k for photography', delay: 9600 },
    { id: 14, type: 'ai', content: '', delay: 10200, isTyping: true },
    { id: 15, type: 'ai', content: 'Great! I created a custom package for you:', delay: 11000 },
    { 
      id: 16, 
      type: 'ai', 
      content: (
        <div className="bg-white border border-black/10 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black/5 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-black truncate">Premium Wedding Package</div>
              <div className="text-xs text-gray-500">8 hours • 2 photographers • $8,500</div>
            </div>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>✓ Full ceremony + reception coverage</div>
            <div>✓ 500+ edited highres photos</div>
            <div>✓ Online gallery + prints</div>
          </div>
          <button className="w-full px-3 py-1.5 bg-black text-white text-xs rounded-lg font-medium">View Full Proposal</button>
        </div>
      ),
      delay: 12000 
    },
    { id: 17, type: 'client', content: 'Love it! What\'s next?', delay: 14000 },
    { id: 18, type: 'ai', content: '', delay: 14600, isTyping: true },
    { id: 19, type: 'ai', content: 'Let\'s book a consultation call', delay: 15400 },
    { id: 20, type: 'ai', content: 'Pick a time that works for you:', delay: 15800 },
    { 
      id: 21, 
      type: 'ai', 
      content: (
        <div className="bg-white border border-black/10 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-black">Schedule Consultation</div>
              <div className="text-xs text-gray-500">30min video call</div>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <button className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-left">📅 Tomorrow 2pm</button>
            <button className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-left">📅 Friday 10am</button>
            <button className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-left">📅 Saturday 3pm</button>
          </div>
        </div>
      ),
      delay: 16800 
    },
    { id: 22, type: 'client', content: 'Friday 10am works!', delay: 18500 },
    { id: 23, type: 'ai', content: '', delay: 19100, isTyping: true },
    { id: 24, type: 'ai', content: '✓ Booked! Calendar invite sent 📧', delay: 19900 },
    { id: 25, type: 'ai', content: 'I\'ll send you the full proposal now', delay: 20300 },
    { id: 26, type: 'ai', content: 'See you Friday! 🎉', delay: 20700 },
  ], []);

  // User (vendor) conversation - AI updating vendor about leads
  const userConversation: Message[] = useMemo(() => [
    { id: 1, type: 'ai', content: 'Good morning! ☀️', delay: 0 },
    { id: 2, type: 'ai', content: 'I set up a consultation call with Rachel & David for tomorrow at 10am', delay: 600 },
    { id: 3, type: 'ai', content: 'Added it to your calendar 📅', delay: 1000 },
    { id: 4, type: 'ai', content: 'They inquired about June 15 wedding at Villa Roma', delay: 1400 },
    { id: 5, type: 'ai', content: 'I sent them the premium package for $8,500', delay: 1800 },
    { id: 6, type: 'user', content: 'Perfect! Confirmed for tomorrow', delay: 3200 },
    { id: 7, type: 'user', content: 'What about Emma & James?', delay: 3600 },
    { id: 8, type: 'ai', content: '', delay: 4200, isTyping: true },
    { id: 9, type: 'ai', content: 'Emma & James for Sept 10', delay: 5000 },
    { id: 10, type: 'ai', content: 'I emailed them this morning with package options', delay: 5400 },
    { id: 11, type: 'ai', content: 'Called them 2 hours ago to follow up', delay: 5800 },
    { 
      id: 12, 
      type: 'ai', 
      content: (
        <div className="bg-white border border-black/10 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium">Emma & James Wedding</div>
              <div className="text-xs text-gray-500">Sept 10, 2025</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">$15,000</div>
              <div className="text-xs text-yellow-600">45% likely</div>
            </div>
          </div>
          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              <span>Seaside Resort</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3" />
              <span>200 guests</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Full day coverage needed</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-black/5">
            <div className="text-xs text-gray-500">Status: Proposal sent, waiting for response</div>
          </div>
        </div>
      ),
      delay: 6600 
    },
    { id: 13, type: 'ai', content: 'They said they need to discuss with their planner', delay: 8800 },
    { id: 14, type: 'ai', content: 'I\'ll follow up with them on Friday', delay: 9200 },
    { id: 15, type: 'user', content: 'Got it. Any other updates?', delay: 10600 },
    { id: 16, type: 'ai', content: '', delay: 11200, isTyping: true },
    { id: 17, type: 'ai', content: 'Yes! Sarah & Mike just inquired for August 20', delay: 12000 },
    { id: 18, type: 'ai', content: 'I\'m qualifying them now', delay: 12400 },
    { id: 19, type: 'ai', content: 'Also reminder: you have Rachel & David call tomorrow at 10am', delay: 12800 },
    { id: 20, type: 'ai', content: 'I sent you the prep notes 📋', delay: 13200 },
    { id: 21, type: 'user', content: 'Perfect, thanks for handling everything!', delay: 14800 },
    { id: 22, type: 'ai', content: 'Always! 💪 Have a great day!', delay: 15600 },
  ], []);

  // Capabilities showcase - Wedding vendor specific
  const capabilitiesConversation: Message[] = useMemo(() => [
    { id: 1, type: 'system', content: '✨ What I Handle For You', delay: 0 },
    { id: 2, type: 'ai', content: '💬 24/7 Instant Response', delay: 700 },
    { id: 3, type: 'ai', content: 'I reply to every wedding inquiry in seconds, even at 2am', delay: 1100 },
    { id: 4, type: 'ai', content: '', delay: 2000, isTyping: true },
    { id: 5, type: 'ai', content: '❓ Smart Qualification', delay: 2800 },
    { id: 6, type: 'ai', content: 'I ask about date, venue, guest count, budget, and style preferences', delay: 3200 },
    { id: 7, type: 'ai', content: '', delay: 4300, isTyping: true },
    { id: 8, type: 'ai', content: '📋 Custom Proposals', delay: 5100 },
    { id: 9, type: 'ai', content: 'I create personalized packages based on their wedding vision and budget', delay: 5500 },
    { id: 10, type: 'ai', content: '', delay: 6600, isTyping: true },
    { id: 11, type: 'ai', content: '📅 Consultation Scheduling', delay: 7400 },
    { id: 12, type: 'ai', content: 'I book calls, send calendar invites, and handle rescheduling', delay: 7800 },
    { id: 13, type: 'ai', content: '', delay: 8900, isTyping: true },
    { id: 14, type: 'ai', content: '📄 Contract Management', delay: 9700 },
    { id: 15, type: 'ai', content: 'I generate, send, and track contracts with esignature integration', delay: 10100 },
    { id: 16, type: 'ai', content: '', delay: 11200, isTyping: true },
    { id: 17, type: 'ai', content: '💰 Payment Processing', delay: 12000 },
    { id: 18, type: 'ai', content: 'I collect deposits, send invoices, and handle payment plans', delay: 12400 },
    { id: 19, type: 'ai', content: '', delay: 13500, isTyping: true },
    { id: 20, type: 'ai', content: '🔄 Smart Followups', delay: 14300 },
    { id: 21, type: 'ai', content: 'I nurture every lead with timely, personalized checkins', delay: 14700 },
    { id: 22, type: 'ai', content: '', delay: 15800, isTyping: true },
    { id: 23, type: 'ai', content: '📊 Lead Tracking', delay: 16600 },
    { id: 24, type: 'ai', content: 'I track every interaction, update your CRM, and predict booking likelihood', delay: 17000 },
    { id: 25, type: 'ai', content: '', delay: 18100, isTyping: true },
    { id: 26, type: 'ai', content: '🎯 Availability Management', delay: 18900 },
    { id: 27, type: 'ai', content: 'I keep your calendar updated and never doublebook dates', delay: 19300 },
    { id: 28, type: 'system', content: 'Your personal wedding business assistant 🚀', delay: 20500 },
  ], []);

  const conversationFlow = useMemo(() => {
    switch (mode) {
      case 'user':
        return userConversation;
      case 'capabilities':
        return capabilitiesConversation;
      default:
        return clientConversation;
    }
  }, [mode, clientConversation, userConversation, capabilitiesConversation]);

  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [typingMessageId, setTypingMessageId] = useState<number | null>(null);

  useEffect(() => {
    // Reset on mode change
    setVisibleMessages([]);
    setTypingMessageId(null);
    
    // Scroll to top when mode changes
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }

    // Show messages sequentially one by one
    conversationFlow.forEach((message, index) => {
      setTimeout(() => {
        if (message.isTyping) {
          setTypingMessageId(message.id);
          setTimeout(() => {
            setTypingMessageId(null);
          }, 800);
        } else {
          // Add message one at a time, ensuring order
          setVisibleMessages((prev) => {
            // Only add if not already visible and if it's the next in sequence
            if (!prev.includes(message.id)) {
              return [...prev, message.id];
            }
            return prev;
          });
        }
      }, message.delay);
    });
  }, [conversationFlow]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-gray-50 to-white">
      {conversationFlow.map((message, index) => {
        const isVisible = visibleMessages.includes(message.id);
        const isCurrentlyTyping = typingMessageId === message.id;

        // Only render if visible or currently typing
        if (!isVisible && !isCurrentlyTyping) return null;

        // Skip rendering typing indicators that are done
        if (message.isTyping && !isCurrentlyTyping) return null;

        // Show typing indicator
        if (isCurrentlyTyping) {
          return (
            <div
              key={message.id}
              className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white border border-black/5 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          );
        }

        // System messages
        if (message.type === 'system') {
          return (
            <div
              key={message.id}
              className={`text-center py-2 transition-all duration-500 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
            >
              <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-black/5">
                <p className="text-xs font-medium text-gray-700">{message.content}</p>
              </div>
            </div>
          );
        }

        // AI messages
        if (message.type === 'ai') {
          return (
            <div
              key={message.id}
              className={`flex items-start gap-2 transition-all duration-500 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
            >
              <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex-1 max-w-[85%]">
                {typeof message.content === 'string' ? (
                  <div className="bg-white border border-black/5 rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                    <p className="text-xs text-gray-800 leading-relaxed">{message.content}</p>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-left-2 duration-500">
                    {message.content}
                  </div>
                )}
              </div>
            </div>
          );
        }

        // User (vendor) messages - Blue iMessage style
        if (message.type === 'user') {
          return (
            <div
              key={message.id}
              className={`flex items-start gap-2 justify-end transition-all duration-500 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
            >
              <div className="flex-1 flex justify-end">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-tr-sm px-3 py-2 shadow-sm max-w-[85%]">
                  <p className="text-xs leading-relaxed">{message.content}</p>
                </div>
              </div>
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          );
        }

        // Client messages - Blue iMessage style (like Apple Messages)
        return (
          <div
            key={message.id}
            className={`flex items-start gap-2 justify-end transition-all duration-500 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            <div className="flex-1 flex justify-end">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-tr-sm px-3 py-2 shadow-sm max-w-[85%]">
                <p className="text-xs leading-relaxed">{message.content}</p>
              </div>
            </div>
            <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-medium text-white">C</span>
            </div>
          </div>
        );
      })}
      
      {/* Spacer for better scrolling */}
      <div className="h-2" />
    </div>
  );
};

export default ClientConversationDemo;
