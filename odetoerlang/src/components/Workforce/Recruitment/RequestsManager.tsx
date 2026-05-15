import { useMemo, useState } from 'react';
import { Button } from '../../ui/Button';
import { FormField } from '../../ui/FormField';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/Dialog';
import { NumberInput } from '../../ui/NumberInput';
import { PaginationControls } from '../../ui/PaginationControls';
import {
  getRecruitmentRequests,
  createRecruitmentRequest,
  updateRecruitmentRequest,
  deleteRecruitmentRequest,
  getRoles,
  getCampaigns,
  type RecruitmentRequest,
  type Role,
  type Campaign,
} from '../../../lib/database/dataAccess';
import { toLocalDateString } from '../../../lib/dateUtils';
import { useToast } from '../../ui/Toast';
import { useEntityForm } from '../../../hooks/useEntityForm';

type RequestStatus = 'Open' | 'InProgress' | 'Filled' | 'Cancelled';

interface RequestFormValues extends Record<string, unknown> {
  role_id: number | null;
  campaign_id: number | null;
  quantity_requested: number;
  requested_date: string;
  target_start_date: string;
  status: RequestStatus;
  notes: string;
}

const REQUEST_EMPTY_DEFAULTS: RequestFormValues = {
  role_id: null,
  campaign_id: null,
  quantity_requested: 1,
  requested_date: '',
  target_start_date: '',
  status: 'Open',
  notes: '',
};

const toRequestPayload = (values: RequestFormValues) => ({
  role_id: values.role_id as number,
  campaign_id: values.campaign_id,
  quantity_requested: values.quantity_requested,
  requested_date: values.requested_date,
  target_start_date: values.target_start_date || null,
  status: values.status,
  notes: values.notes || null,
});

export default function RequestsManager() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | undefined>(undefined);
  const [deleteTick, setDeleteTick] = useState(0);
  const itemsPerPage = 10;
  const { addToast } = useToast();

  const roles: Role[] = useMemo(() => {
    void deleteTick;
    return getRoles();
  }, [deleteTick]);
  const campaigns: Campaign[] = useMemo(() => {
    void deleteTick;
    return getCampaigns(true);
  }, [deleteTick]);

  const form = useEntityForm<RecruitmentRequest, RequestFormValues>({
    defaults: REQUEST_EMPTY_DEFAULTS,
    toFormValues: (request) => ({
      role_id: request.role_id,
      campaign_id: request.campaign_id,
      quantity_requested: request.quantity_requested,
      requested_date: request.requested_date,
      target_start_date: request.target_start_date || '',
      status: request.status,
      notes: request.notes || '',
    }),
    createFn: (values) => createRecruitmentRequest(toRequestPayload(values)),
    updateFn: (id, values) => updateRecruitmentRequest(id, toRequestPayload(values)),
    validate: (values) => (values.role_id ? null : 'Please select a role'),
    onSuccess: (mode) => addToast(mode === 'create' ? 'Request created' : 'Request updated', 'success'),
    onError: (_mode, err) => {
      console.error(err);
      addToast('Failed to save request', 'error');
    },
  });

  const { data: requests, total: totalRequests } = useMemo(() => {
    void form.refreshKey;
    void deleteTick;
    const offset = (currentPage - 1) * itemsPerPage;
    return getRecruitmentRequests(statusFilter, itemsPerPage, offset);
  }, [currentPage, itemsPerPage, form.refreshKey, statusFilter, deleteTick]);

  const totalPages = Math.ceil(totalRequests / itemsPerPage);

  const openCreate = () => {
    form.open();
    form.setValues({
      ...REQUEST_EMPTY_DEFAULTS,
      role_id: roles.length > 0 ? roles[0]!.id : null,
      requested_date: toLocalDateString(),
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this hiring request?')) {
      try {
        deleteRecruitmentRequest(id);
        addToast('Request deleted', 'success');
        setDeleteTick((k) => k + 1);
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
          <Button onClick={openCreate}>+ New Request</Button>
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
                    <button onClick={() => form.open(req)} className="text-cyan hover:text-cyan-dim text-xs">
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

      <Dialog open={form.isOpen} onOpenChange={(open) => (open ? form.open(form.editing ?? undefined) : form.close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.editing ? 'Edit Request' : 'New Hiring Request'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Role" id="roleId">
                <select
                  id="roleId"
                  value={form.values.role_id ?? ''}
                  onChange={(e) => form.setField('role_id', e.target.value ? Number(e.target.value) : null)}
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
                  value={form.values.campaign_id ?? ''}
                  onChange={(e) => form.setField('campaign_id', e.target.value ? Number(e.target.value) : null)}
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
                <NumberInput
                  id="quantity"
                  min="1"
                  value={form.values.quantity_requested}
                  onChange={(e) => form.setField('quantity_requested', parseInt(e.target.value))}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary"
                  required
                />
              </FormField>
              <FormField label="Requested Date" id="requestedDate">
                <input
                  id="requestedDate"
                  type="date"
                  value={form.values.requested_date}
                  onChange={(e) => form.setField('requested_date', e.target.value)}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary"
                  required
                />
              </FormField>
              <FormField label="Target Start" id="targetDate">
                <input
                  id="targetDate"
                  type="date"
                  value={form.values.target_start_date}
                  onChange={(e) => form.setField('target_start_date', e.target.value)}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary"
                />
              </FormField>
            </div>

            <FormField label="Status" id="status">
              <select
                id="status"
                value={form.values.status}
                onChange={(e) => form.setField('status', e.target.value as RequestStatus)}
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
                value={form.values.notes}
                onChange={(e) => form.setField('notes', e.target.value)}
                rows={3}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary"
                placeholder="Additional details..."
              />
            </FormField>

            {form.error && (
              <p className="text-xs text-red">{form.error}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={form.close}>
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
