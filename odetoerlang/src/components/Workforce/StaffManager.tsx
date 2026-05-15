import { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { NumberInput } from '../ui/NumberInput';
import { PaginationControls } from '../ui/PaginationControls';
import {
  getStaff, getRoles, createStaff, updateStaff, deleteStaff,
  type Staff, type Role
} from '../../lib/database/dataAccess';
import { useToast } from '../ui/Toast';
import { toLocalDateString } from '../../lib/dateUtils';
import { useEntityForm } from '../../hooks/useEntityForm';

interface StaffFormValues extends Record<string, unknown> {
  first_name: string;
  last_name: string;
  employee_id: string;
  primary_role_id: number | null;
  start_date: string;
  attrition_probability: number;
}

const EMPTY_DEFAULTS: StaffFormValues = {
  first_name: '',
  last_name: '',
  employee_id: '',
  primary_role_id: null,
  start_date: '',
  attrition_probability: 0.15,
};

const buildCreateValues = (roles: Role[]): StaffFormValues => ({
  first_name: '',
  last_name: '',
  employee_id: `EMP-${Math.floor(Math.random() * 10000)}`,
  primary_role_id: roles.length > 0 ? roles[0]!.id : null,
  start_date: toLocalDateString(),
  attrition_probability: 0.15,
});

const toPersistencePayload = (values: StaffFormValues) => ({
  employee_id: values.employee_id,
  first_name: values.first_name,
  last_name: values.last_name,
  primary_role_id: values.primary_role_id as number,
  employment_type: 'Full-time',
  manager_id: null,
  start_date: values.start_date,
  end_date: null,
  site_id: null,
  attrition_probability: values.attrition_probability,
});

export default function StaffManager() {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTick, setDeleteTick] = useState(0);
  const itemsPerPage = 10;
  const { addToast } = useToast();

  const roles: Role[] = useMemo(() => {
    void deleteTick;
    return getRoles();
  }, [deleteTick]);

  const form = useEntityForm<Staff, StaffFormValues>({
    defaults: EMPTY_DEFAULTS,
    toFormValues: (staff) => ({
      first_name: staff.first_name,
      last_name: staff.last_name,
      employee_id: staff.employee_id,
      primary_role_id: staff.primary_role_id,
      start_date: staff.start_date,
      attrition_probability: staff.attrition_probability,
    }),
    createFn: (values) => createStaff(toPersistencePayload(values)),
    updateFn: (id, values) => updateStaff(id, toPersistencePayload(values)),
    validate: (values) => (values.primary_role_id ? null : 'Please select a role'),
    onSuccess: (mode) => addToast(mode === 'create' ? 'Staff added' : 'Staff updated', 'success'),
    onError: (_mode, err) => {
      console.error(err);
      addToast('Failed to save staff member. ID must be unique.', 'error');
    },
  });

  const { data: staffList, total: totalStaff } = useMemo(() => {
    void form.refreshKey;
    void deleteTick;
    const offset = (currentPage - 1) * itemsPerPage;
    return getStaff(false, itemsPerPage, offset);
  }, [currentPage, itemsPerPage, form.refreshKey, deleteTick]);

  const totalPages = Math.ceil(totalStaff / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openCreate = () => {
    form.open();
    form.setValues(buildCreateValues(roles));
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      try {
        deleteStaff(id);
        addToast('Staff removed', 'success');
        setDeleteTick((k) => k + 1);
      } catch (err) {
        console.error(err);
        addToast('Failed to delete staff. It might be assigned to events.', 'error');
      }
    }
  };

  const handleLoadDemo = () => {
    try {
      const demoNames = [
        ['James', 'Holden'], ['Naomi', 'Nagata'], ['Amos', 'Burton'], ['Alex', 'Kamal'],
        ['Chrisjen', 'Avasarala'], ['Bobbie', 'Draper'], ['Camina', 'Drummer'], ['Fred', 'Johnson'],
        ['Clarissa', 'Mao'], ['Marco', 'Inaros'], ['Filip', 'Inaros'], ['Prax', 'Meng'],
        ['Anna', 'Volovodov'], ['Elvi', 'Okoye'], ['Fayez', 'Sarkis'], ['Josephus', 'Miller'],
        ['Julie', 'Mao'], ['Anderson', 'Dawes'], ['Solomon', 'Epstein'], ['Winston', 'Duarte']
      ];

      const defaultRoleId = roles.length > 0 ? roles[0]!.id : 1;

      demoNames.forEach(([first, last], index) => {
        createStaff({
          employee_id: `DEMO-${100 + index}`,
          first_name: first!,
          last_name: last!,
          primary_role_id: defaultRoleId,
          employment_type: 'Full-time',
          manager_id: null,
          start_date: toLocalDateString(),
          end_date: null,
          site_id: null,
          attrition_probability: Math.random() * 0.3
        });
      });

      addToast('Loaded 20 demo staff members', 'success');
      setDeleteTick((k) => k + 1);
    } catch (err) {
      console.error(err);
      addToast('Failed to load demo data', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-text-primary">Staff Directory</h3>
        <Button onClick={openCreate}>+ Add Staff</Button>
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-border-subtle">
            <thead className="bg-bg-elevated">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Attrition Risk</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-bg-hover transition-colors">
                  <td className="px-4 py-3 text-sm text-text-secondary font-mono">{staff.employee_id}</td>
                  <td className="px-4 py-3 text-sm text-text-primary font-medium">
                    {staff.last_name}, {staff.first_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-cyan">
                    {roles.find(r => r.id === staff.primary_role_id)?.role_name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{staff.start_date}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      staff.attrition_probability > 0.2 ? 'bg-red/10 text-red' : 'bg-green/10 text-green'
                    }`}>
                      {(staff.attrition_probability * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => form.open(staff)}
                      className="text-cyan hover:text-cyan-dim text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(staff.id)}
                      className="text-red hover:text-red-400 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {staffList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-text-muted text-sm">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center mb-2">
                        <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <p className="text-text-primary font-medium">No staff members found</p>
                      <p className="text-text-secondary text-xs max-w-xs mx-auto">
                        Get started quickly by loading a demo team or add staff manually.
                      </p>
                      <button
                        onClick={handleLoadDemo}
                        className="mt-2 px-4 py-2 bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors"
                      >
                        Load Demo Team (20 People)
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalStaff}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
        />
      </div>

      <Dialog open={form.isOpen} onOpenChange={(open) => (open ? form.open(form.editing ?? undefined) : form.close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.editing ? 'Edit Staff' : 'Add Staff Member'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="First Name" id="firstName">
                <input
                  id="firstName"
                  type="text"
                  value={form.values.first_name}
                  onChange={(e) => form.setField('first_name', e.target.value)}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary focus:border-cyan focus:ring-1 focus:ring-cyan"
                  required
                />
              </FormField>
              <FormField label="Last Name" id="lastName">
                <input
                  id="lastName"
                  type="text"
                  value={form.values.last_name}
                  onChange={(e) => form.setField('last_name', e.target.value)}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary focus:border-cyan focus:ring-1 focus:ring-cyan"
                  required
                />
              </FormField>
            </div>

            <FormField label="Employee ID" id="employeeId">
              <input
                id="employeeId"
                type="text"
                value={form.values.employee_id}
                onChange={(e) => form.setField('employee_id', e.target.value)}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary focus:border-cyan focus:ring-1 focus:ring-cyan"
                required
              />
            </FormField>

            <FormField label="Role" id="roleId">
              <select
                id="roleId"
                value={form.values.primary_role_id ?? ''}
                onChange={(e) => form.setField('primary_role_id', e.target.value ? Number(e.target.value) : null)}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary focus:border-cyan focus:ring-1 focus:ring-cyan"
                required
              >
                <option value="">Select a Role</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.role_name}</option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Date" id="startDate">
                <input
                  id="startDate"
                  type="date"
                  value={form.values.start_date}
                  onChange={(e) => form.setField('start_date', e.target.value)}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary focus:border-cyan focus:ring-1 focus:ring-cyan"
                  required
                />
              </FormField>
              <FormField label="Attrition Probability" id="attritionProb">
                <NumberInput
                  id="attritionProb"
                  step="0.01"
                  min="0"
                  max="1"
                  value={form.values.attrition_probability}
                  onChange={(e) => form.setField('attrition_probability', parseFloat(e.target.value))}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary focus:border-cyan focus:ring-1 focus:ring-cyan"
                />
              </FormField>
            </div>

            {form.error && (
              <p className="text-xs text-red">{form.error}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={form.close}>
                Cancel
              </Button>
              <Button type="submit">
                Save Staff
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
