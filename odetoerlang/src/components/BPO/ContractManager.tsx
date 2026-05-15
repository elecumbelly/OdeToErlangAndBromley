import { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { PaginationControls } from '../ui/PaginationControls';
import { NumberInput } from '../ui/NumberInput';
import {
  getContracts, createContract, updateContract, deleteContract,
  getBillingRules, createBillingRule, updateBillingRule, deleteBillingRule,
  getClients, getCampaigns,
  type Contract, type BillingRule, type Client, type Campaign,
} from '../../lib/database/dataAccess';
import { useToast } from '../ui/Toast';
import { toLocalDateString } from '../../lib/dateUtils';
import { useEntityForm } from '../../hooks/useEntityForm';

interface ContractManagerProps {
  clientId: number | null;
}

const BILLING_MODELS = ['PerSeat', 'PerFTE', 'PerHour', 'PerHandleMinute', 'PerTransaction', 'Outcome', 'Hybrid'];

interface ContractFormValues extends Record<string, unknown> {
  client_id: number | null;
  contract_number: string;
  start_date: string;
  end_date: string;
  currency: string;
  auto_renew: boolean;
  notice_period_days: number;
}

interface BillingRuleFormValues extends Record<string, unknown> {
  contract_id: number | null;
  campaign_id: number | null;
  billing_model: string;
  rate: number;
  penalty_per_sla_point: number;
  reward_per_sla_point: number;
  valid_from: string;
  valid_to: string;
}

const inputClass = 'block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary focus:border-cyan focus:ring-1 focus:ring-cyan';

export default function ContractManager({ clientId }: ContractManagerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const { addToast } = useToast();

  const contractForm = useEntityForm<Contract, ContractFormValues>({
    defaults: {
      client_id: clientId,
      contract_number: '',
      start_date: toLocalDateString(),
      end_date: '',
      currency: 'GBP',
      auto_renew: false,
      notice_period_days: 90,
    },
    toFormValues: (contract) => ({
      client_id: contract.client_id,
      contract_number: contract.contract_number,
      start_date: contract.start_date,
      end_date: contract.end_date ?? '',
      currency: contract.currency,
      auto_renew: Boolean(contract.auto_renew),
      notice_period_days: contract.notice_period_days,
    }),
    validate: (values) => {
      if (!values.client_id) return 'Client is required';
      if (!values.contract_number.trim()) return 'Contract number is required';
      if (!values.start_date) return 'Start date is required';
      return null;
    },
    createFn: (values) =>
      createContract({
        client_id: values.client_id as number,
        contract_number: values.contract_number,
        start_date: values.start_date,
        end_date: values.end_date || null,
        currency: values.currency,
        auto_renew: values.auto_renew,
        notice_period_days: values.notice_period_days,
      }),
    updateFn: (id, values) =>
      updateContract(id, {
        client_id: values.client_id as number,
        contract_number: values.contract_number,
        start_date: values.start_date,
        end_date: values.end_date || null,
        currency: values.currency,
        auto_renew: values.auto_renew,
        notice_period_days: values.notice_period_days,
      }),
    onSuccess: (mode) => addToast(mode === 'create' ? 'Contract created' : 'Contract updated', 'success'),
    onError: (_mode, err) => {
      console.error(err);
      addToast('Failed to save contract. Contract number must be unique.', 'error');
    },
  });

  const ruleForm = useEntityForm<BillingRule, BillingRuleFormValues>({
    defaults: {
      contract_id: null,
      campaign_id: null,
      billing_model: 'PerFTE',
      rate: 0,
      penalty_per_sla_point: 0,
      reward_per_sla_point: 0,
      valid_from: toLocalDateString(),
      valid_to: '',
    },
    toFormValues: (rule) => ({
      contract_id: rule.contract_id,
      campaign_id: rule.campaign_id,
      billing_model: rule.billing_model,
      rate: rule.rate,
      penalty_per_sla_point: rule.penalty_per_sla_point,
      reward_per_sla_point: rule.reward_per_sla_point,
      valid_from: rule.valid_from,
      valid_to: rule.valid_to ?? '',
    }),
    validate: (values) => {
      if (!values.contract_id) return 'Contract is required';
      if (!values.billing_model) return 'Billing model is required';
      if (values.rate === 0) return 'Rate must be non-zero';
      if (!values.valid_from) return 'Valid-from date is required';
      return null;
    },
    createFn: (values) =>
      createBillingRule({
        contract_id: values.contract_id as number,
        campaign_id: values.campaign_id ?? null,
        billing_model: values.billing_model,
        rate: values.rate,
        penalty_per_sla_point: values.penalty_per_sla_point,
        reward_per_sla_point: values.reward_per_sla_point,
        valid_from: values.valid_from,
        valid_to: values.valid_to || null,
      }),
    updateFn: (id, values) =>
      updateBillingRule(id, {
        contract_id: values.contract_id as number,
        campaign_id: values.campaign_id ?? null,
        billing_model: values.billing_model,
        rate: values.rate,
        penalty_per_sla_point: values.penalty_per_sla_point,
        reward_per_sla_point: values.reward_per_sla_point,
        valid_from: values.valid_from,
        valid_to: values.valid_to || null,
      }),
    onSuccess: (mode) =>
      addToast(mode === 'create' ? 'Billing rule created' : 'Billing rule updated', 'success'),
    onError: (_mode, err) => {
      console.error(err);
      addToast('Failed to save billing rule. Check values.', 'error');
    },
  });

  // Either form's success ticks its own refreshKey; combine for the table queries.
  const combinedRefresh = contractForm.refreshKey + ruleForm.refreshKey;

  const { data: contracts, total: totalContracts } = useMemo(() => {
    void combinedRefresh;
    const offset = (currentPage - 1) * itemsPerPage;
    return getContracts(clientId ?? null, itemsPerPage, offset);
  }, [clientId, currentPage, combinedRefresh]);

  const campaigns: Campaign[] = useMemo(() => {
    void combinedRefresh;
    return getCampaigns(false);
  }, [combinedRefresh]);

  const clients: Client[] = useMemo(() => {
    void combinedRefresh;
    return getClients(false, 1000, 0).data;
  }, [combinedRefresh]);

  const totalPages = Math.ceil(totalContracts / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleContractDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this contract and all its billing rules?')) {
      try {
        deleteContract(id);
        addToast('Contract deleted', 'success');
        contractForm.bumpRefresh();
      } catch (err) {
        console.error(err);
        addToast('Failed to delete contract. It might have associated entities.', 'error');
      }
    }
  };

  const handleRuleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this billing rule?')) {
      try {
        deleteBillingRule(id);
        addToast('Billing rule deleted', 'success');
        ruleForm.bumpRefresh();
      } catch (err) {
        console.error(err);
        addToast('Failed to delete billing rule.', 'error');
      }
    }
  };

  const openRuleForContract = (contractIdForNewRule: number) => {
    ruleForm.open();
    ruleForm.setField('contract_id', contractIdForNewRule);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-text-primary">Contracts</h3>
        <Button onClick={() => contractForm.open()}>+ Add Contract</Button>
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
                      {clients.find((c) => c.id === contract.client_id)?.client_name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {contract.start_date} - {contract.end_date || 'Ongoing'}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {contract.auto_renew ? 'Yes' : 'No'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => contractForm.open(contract)}
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
                  <tr>
                    <td colSpan={5} className="p-0">
                      <div className="bg-bg-elevated p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-xs font-medium text-text-secondary uppercase">Billing Rules</h4>
                          <Button size="sm" onClick={() => openRuleForContract(contract.id)}>+ Add Rule</Button>
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
                                {getBillingRules(contract.id).map((rule) => (
                                  <tr key={rule.id}>
                                    <td className="px-2 py-1">{rule.billing_model}</td>
                                    <td className="px-2 py-1">{rule.rate} {contract.currency}</td>
                                    <td className="px-2 py-1">{campaigns.find((c) => c.id === rule.campaign_id)?.campaign_name || 'All'}</td>
                                    <td className="px-2 py-1">{rule.valid_from}</td>
                                    <td className="px-2 py-1 text-right space-x-1">
                                      <button
                                        onClick={() => ruleForm.open(rule)}
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
      <Dialog open={contractForm.isOpen} onOpenChange={(open) => (open ? null : contractForm.close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{contractForm.editing ? 'Edit Contract' : 'Add New Contract'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={contractForm.submit} className="space-y-4">
            <FormField label="Client" id="contractClient">
              <select
                id="contractClient"
                value={contractForm.values.client_id ?? ''}
                onChange={(e) => contractForm.setField('client_id', Number(e.target.value))}
                className={inputClass}
                required
                disabled={!!clientId}
              >
                <option value="">Select Client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.client_name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Contract Number" id="contractNumber">
              <input
                type="text"
                id="contractNumber"
                value={contractForm.values.contract_number}
                onChange={(e) => contractForm.setField('contract_number', e.target.value)}
                className={inputClass}
                required
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Date" id="contractStartDate">
                <input
                  type="date"
                  id="contractStartDate"
                  value={contractForm.values.start_date}
                  onChange={(e) => contractForm.setField('start_date', e.target.value)}
                  className={inputClass}
                  required
                />
              </FormField>
              <FormField label="End Date" id="contractEndDate">
                <input
                  type="date"
                  id="contractEndDate"
                  value={contractForm.values.end_date}
                  onChange={(e) => contractForm.setField('end_date', e.target.value)}
                  className={inputClass}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Currency" id="currency">
                <input
                  type="text"
                  id="currency"
                  value={contractForm.values.currency}
                  onChange={(e) => contractForm.setField('currency', e.target.value)}
                  className={inputClass}
                />
              </FormField>
              <FormField label="Notice Period (days)" id="noticePeriod">
                <NumberInput
                  id="noticePeriod"
                  value={contractForm.values.notice_period_days}
                  onChange={(e) => contractForm.setField('notice_period_days', Number(e.target.value))}
                  className={inputClass}
                />
              </FormField>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoRenew"
                checked={contractForm.values.auto_renew}
                onChange={(e) => contractForm.setField('auto_renew', e.target.checked)}
                className="rounded bg-bg-surface border-border-subtle text-cyan focus:ring-cyan"
              />
              <label htmlFor="autoRenew" className="text-sm text-text-primary">Auto Renew</label>
            </div>
            {contractForm.error && (
              <p className="text-xs text-red">{contractForm.error}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={contractForm.close}>Cancel</Button>
              <Button type="submit">Save Contract</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Billing Rule Modal */}
      <Dialog open={ruleForm.isOpen} onOpenChange={(open) => (open ? null : ruleForm.close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ruleForm.editing ? 'Edit Billing Rule' : 'Add New Billing Rule'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={ruleForm.submit} className="space-y-4">
            <FormField label="Contract" id="ruleContractId">
              <select
                id="ruleContractId"
                value={ruleForm.values.contract_id ?? ''}
                onChange={(e) => ruleForm.setField('contract_id', Number(e.target.value))}
                className={inputClass}
                required
              >
                <option value="">Select Contract</option>
                {contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>{contract.contract_number}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Billing Model" id="billingModel">
              <select
                id="billingModel"
                value={ruleForm.values.billing_model}
                onChange={(e) => ruleForm.setField('billing_model', e.target.value)}
                className={inputClass}
                required
              >
                {BILLING_MODELS.map((model) => <option key={model} value={model}>{model}</option>)}
              </select>
            </FormField>
            <FormField label="Rate" id="rate">
              <NumberInput
                id="rate"
                value={ruleForm.values.rate}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  ruleForm.setField('rate', isNaN(val) ? 0 : val);
                }}
                className={inputClass}
                required
              />
            </FormField>
            <FormField label="Campaign (Optional)" id="ruleCampaignId">
              <select
                id="ruleCampaignId"
                value={ruleForm.values.campaign_id ?? ''}
                onChange={(e) => ruleForm.setField('campaign_id', e.target.value ? Number(e.target.value) : null)}
                className={inputClass}
              >
                <option value="">All Campaigns</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>{campaign.campaign_name}</option>
                ))}
              </select>
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Valid From" id="ruleValidFrom">
                <input
                  type="date"
                  id="ruleValidFrom"
                  value={ruleForm.values.valid_from}
                  onChange={(e) => ruleForm.setField('valid_from', e.target.value)}
                  className={inputClass}
                  required
                />
              </FormField>
              <FormField label="Valid To" id="ruleValidTo">
                <input
                  type="date"
                  id="ruleValidTo"
                  value={ruleForm.values.valid_to}
                  onChange={(e) => ruleForm.setField('valid_to', e.target.value)}
                  className={inputClass}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Penalty per SL point" id="penalty">
                <NumberInput
                  id="penalty"
                  value={ruleForm.values.penalty_per_sla_point}
                  onChange={(e) => ruleForm.setField('penalty_per_sla_point', Number(e.target.value))}
                  className={inputClass}
                />
              </FormField>
              <FormField label="Reward per SL point" id="reward">
                <NumberInput
                  id="reward"
                  value={ruleForm.values.reward_per_sla_point}
                  onChange={(e) => ruleForm.setField('reward_per_sla_point', Number(e.target.value))}
                  className={inputClass}
                />
              </FormField>
            </div>
            {ruleForm.error && (
              <p className="text-xs text-red">{ruleForm.error}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={ruleForm.close}>Cancel</Button>
              <Button type="submit">Save Rule</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
