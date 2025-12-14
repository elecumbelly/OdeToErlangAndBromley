import { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { PaginationControls } from '../ui/PaginationControls';
import { 
  getContracts, createContract, updateContract, deleteContract,
  getBillingRules, createBillingRule, updateBillingRule, deleteBillingRule,
  getClients, getCampaigns,
  type Contract, type BillingRule, type Client, type Campaign
} from '../../lib/database/dataAccess';
import { useToast } from '../ui/Toast';

interface ContractManagerProps {
  clientId: number | null;
}

const BILLING_MODELS = ['PerSeat', 'PerFTE', 'PerHour', 'PerHandleMinute', 'PerTransaction', 'Outcome', 'Hybrid'];

export default function ContractManager({ clientId }: ContractManagerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const itemsPerPage = 5;

  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BillingRule | null>(null);

  const { addToast } = useToast();

  // Contract form state
  const [contractNumber, setContractNumber] = useState('');
  const [contractStartDate, setContractStartDate] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');
  const [currency, setCurrency] = useState('GBP');
  const [autoRenew, setAutoRenew] = useState(false);
  const [noticePeriod, setNoticePeriod] = useState(90);
  const [selectedClientForContract, setSelectedClientForContract] = useState<number | null>(clientId);


  // Billing Rule form state
  const [ruleContractId, setRuleContractId] = useState<number | null>(null);
  const [ruleCampaignId, setRuleCampaignId] = useState<number | null>(null);
  const [billingModel, setBillingModel] = useState('PerFTE');
  const [rate, setRate] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [reward, setReward] = useState(0);
  const [ruleValidFrom, setRuleValidFrom] = useState('');
  const [ruleValidTo, setRuleValidTo] = useState('');

  const { data: contracts, total: totalContracts } = useMemo(() => {
    void refreshKey;
    const offset = (currentPage - 1) * itemsPerPage;
    return getContracts(clientId ?? null, itemsPerPage, offset);
  }, [clientId, currentPage, itemsPerPage, refreshKey]);

  const campaigns: Campaign[] = useMemo(() => {
    void refreshKey;
    return getCampaigns(false);
  }, [refreshKey]);

  const clients: Client[] = useMemo(() => {
    void refreshKey;
    return getClients(false, 1000, 0).data;
  }, [refreshKey]);

  const totalPages = Math.ceil(totalContracts / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // --- CONTRACT MANAGEMENT ---
  const openContractModal = (contract?: Contract) => {
    if (contract) {
      setEditingContract(contract);
      setContractNumber(contract.contract_number);
      setContractStartDate(contract.start_date);
      setContractEndDate(contract.end_date || '');
      setCurrency(contract.currency);
      setAutoRenew(Boolean(contract.auto_renew));
      setNoticePeriod(contract.notice_period_days);
      setSelectedClientForContract(contract.client_id);
    } else {
      setEditingContract(null);
      setContractNumber('');
      setContractStartDate(new Date().toISOString().split('T')[0]);
      setContractEndDate('');
      setCurrency('GBP');
      setAutoRenew(false);
      setNoticePeriod(90);
      setSelectedClientForContract(clientId); // Default to current client
    }
    setIsContractModalOpen(true);
  };

  const handleContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForContract || !contractNumber || !contractStartDate) {
      addToast('Please fill all required contract fields', 'error');
      return;
    }

    try {
      const contractData = {
        client_id: selectedClientForContract,
        contract_number: contractNumber,
        start_date: contractStartDate,
        end_date: contractEndDate || null,
        currency: currency,
        auto_renew: autoRenew,
        notice_period_days: noticePeriod,
      };

      if (editingContract) {
        updateContract(editingContract.id, contractData);
        addToast('Contract updated', 'success');
      } else {
        createContract(contractData);
        addToast('Contract created', 'success');
      }
      setIsContractModalOpen(false);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      console.error(err);
      addToast('Failed to save contract. Contract number must be unique.', 'error');
    }
  };

  const handleContractDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this contract and all its billing rules?')) {
      try {
        deleteContract(id);
        addToast('Contract deleted', 'success');
        setRefreshKey((key) => key + 1);
      } catch (err) {
        console.error(err);
        addToast('Failed to delete contract. It might have associated entities.', 'error');
      }
    }
  };


  // --- BILLING RULE MANAGEMENT ---
  const openRuleModal = (rule?: BillingRule, contractIdForNewRule?: number) => {
    if (rule) {
      setEditingRule(rule);
      setRuleContractId(rule.contract_id);
      setRuleCampaignId(rule.campaign_id);
      setBillingModel(rule.billing_model);
      setRate(rule.rate);
      setPenalty(rule.penalty_per_sla_point);
      setReward(rule.reward_per_sla_point);
      setRuleValidFrom(rule.valid_from);
      setRuleValidTo(rule.valid_to || '');
    } else {
      setEditingRule(null);
      setRuleContractId(contractIdForNewRule || null); // Link to parent contract
      setRuleCampaignId(null);
      setBillingModel('PerFTE');
      setRate(0);
      setPenalty(0);
      setReward(0);
      setRuleValidFrom(new Date().toISOString().split('T')[0]);
      setRuleValidTo('');
    }
    setIsRuleModalOpen(true);
  };

  const handleRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleContractId || !billingModel || rate === 0 || !ruleValidFrom) {
      addToast('Please fill all required billing rule fields', 'error');
      return;
    }

    try {
      const ruleData = {
        contract_id: ruleContractId,
        campaign_id: ruleCampaignId || null,
        billing_model: billingModel,
        rate: rate,
        penalty_per_sla_point: penalty,
        reward_per_sla_point: reward,
        valid_from: ruleValidFrom,
        valid_to: ruleValidTo || null,
      };

      if (editingRule) {
        updateBillingRule(editingRule.id, ruleData);
        addToast('Billing rule updated', 'success');
      } else {
        createBillingRule(ruleData);
        addToast('Billing rule created', 'success');
      }
      setIsRuleModalOpen(false);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      console.error(err);
      addToast('Failed to save billing rule. Check values.', 'error');
    }
  };

  const handleRuleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this billing rule?')) {
      try {
        deleteBillingRule(id);
        addToast('Billing rule deleted', 'success');
        setRefreshKey((key) => key + 1);
      } catch (err) {
        console.error(err);
        addToast('Failed to delete billing rule.', 'error');
      }
    }
  };


  const inputClass = "block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary focus:border-cyan focus:ring-1 focus:ring-cyan";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-text-primary">Contracts</h3>
        <Button onClick={() => openContractModal()}>+ Add Contract</Button>
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-border-subtle">
            <thead className="bg-bg-elevated">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Contract No.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Dates</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Auto-Renew</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {contracts.map((contract) => (
                <>
                  <tr className="hover:bg-bg-hover transition-colors">
                    <td className="px-4 py-3 text-sm text-text-primary font-medium">{contract.contract_number}</td>
                    <td className="px-4 py-3 text-sm text-cyan">
                      {clients.find(c => c.id === contract.client_id)?.client_name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {contract.start_date} - {contract.end_date || 'Ongoing'}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {contract.auto_renew ? 'Yes' : 'No'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button 
                        onClick={() => openContractModal(contract)}
                        className="text-cyan hover:text-cyan-dim text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleContractDelete(contract.id)}
                        className="text-red hover:text-red-400 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {/* Billing Rules for this Contract */}
                  <tr>
                    <td colSpan={5} className="p-0">
                      <div className="bg-bg-elevated p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-xs font-medium text-text-secondary uppercase">Billing Rules</h4>
                          <Button size="sm" onClick={() => openRuleModal(undefined, contract.id)}>+ Add Rule</Button>
                        </div>
                        {getBillingRules(contract.id).length === 0 ? (
                          <p className="text-xs text-text-muted">No billing rules for this contract.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border-muted text-xs">
                              <thead className="bg-bg-hover">
                                <tr>
                                  <th className="px-2 py-1 text-left font-medium text-text-secondary uppercase">Model</th>
                                  <th className="px-2 py-1 text-left font-medium text-text-secondary uppercase">Rate</th>
                                  <th className="px-2 py-1 text-left font-medium text-text-secondary uppercase">Campaign</th>
                                  <th className="px-2 py-1 text-left font-medium text-text-secondary uppercase">Valid From</th>
                                  <th className="px-2 py-1 text-right font-medium text-text-secondary uppercase">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border-muted">
                                {getBillingRules(contract.id).map(rule => (
                                  <tr key={rule.id}>
                                    <td className="px-2 py-1">{rule.billing_model}</td>
                                    <td className="px-2 py-1">{rule.rate} {contract.currency}</td>
                                    <td className="px-2 py-1">{campaigns.find(c => c.id === rule.campaign_id)?.campaign_name || 'All'}</td>
                                    <td className="px-2 py-1">{rule.valid_from}</td>
                                    <td className="px-2 py-1 text-right space-x-1">
                                      <button 
                                        onClick={() => openRuleModal(rule)}
                                        className="text-cyan hover:text-cyan-dim text-2xs font-medium"
                                      >Edit</button>
                                      <button 
                                        onClick={() => handleRuleDelete(rule.id)}
                                        className="text-red hover:text-red-400 text-2xs font-medium"
                                      >Delete</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                </>
              ))}
              {contracts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted text-sm">
                    No contracts found for this client.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalContracts}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* Contract Modal */}
      <Dialog open={isContractModalOpen} onOpenChange={setIsContractModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingContract ? 'Edit Contract' : 'Add New Contract'}</DialogTitle></DialogHeader>
          <form onSubmit={handleContractSubmit} className="space-y-4">
            <FormField label="Client" id="contractClient">
              <select
                id="contractClient"
                value={selectedClientForContract || ''}
                onChange={(e) => setSelectedClientForContract(Number(e.target.value))}
                className={inputClass}
                required
                disabled={!!clientId} // Disable if a specific client is already selected
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.client_name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Contract Number" id="contractNumber">
              <input type="text" id="contractNumber" value={contractNumber} onChange={e => setContractNumber(e.target.value)} className={inputClass} required />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Date" id="contractStartDate">
                <input type="date" id="contractStartDate" value={contractStartDate} onChange={e => setContractStartDate(e.target.value)} className={inputClass} required />
              </FormField>
              <FormField label="End Date" id="contractEndDate">
                <input type="date" id="contractEndDate" value={contractEndDate} onChange={e => setContractEndDate(e.target.value)} className={inputClass} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Currency" id="currency">
                <input type="text" id="currency" value={currency} onChange={e => setCurrency(e.target.value)} className={inputClass} />
              </FormField>
              <FormField label="Notice Period (days)" id="noticePeriod">
                <input type="number" id="noticePeriod" value={noticePeriod} onChange={e => setNoticePeriod(Number(e.target.value))} className={inputClass} />
              </FormField>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="autoRenew" checked={autoRenew} onChange={e => setAutoRenew(e.target.checked)} className="rounded bg-bg-surface border-border-subtle text-cyan focus:ring-cyan" />
              <label htmlFor="autoRenew" className="text-sm text-text-primary">Auto Renew</label>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsContractModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Contract</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Billing Rule Modal */}
      <Dialog open={isRuleModalOpen} onOpenChange={setIsRuleModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingRule ? 'Edit Billing Rule' : 'Add New Billing Rule'}</DialogTitle></DialogHeader>
          <form onSubmit={handleRuleSubmit} className="space-y-4">
            <FormField label="Contract" id="ruleContractId">
              <select
                id="ruleContractId"
                value={ruleContractId || ''}
                onChange={(e) => setRuleContractId(Number(e.target.value))}
                className={inputClass}
                required
              >
                <option value="">Select Contract</option>
                {contracts.map(contract => ( // Only show contracts for the current client, or all if no client filter
                  <option key={contract.id} value={contract.id}>{contract.contract_number}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Billing Model" id="billingModel">
              <select
                id="billingModel"
                value={billingModel}
                onChange={(e) => setBillingModel(e.target.value)}
                className={inputClass}
                required
              >
                {BILLING_MODELS.map(model => <option key={model} value={model}>{model}</option>)}
              </select>
            </FormField>
            <FormField label="Rate" id="rate">
              <input type="number" id="rate" value={rate} onChange={e => setRate(Number(e.target.value))} className={inputClass} required />
            </FormField>
            <FormField label="Campaign (Optional)" id="ruleCampaignId">
              <select
                id="ruleCampaignId"
                value={ruleCampaignId || ''}
                onChange={(e) => setRuleCampaignId(e.target.value ? Number(e.target.value) : null)}
                className={inputClass}
              >
                <option value="">All Campaigns</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>{campaign.campaign_name}</option>
                ))}
              </select>
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Valid From" id="ruleValidFrom">
                <input type="date" id="ruleValidFrom" value={ruleValidFrom} onChange={e => setRuleValidFrom(e.target.value)} className={inputClass} required />
              </FormField>
              <FormField label="Valid To" id="ruleValidTo">
                <input type="date" id="ruleValidTo" value={ruleValidTo} onChange={e => setRuleValidTo(e.target.value)} className={inputClass} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Penalty per SL point" id="penalty">
                <input type="number" id="penalty" value={penalty} onChange={e => setPenalty(Number(e.target.value))} className={inputClass} />
              </FormField>
              <FormField label="Reward per SL point" id="reward">
                <input type="number" id="reward" value={reward} onChange={e => setReward(Number(e.target.value))} className={inputClass} />
              </FormField>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsRuleModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Rule</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
