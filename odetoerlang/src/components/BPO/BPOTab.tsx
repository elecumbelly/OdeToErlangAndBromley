import { useState } from 'react';
import ClientManager from './ClientManager';
import ContractManager from './ContractManager';

export default function BPOTab() {
  const [activeSubTab, setActiveSubTab] = useState<'clients' | 'contracts'>('clients');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b border-border-subtle">
        <button
          onClick={() => setActiveSubTab('clients')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeSubTab === 'clients'
              ? 'border-cyan text-cyan'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-active'
          }`}
        >
          Clients
        </button>
        <button
          onClick={() => {
            setSelectedClientId(null);
            setActiveSubTab('contracts');
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeSubTab === 'contracts'
              ? 'border-cyan text-cyan'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-active'
          }`}
        >
          Contracts & Billing
        </button>
      </div>

      <div className="animate-fade-in">
        {activeSubTab === 'clients' && (
          <ClientManager onSelectClient={setSelectedClientId} selectedClientId={selectedClientId} />
        )}
        {activeSubTab === 'contracts' && (
          <ContractManager clientId={selectedClientId} />
        )}
      </div>
    </div>
  );
}
