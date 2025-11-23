import { useState } from 'react';
import { calculateStaffingMetrics } from '../lib/calculations/erlangC';

interface Channel {
  id: string;
  name: string;
  type: 'voice' | 'email' | 'chat' | 'social' | 'video' | 'custom';
  volume: number;
  aht: number;
  targetSL: number;
  threshold: number;
  concurrent: number; // For chat/email - number of contacts agent can handle simultaneously
  icon: string;
}

export default function MultiChannelPanel() {
  const [channels, setChannels] = useState<Channel[]>([
    {
      id: '1',
      name: 'Voice Calls',
      type: 'voice',
      volume: 100,
      aht: 240,
      targetSL: 80,
      threshold: 20,
      concurrent: 1,
      icon: '📞'
    },
    {
      id: '2',
      name: 'Live Chat',
      type: 'chat',
      volume: 50,
      aht: 180,
      targetSL: 85,
      threshold: 60,
      concurrent: 3,
      icon: '💬'
    },
    {
      id: '3',
      name: 'Email',
      type: 'email',
      volume: 30,
      aht: 300,
      targetSL: 90,
      threshold: 3600,
      concurrent: 5,
      icon: '📧'
    }
  ]);

  const [shrinkage, setShrinkage] = useState(25);
  const [maxOccupancy, setMaxOccupancy] = useState(90);
  const [intervalMinutes, setIntervalMinutes] = useState(30);
  const [blendingPercent, setBlendingPercent] = useState(60);

  const addChannel = () => {
    const newChannel: Channel = {
      id: Date.now().toString(),
      name: 'New Channel',
      type: 'custom',
      volume: 0,
      aht: 180,
      targetSL: 80,
      threshold: 20,
      concurrent: 1,
      icon: '📱'
    };
    setChannels([...channels, newChannel]);
  };

  const updateChannel = (id: string, updates: Partial<Channel>) => {
    setChannels(channels.map(ch => ch.id === id ? { ...ch, ...updates } : ch));
  };

  const removeChannel = (id: string) => {
    setChannels(channels.filter(ch => ch.id !== id));
  };

  // Calculate staffing for each channel
  const channelResults = channels.map(channel => {
    // Adjust for concurrency - effective AHT is divided by concurrent contacts
    const effectiveAHT = channel.aht / channel.concurrent;

    const result = calculateStaffingMetrics({
      volume: channel.volume,
      aht: effectiveAHT,
      intervalSeconds: intervalMinutes * 60,
      targetSL: channel.targetSL / 100,
      thresholdSeconds: channel.threshold,
      shrinkagePercent: shrinkage,
      maxOccupancy: maxOccupancy / 100
    });

    return {
      channel,
      ...result
    };
  });

  // Calculate blended staffing (shared agents across channels)
  const totalFTEDedicated = channelResults.reduce((sum, r) => sum + r.totalFTE, 0);

  // Blended model assumes agents can handle multiple channels
  // Efficiency gain from pooling (typically 10-20% reduction)
  const blendingEfficiency = blendingPercent / 100;
  const totalFTEBlended = totalFTEDedicated * (1 - blendingEfficiency * 0.15);

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Multi-Channel Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interval (min)
            </label>
            <input
              type="number"
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shrinkage (%)
            </label>
            <input
              type="number"
              value={shrinkage}
              onChange={(e) => setShrinkage(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Occupancy (%)
            </label>
            <input
              type="number"
              value={maxOccupancy}
              onChange={(e) => setMaxOccupancy(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blending (%)
            </label>
            <input
              type="number"
              value={blendingPercent}
              onChange={(e) => setBlendingPercent(Number(e.target.value))}
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <button
          onClick={addChannel}
          className="w-full md:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          + Add Channel
        </button>
      </div>

      {/* Channel Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {channels.map(channel => {
          const result = channelResults.find(r => r.channel.id === channel.id);

          return (
            <div key={channel.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{channel.icon}</span>
                  <input
                    type="text"
                    value={channel.name}
                    onChange={(e) => updateChannel(channel.id, { name: e.target.value })}
                    className="text-lg font-semibold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-primary-500 outline-none"
                  />
                </div>
                <button
                  onClick={() => removeChannel(channel.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Volume</label>
                  <input
                    type="number"
                    value={channel.volume}
                    onChange={(e) => updateChannel(channel.id, { volume: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">AHT (sec)</label>
                  <input
                    type="number"
                    value={channel.aht}
                    onChange={(e) => updateChannel(channel.id, { aht: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Target SL (%)</label>
                  <input
                    type="number"
                    value={channel.targetSL}
                    onChange={(e) => updateChannel(channel.id, { targetSL: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Threshold (sec)</label>
                  <input
                    type="number"
                    value={channel.threshold}
                    onChange={(e) => updateChannel(channel.id, { threshold: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Concurrent Contacts (chat/email)
                  </label>
                  <input
                    type="number"
                    value={channel.concurrent}
                    onChange={(e) => updateChannel(channel.id, { concurrent: Number(e.target.value) })}
                    min="1"
                    max="10"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Number of {channel.name} contacts an agent can handle simultaneously
                  </p>
                </div>
              </div>

              {result && (
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Required Agents:</span>
                    <span className="font-semibold">{result.requiredAgents}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total FTE:</span>
                    <span className="font-semibold">{result.totalFTE.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Service Level:</span>
                    <span className={`font-semibold ${result.serviceLevel >= channel.targetSL / 100 ? 'text-green-600' : 'text-red-600'}`}>
                      {(result.serviceLevel * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Occupancy:</span>
                    <span className="font-semibold">{(result.occupancy * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Panel */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Staffing Summary</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Dedicated Model</p>
            <p className="text-3xl font-bold text-gray-900">{totalFTEDedicated.toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-1">FTE (separate teams per channel)</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Blended Model ({blendingPercent}%)</p>
            <p className="text-3xl font-bold text-primary-600">{totalFTEBlended.toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-1">FTE (multi-skilled agents)</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Efficiency Gain</p>
            <p className="text-3xl font-bold text-green-600">
              {((totalFTEDedicated - totalFTEBlended) / totalFTEDedicated * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Save {(totalFTEDedicated - totalFTEBlended).toFixed(1)} FTE
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-white rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Blending Explanation:</strong> Multi-skilled agents can handle {blendingPercent}% of all channel types.
            This creates pooling efficiency - when one channel is quiet, agents help on busier channels.
            Typical efficiency gains: 10-20% FTE reduction vs dedicated teams.
          </p>
        </div>
      </div>
    </div>
  );
}
