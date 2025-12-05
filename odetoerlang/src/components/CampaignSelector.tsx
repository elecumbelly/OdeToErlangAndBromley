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

  const inputClass = "mt-1 block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2 focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/20 transition-all duration-fast";
  const labelClass = "block text-2xs font-semibold text-text-secondary uppercase tracking-widest";

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-lg p-4">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-border-muted">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Campaign</h3>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-3 py-1 text-2xs font-medium rounded-md transition-all uppercase tracking-wide bg-cyan/10 text-cyan border border-cyan/30 hover:bg-cyan/20 hover:border-cyan/50"
        >
          {isCreating ? 'Cancel' : '+ New'}
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red/10 border border-red/30 rounded text-red text-xs">
          {error}
        </div>
      )}

      {isCreating && (
        <div className="mb-4 p-3 bg-bg-elevated border border-border-muted rounded-lg space-y-3">
          {/* Client Selection */}
          <div>
            <label className={labelClass}>Client</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value ? parseInt(e.target.value) : '')}
              className={inputClass}
            >
              <option value="">Select client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.client_name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Client Create */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-2xs text-text-muted">Or create new:</label>
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
              className="px-3 py-2 text-2xs bg-bg-hover hover:bg-bg-surface text-text-secondary hover:text-text-primary border border-border-subtle rounded-md transition-all disabled:opacity-40 uppercase"
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
            className="w-full px-3 py-2 text-2xs font-medium rounded-md transition-all uppercase tracking-wide bg-green/10 text-green border border-green/30 hover:bg-green/20 hover:border-green/50 disabled:opacity-40 disabled:cursor-not-allowed"
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
          className={inputClass}
        >
          <option value="">None (Quick Calc)</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.campaign_name} ({campaign.channel_type})
            </option>
          ))}
        </select>
      </div>

      {/* Selected Campaign Info */}
      {selectedCampaign && (
        <div className="mt-3 p-2 bg-bg-elevated border border-border-muted rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-2xs">
            <div>
              <span className="text-text-muted">Channel:</span>{' '}
              <span className="text-text-primary font-medium">{selectedCampaign.channel_type}</span>
            </div>
            <div>
              <span className="text-text-muted">SLA:</span>{' '}
              <span className="text-cyan font-medium">
                {selectedCampaign.sla_target_percent}/{selectedCampaign.sla_threshold_seconds}
              </span>
            </div>
            <div>
              <span className="text-text-muted">Concurrency:</span>{' '}
              <span className="text-text-primary font-medium">{selectedCampaign.concurrency_allowed}</span>
            </div>
            <div>
              <span className="text-text-muted">Status:</span>{' '}
              <span className={selectedCampaign.active ? 'text-green font-medium' : 'text-text-muted'}>
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
