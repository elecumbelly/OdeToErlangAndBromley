import React, { useState, useEffect } from 'react';
import { useDatabaseStore } from '../store/databaseStore';

const CampaignSelector: React.FC = () => {
  const {
    campaigns,
    clients,
    selectedCampaignId,
    refreshCampaigns,
    refreshClients,
    selectCampaign,
    addCampaign,
    addClient,
    error,
  } = useDatabaseStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('');
  const [newClientName, setNewClientName] = useState('');
  const [channelType, setChannelType] = useState('Voice');

  useEffect(() => {
    refreshCampaigns();
    refreshClients();
  }, [refreshCampaigns, refreshClients]);

  const handleCreateClient = () => {
    if (!newClientName.trim()) return;
    const id = addClient(newClientName.trim());
    if (id > 0) {
      setSelectedClientId(id);
      setNewClientName('');
    }
  };

  const handleCreateCampaign = () => {
    if (!newCampaignName.trim() || !selectedClientId) return;

    const today = new Date().toISOString().split('T')[0];
    const id = addCampaign({
      campaign_name: newCampaignName.trim(),
      client_id: selectedClientId as number,
      channel_type: channelType,
      start_date: today,
      end_date: null,
      sla_target_percent: 80,
      sla_threshold_seconds: 20,
      concurrency_allowed: channelType === 'Chat' ? 3 : 1,
      active: true,
    });

    if (id > 0) {
      selectCampaign(id);
      setIsCreating(false);
      setNewCampaignName('');
      setSelectedClientId('');
    }
  };

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border";
  const labelClass = "block text-sm font-medium text-gray-700";
  const buttonClass = "px-3 py-1.5 text-sm font-medium rounded-md transition-colors";

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Campaign</h3>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className={`${buttonClass} bg-primary-500 hover:bg-primary-600 text-white`}
        >
          {isCreating ? 'Cancel' : '+ New'}
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {isCreating && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md space-y-3">
          {/* Client Selection */}
          <div>
            <label className={labelClass}>Client</label>
            <div className="flex gap-2 mt-1">
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value ? parseInt(e.target.value) : '')}
                className={`${inputClass} flex-1`}
              >
                <option value="">Select client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.client_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Client Create */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs text-gray-500">Or create new client:</label>
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className={inputClass}
                placeholder="Client name"
              />
            </div>
            <button
              onClick={handleCreateClient}
              disabled={!newClientName.trim()}
              className={`${buttonClass} bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50`}
            >
              Add
            </button>
          </div>

          {/* Campaign Details */}
          <div>
            <label htmlFor="campaignName" className={labelClass}>Campaign Name</label>
            <input
              id="campaignName"
              type="text"
              value={newCampaignName}
              onChange={(e) => setNewCampaignName(e.target.value)}
              className={inputClass}
              placeholder="e.g., Sales Inbound"
            />
          </div>

          <div>
            <label htmlFor="channelType" className={labelClass}>Channel</label>
            <select
              id="channelType"
              value={channelType}
              onChange={(e) => setChannelType(e.target.value)}
              className={inputClass}
            >
              <option value="Voice">Voice</option>
              <option value="Chat">Chat</option>
              <option value="Email">Email</option>
              <option value="Video">Video</option>
              <option value="Social">Social</option>
              <option value="WhatsApp">WhatsApp</option>
            </select>
          </div>

          <button
            onClick={handleCreateCampaign}
            disabled={!newCampaignName.trim() || !selectedClientId}
            className={`${buttonClass} bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Create Campaign
          </button>
        </div>
      )}

      {/* Campaign Selector */}
      <div>
        <label className={labelClass}>Active Campaign</label>
        <select
          value={selectedCampaignId ?? ''}
          onChange={(e) => selectCampaign(e.target.value ? parseInt(e.target.value) : null)}
          className={`${inputClass} mt-1`}
        >
          <option value="">None (Quick Calculation)</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.campaign_name} ({campaign.channel_type})
            </option>
          ))}
        </select>
      </div>

      {/* Selected Campaign Info */}
      {selectedCampaign && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-500">Channel:</span>{' '}
              <span className="font-medium">{selectedCampaign.channel_type}</span>
            </div>
            <div>
              <span className="text-gray-500">SLA:</span>{' '}
              <span className="font-medium">
                {selectedCampaign.sla_target_percent}/{selectedCampaign.sla_threshold_seconds}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Concurrency:</span>{' '}
              <span className="font-medium">{selectedCampaign.concurrency_allowed}</span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>{' '}
              <span className={`font-medium ${selectedCampaign.active ? 'text-green-600' : 'text-gray-400'}`}>
                {selectedCampaign.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignSelector;
