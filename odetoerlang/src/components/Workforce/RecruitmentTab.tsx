import { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { PaginationControls } from '../ui/PaginationControls';
import {
  getRecruitmentStages,
  getRecruitmentRequests,
  createRecruitmentStage,
  updateRecruitmentStage,
  deleteRecruitmentStage,
  createRecruitmentRequest,
  updateRecruitmentRequest,
  deleteRecruitmentRequest,
  getRoles,
  getCampaigns,
  type RecruitmentStage,
  type RecruitmentRequest,
  type Role,
  type Campaign
} from '../../lib/database/dataAccess';
import { useToast } from '../ui/Toast';

type ActiveView = 'pipeline' | 'requests';
type RequestStatus = 'Open' | 'InProgress' | 'Filled' | 'Cancelled';

export default function RecruitmentTab() {
  const [activeView, setActiveView] = useState<ActiveView>('pipeline');

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b border-border-subtle">
        <button
          onClick={() => setActiveView('pipeline')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeView === 'pipeline'
              ? 'border-cyan text-cyan'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-active'
          }`}
        >
          Pipeline Stages
        </button>
        <button
          onClick={() => setActiveView('requests')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeView === 'requests'
              ? 'border-cyan text-cyan'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-active'
          }`}
        >
          Hiring Requests
        </button>
      </div>

      <div className="animate-fade-in">
        {activeView === 'pipeline' ? <PipelineManager /> : <RequestsManager />}
      </div>
    </div>
  );
}

// ============================================================================
// Pipeline Stages Manager
// ============================================================================

