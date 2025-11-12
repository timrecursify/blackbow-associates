/**
 * CRM Pipeline View - Displays lead cards with pipeline stages (Pipedrive-style)
 */

import React from 'react';
import { CheckCircle2, Clock, Bot } from 'lucide-react';

const CRMPipelineView: React.FC = () => {
  return (
    <div className="flex-1 lg:border-r border-black/5 overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between bg-white">
        <h3 className="text-sm font-medium">Deals Pipeline</h3>
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-gray-100 text-xs rounded">18 Active</div>
          <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">$312K</div>
        </div>
      </div>

      {/* Horizontal scrollable stages */}
      <div className="flex-1 overflow-x-auto overflow-y-auto bg-gray-50">
        <div className="flex gap-3 p-4 min-w-max">
          
          {/* Discovery Stage */}
          <div className="flex-shrink-0 w-64 sm:w-72">
            <div className="bg-yellow-100 rounded-lg px-3 py-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-yellow-800">Discovery</span>
                <span className="text-xs text-yellow-700">4 deals • $42K</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-xs">Rachel & David Event</h4>
                      <div className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">New</div>
                    </div>
                    <p className="text-xs text-gray-500">Sept 10, 2025 • TBD</p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-xs font-medium">$6,200</div>
                    <div className="text-xs text-gray-500">45%</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Initial inquiry responded</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="w-3 h-3 text-yellow-500" />
                    <span>Consultation booking sent</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <img src="https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" className="w-5 h-5 rounded-full border-2 border-white" alt="Client" />
                    <div className="w-5 h-5 rounded-full border-2 border-white bg-black flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">3h ago</div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-xs">Lisa & Tom Gala</h4>
                      <div className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">New</div>
                    </div>
                    <p className="text-xs text-gray-500">Nov 5, 2025 • Downtown</p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-xs font-medium">$7,800</div>
                    <div className="text-xs text-gray-500">40%</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Portfolio sent</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <img src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" className="w-5 h-5 rounded-full border-2 border-white" alt="Client" />
                    <div className="w-5 h-5 rounded-full border-2 border-white bg-black flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">1d ago</div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-xs">Amanda & Chris Day</h4>
                      <div className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">New</div>
                    </div>
                    <p className="text-xs text-gray-500">Oct 20, 2025 • Country Club</p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-xs font-medium">$9,500</div>
                    <div className="text-xs text-gray-500">35%</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>First contact made</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <img src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" className="w-5 h-5 rounded-full border-2 border-white" alt="Client" />
                    <div className="w-5 h-5 rounded-full border-2 border-white bg-black flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">2d ago</div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-xs">Beth & Tyler Celebration</h4>
                      <div className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">New</div>
                    </div>
                    <p className="text-xs text-gray-500">Jan 10, 2026 • TBD</p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-xs font-medium">$10,500</div>
                    <div className="text-xs text-gray-500">30%</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Info packet sent</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <img src="https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" className="w-5 h-5 rounded-full border-2 border-white" alt="Client" />
                    <div className="w-5 h-5 rounded-full border-2 border-white bg-black flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">3d ago</div>
                </div>
              </div>
            </div>
          </div>

          {/* Proposal Stage */}
          <div className="flex-shrink-0 w-72">
            <div className="bg-blue-100 rounded-lg px-3 py-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-blue-800">Proposal</span>
                <span className="text-xs text-blue-700">5 deals • $68K</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-xs">Maria & Alex Wedding</h4>
                      <div className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Hot</div>
                    </div>
                    <p className="text-xs text-gray-500">July 22, 2025 • Garden Venue</p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-xs font-medium">$9,500</div>
                    <div className="text-xs text-gray-500">65%</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Custom proposal sent</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="w-3 h-3 text-yellow-500" />
                    <span>Follow-up in 2 days</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <img src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" className="w-5 h-5 rounded-full border-2 border-white" alt="Client" />
                    <div className="w-5 h-5 rounded-full border-2 border-white bg-black flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">Today</div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-xs">Karen & Steven Event</h4>
                      <div className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Warm</div>
                    </div>
                    <p className="text-xs text-gray-500">Oct 18, 2025 • Beach</p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-xs font-medium">$11,200</div>
                    <div className="text-xs text-gray-500">60%</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Proposal reviewed</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <img src="https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" className="w-5 h-5 rounded-full border-2 border-white" alt="Client" />
                    <div className="w-5 h-5 rounded-full border-2 border-white bg-black flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">1d ago</div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-xs">Diana & Paul Affair</h4>
                      <div className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Hot</div>
                    </div>
                    <p className="text-xs text-gray-500">Sept 3, 2025 • Historic Mansion</p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-xs font-medium">$13,800</div>
                    <div className="text-xs text-gray-500">75%</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Proposal sent</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="w-3 h-3 text-yellow-500" />
                    <span>Follow-up tomorrow</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <img src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" className="w-5 h-5 rounded-full border-2 border-white" alt="Client" />
                    <div className="w-5 h-5 rounded-full border-2 border-white bg-black flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">6h ago</div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-xs">Grace & Peter Gala</h4>
                      <div className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Warm</div>
                    </div>
                    <p className="text-xs text-gray-500">Dec 14, 2025 • Mountain Lodge</p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-xs font-medium">$10,300</div>
                    <div className="text-xs text-gray-500">55%</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Custom package created</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <img src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" className="w-5 h-5 rounded-full border-2 border-white" alt="Client" />
                    <div className="w-5 h-5 rounded-full border-2 border-white bg-black flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">2d ago</div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-xs">Olivia & Mark Celebration</h4>
                      <div className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Warm</div>
                    </div>
                    <p className="text-xs text-gray-500">Feb 28, 2026 • Winery</p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-xs font-medium">$12,200</div>
                    <div className="text-xs text-gray-500">50%</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Proposal delivered</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <img src="https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" className="w-5 h-5 rounded-full border-2 border-white" alt="Client" />
                    <div className="w-5 h-5 rounded-full border-2 border-white bg-black flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">3d ago</div>
                </div>
              </div>
            </div>
          </div>

          {/* Negotiation Stage */}
          <div className="flex-shrink-0 w-72">
            <div className="bg-purple-100 rounded-lg px-3 py-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-purple-800">Negotiation</span>
                <span className="text-xs text-purple-700">4 deals • $52K</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-xs">Emma & Michael Celebration</h4>
                      <div className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Negotiating</div>
                    </div>
                    <p className="text-xs text-gray-500">Aug 20, 2025 • Seaside</p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-xs font-medium">$12,000</div>
                    <div className="text-xs text-gray-500">70%</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Timeline adjusted</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="w-3 h-3 text-yellow-500" />
                    <span>Awaiting final decision</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <img src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" className="w-5 h-5 rounded-full border-2 border-white" alt="Client" />
                    <div className="w-5 h-5 rounded-full border-2 border-white bg-black flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">Yesterday</div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-xs">Hannah & Robert Soirée</h4>
                      <div className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Active</div>
                    </div>
                    <p className="text-xs text-gray-500">Nov 22, 2025 • Rooftop</p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-xs font-medium">$10,800</div>
                    <div className="text-xs text-gray-500">65%</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Price discussion ongoing</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <img src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" className="w-5 h-5 rounded-full border-2 border-white" alt="Client" />
                    <div className="w-5 h-5 rounded-full border-2 border-white bg-black flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">12h ago</div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-xs">Sophia & Daniel Wedding</h4>
                      <div className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Hot</div>
                    </div>
                    <p className="text-xs text-gray-500">April 18, 2026 • Estate</p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-xs font-medium">$16,500</div>
                    <div className="text-xs text-gray-500">80%</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Final terms discussed</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="w-3 h-3 text-yellow-500" />
                    <span>Decision expected today</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <img src="https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" className="w-5 h-5 rounded-full border-2 border-white" alt="Client" />
                    <div className="w-5 h-5 rounded-full border-2 border-white bg-black flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">4h ago</div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-xs">Megan & Joshua Event</h4>
                      <div className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Warm</div>
                    </div>
                    <p className="text-xs text-gray-500">March 7, 2026 • Hotel Ballroom</p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-xs font-medium">$13,700</div>
                    <div className="text-xs text-gray-500">60%</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Terms reviewed</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <img src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" className="w-5 h-5 rounded-full border-2 border-white" alt="Client" />
                    <div className="w-5 h-5 rounded-full border-2 border-white bg-black flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">1d ago</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Sent Stage */}
          <div className="flex-shrink-0 w-72">
            <div className="bg-green-100 rounded-lg px-3 py-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-green-800">Contract Sent</span>
                <span className="text-xs text-green-700">3 deals • $87K</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-xs">Sarah & James Wedding</h4>
                      <div className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Hot</div>
                    </div>
                    <p className="text-xs text-gray-500">June 15, 2025 • Villa Roma</p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-xs font-medium">$8,500</div>
                    <div className="text-xs text-gray-500">85%</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Contract sent by AI</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Venue confirmed</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="w-3 h-3 text-yellow-500" />
                    <span>Follow-up in 24h</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <img src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" className="w-5 h-5 rounded-full border-2 border-white" alt="Client" />
                    <div className="w-5 h-5 rounded-full border-2 border-white bg-black flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">Today</div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-xs">Nicole & Ryan Party</h4>
                      <div className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Pending</div>
                    </div>
                    <p className="text-xs text-gray-500">Dec 3, 2025 • Grand Hall</p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-xs font-medium">$15,500</div>
                    <div className="text-xs text-gray-500">90%</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Contract delivered</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="w-3 h-3 text-yellow-500" />
                    <span>Awaiting signature</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <img src="https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" className="w-5 h-5 rounded-full border-2 border-white" alt="Client" />
                    <div className="w-5 h-5 rounded-full border-2 border-white bg-black flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">6h ago</div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-black/5 p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-xs">Victoria & Brian Wedding</h4>
                      <div className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Hot</div>
                    </div>
                    <p className="text-xs text-gray-500">July 8, 2025 • Vineyard</p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-xs font-medium">$11,700</div>
                    <div className="text-xs text-gray-500">95%</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Contract sent</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="w-3 h-3 text-yellow-500" />
                    <span>Signature expected soon</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <img src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" className="w-5 h-5 rounded-full border-2 border-white" alt="Client" />
                    <div className="w-5 h-5 rounded-full border-2 border-white bg-black flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">2h ago</div>
                </div>
              </div>
            </div>
          </div>

          {/* Won Stage */}
          <div className="flex-shrink-0 w-72">
            <div className="bg-emerald-100 rounded-lg px-3 py-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-800">Won</span>
                <span className="text-xs text-emerald-700">2 deals • $63K</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-lg border border-emerald-200 p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-xs">Jennifer & Mark Day</h4>
                      <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">Booked</div>
                    </div>
                    <p className="text-xs text-gray-500">May 8, 2025 • Lakeside</p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-xs font-medium">$14,300</div>
                    <div className="text-xs text-emerald-600">100%</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Contract signed</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Deposit received</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <img src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" className="w-5 h-5 rounded-full border-2 border-white" alt="Client" />
                    <div className="w-5 h-5 rounded-full border-2 border-white bg-black flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">2d ago</div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-emerald-200 p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-xs">Ashley & Kevin Celebration</h4>
                      <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">Confirmed</div>
                    </div>
                    <p className="text-xs text-gray-500">June 28, 2025 • Botanical Garden</p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-xs font-medium">$18,900</div>
                    <div className="text-xs text-emerald-600">100%</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Fully booked</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Payment received</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <img src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" className="w-5 h-5 rounded-full border-2 border-white" alt="Client" />
                    <div className="w-5 h-5 rounded-full border-2 border-white bg-black flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">1w ago</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CRMPipelineView;