function PipelineManager() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<RecruitmentStage | null>(null);
  const { addToast } = useToast();

  const stages: RecruitmentStage[] = useMemo(() => {
    void refreshKey;
    return getRecruitmentStages();
  }, [refreshKey]);

  // Form state
  const [stageName, setStageName] = useState('');
  const [stageOrder, setStageOrder] = useState(1);
  const [passRate, setPassRate] = useState(0.7);
  const [avgDays, setAvgDays] = useState<number | null>(5);

  const openModal = (stage?: RecruitmentStage) => {
    if (stage) {
      setEditingStage(stage);
      setStageName(stage.stage_name);
      setStageOrder(stage.stage_order);
      setPassRate(stage.pass_rate);
      setAvgDays(stage.avg_duration_days);
    } else {
      setEditingStage(null);
      setStageName('');
      setStageOrder(stages.length + 1);
      setPassRate(0.7);
      setAvgDays(5);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        stage_name: stageName,
        stage_order: stageOrder,
        pass_rate: passRate,
        avg_duration_days: avgDays
      };

      if (editingStage) {
        updateRecruitmentStage(editingStage.id, data);
        addToast('Stage updated', 'success');
      } else {
        createRecruitmentStage(data);
        addToast('Stage created', 'success');
      }
      setIsModalOpen(false);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      console.error(err);
      addToast('Failed to save stage', 'error');
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this pipeline stage?')) {
      try {
        deleteRecruitmentStage(id);
        addToast('Stage deleted', 'success');
        setRefreshKey((key) => key + 1);
      } catch (err) {
        console.error(err);
        addToast('Failed to delete stage', 'error');
      }
    }
  };

  // Calculate cumulative pass rate
  const getCumulativeRate = (index: number): number => {
    let cumulative = 1;
    for (let i = 0; i <= index; i++) {
      cumulative *= stages[i].pass_rate;
    }
    return cumulative;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Recruitment Pipeline</h3>
          <p className="text-sm text-text-secondary">Define hiring stages and conversion rates</p>
        </div>
        <Button onClick={() => openModal()}>+ Add Stage</Button>
      </div>

      {stages.length === 0 ? (
        <div className="bg-bg-surface border border-border-subtle rounded-lg p-8 text-center">
          <p className="text-text-muted mb-4">No pipeline stages defined yet.</p>
          <Button onClick={() => openModal()}>Create First Stage</Button>
        </div>
      ) : (
        <div className="bg-bg-surface border border-border-subtle rounded-lg overflow-hidden">
          {/* Pipeline visualization */}
          <div className="p-4 border-b border-border-subtle bg-bg-elevated">
            <div className="flex items-center space-x-2 overflow-x-auto">
              {stages.map((stage, idx) => (
                <div key={stage.id} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[100px]">
                    <div className="w-10 h-10 rounded-full bg-cyan/20 border border-cyan/40 flex items-center justify-center text-cyan font-bold text-sm">
                      {idx + 1}
                    </div>
                    <span className="text-xs text-text-primary mt-1 text-center">{stage.stage_name}</span>
                    <span className="text-2xs text-green">{(stage.pass_rate * 100).toFixed(0)}%</span>
                  </div>
                  {idx < stages.length - 1 && (
                    <div className="w-8 h-0.5 bg-border-subtle mx-1" />
                  )}
                </div>
              ))}
              <div className="flex flex-col items-center min-w-[80px] opacity-60">
                <div className="w-10 h-10 rounded-full bg-green/20 border border-green/40 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs text-text-secondary mt-1">Hired</span>
                <span className="text-2xs text-green">
                  {(getCumulativeRate(stages.length - 1) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <table className="min-w-full divide-y divide-border-subtle">
            <thead className="bg-bg-subtle">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Pass Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Cumulative</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Avg Days</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {stages.map((stage, idx) => (
                <tr key={stage.id} className="hover:bg-bg-hover">
                  <td className="px-4 py-3 text-sm text-text-secondary">{stage.stage_order}</td>
                  <td className="px-4 py-3 text-sm text-text-primary font-medium">{stage.stage_name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-cyan">{(stage.pass_rate * 100).toFixed(0)}%</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={getCumulativeRate(idx) < 0.3 ? 'text-yellow' : 'text-green'}>
                      {(getCumulativeRate(idx) * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {stage.avg_duration_days ?? '-'} days
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openModal(stage)} className="text-cyan hover:text-cyan-dim text-xs">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(stage.id)} className="text-red hover:text-red-400 text-xs">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStage ? 'Edit Stage' : 'Add Pipeline Stage'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Stage Name" id="stageName">
              <input
                id="stageName"
                type="text"
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                placeholder="e.g., Phone Screen, Technical Interview"
                className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary"
                required
              />
            </FormField>

            <div className="grid grid-cols-3 gap-4">
              <FormField label="Order" id="stageOrder">
                <input
                  id="stageOrder"
                  type="number"
                  min="1"
                  value={stageOrder}
                  onChange={(e) => setStageOrder(parseInt(e.target.value))}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary"
                  required
                />
              </FormField>
              <FormField label="Pass Rate" id="passRate">
                <input
                  id="passRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={passRate}
                  onChange={(e) => setPassRate(parseFloat(e.target.value))}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary"
                  required
                />
              </FormField>
              <FormField label="Avg Days" id="avgDays">
                <input
                  id="avgDays"
                  type="number"
                  min="0"
                  value={avgDays ?? ''}
                  onChange={(e) => setAvgDays(e.target.value ? parseInt(e.target.value) : null)}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary"
                />
              </FormField>
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Stage</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// Hiring Requests Manager
// ============================================================================

function RequestsManager() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<RecruitmentRequest | null>(null);
  const { addToast } = useToast();

  const { data: requests, total: totalRequests } = useMemo(() => {
    void refreshKey;
    const offset = (currentPage - 1) * itemsPerPage;
    return getRecruitmentRequests(statusFilter, itemsPerPage, offset);
  }, [currentPage, itemsPerPage, refreshKey, statusFilter]);

  const roles: Role[] = useMemo(() => {
    void refreshKey;
    return getRoles();
  }, [refreshKey]);
  const campaigns: Campaign[] = useMemo(() => {
    void refreshKey;
    return getCampaigns(true);
  }, [refreshKey]);

  // Form state
  const [roleId, setRoleId] = useState<number | null>(null);
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [requestedDate, setRequestedDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState<RequestStatus>('Open');
  const [notes, setNotes] = useState('');

  const totalPages = Math.ceil(totalRequests / itemsPerPage);

  const openModal = (request?: RecruitmentRequest) => {
    if (request) {
      setEditingRequest(request);
      setRoleId(request.role_id);
      setCampaignId(request.campaign_id);
      setQuantity(request.quantity_requested);
      setRequestedDate(request.requested_date);
      setTargetDate(request.target_start_date || '');
      setStatus(request.status);
      setNotes(request.notes || '');
    } else {
      setEditingRequest(null);
      setRoleId(roles.length > 0 ? roles[0].id : null);
      setCampaignId(null);
      setQuantity(1);
      setRequestedDate(new Date().toISOString().split('T')[0]);
      setTargetDate('');
      setStatus('Open');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleId) {
      addToast('Please select a role', 'error');
      return;
    }

    try {
      const data = {
        role_id: roleId,
        campaign_id: campaignId,
        quantity_requested: quantity,
        requested_date: requestedDate,
        target_start_date: targetDate || null,
        status,
        notes: notes || null
      };

      if (editingRequest) {
        updateRecruitmentRequest(editingRequest.id, data);
        addToast('Request updated', 'success');
      } else {
        createRecruitmentRequest(data);
        addToast('Request created', 'success');
      }
      setIsModalOpen(false);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      console.error(err);
      addToast('Failed to save request', 'error');
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this hiring request?')) {
      try {
        deleteRecruitmentRequest(id);
        addToast('Request deleted', 'success');
        setRefreshKey((key) => key + 1);
      } catch (err) {
        console.error(err);
        addToast('Failed to delete request', 'error');
      }
    }
  };

  const getStatusColor = (s: RequestStatus) => {
    switch (s) {
      case 'Open': return 'bg-cyan/10 text-cyan';
      case 'InProgress': return 'bg-yellow/10 text-yellow';
      case 'Filled': return 'bg-green/10 text-green';
      case 'Cancelled': return 'bg-red/10 text-red';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Hiring Requests</h3>
          <p className="text-sm text-text-secondary">Track open positions and hiring progress</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={statusFilter || ''}
            onChange={(e) => {
              setStatusFilter(e.target.value as RequestStatus || undefined);
              setCurrentPage(1);
            }}
            className="rounded-md bg-bg-surface border border-border-subtle px-3 py-1.5 text-sm text-text-primary"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="InProgress">In Progress</option>
            <option value="Filled">Filled</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <Button onClick={() => openModal()}>+ New Request</Button>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-border-subtle">
            <thead className="bg-bg-elevated">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Campaign</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Requested</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Target Start</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-bg-hover transition-colors">
                  <td className="px-4 py-3 text-sm text-text-primary font-medium">
                    {roles.find(r => r.id === req.role_id)?.role_name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {req.campaign_id
                      ? campaigns.find(c => c.id === req.campaign_id)?.campaign_name || '-'
                      : 'General'}
                  </td>
                  <td className="px-4 py-3 text-sm text-cyan font-mono">{req.quantity_requested}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{req.requested_date}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{req.target_start_date || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openModal(req)} className="text-cyan hover:text-cyan-dim text-xs">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(req.id)} className="text-red hover:text-red-400 text-xs">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-muted text-sm">
                    No hiring requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalRequests}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
        />
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRequest ? 'Edit Request' : 'New Hiring Request'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Role" id="roleId">
                <select
                  id="roleId"
                  value={roleId || ''}
                  onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : null)}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary"
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.role_name}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Campaign (Optional)" id="campaignId">
                <select
                  id="campaignId"
                  value={campaignId || ''}
                  onChange={(e) => setCampaignId(e.target.value ? Number(e.target.value) : null)}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary"
                >
                  <option value="">General Hire</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.campaign_name}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField label="Quantity" id="quantity">
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary"
                  required
                />
              </FormField>
              <FormField label="Requested Date" id="requestedDate">
                <input
                  id="requestedDate"
                  type="date"
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary"
                  required
                />
              </FormField>
              <FormField label="Target Start" id="targetDate">
                <input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary"
                />
              </FormField>
            </div>

            <FormField label="Status" id="status">
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as RequestStatus)}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary"
              >
                <option value="Open">Open</option>
                <option value="InProgress">In Progress</option>
                <option value="Filled">Filled</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </FormField>

            <FormField label="Notes" id="notes">
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary"
                placeholder="Additional details..."
              />
            </FormField>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
