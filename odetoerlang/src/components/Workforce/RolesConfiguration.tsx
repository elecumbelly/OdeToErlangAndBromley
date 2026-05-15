import { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { getRoles, createRole, updateRole, deleteRole, type Role } from '../../lib/database/dataAccess';
import { useToast } from '../ui/Toast';
import { useEntityForm } from '../../hooks/useEntityForm';

interface RoleFormValues extends Record<string, unknown> {
  role_name: string;
  role_type: string;
  reports_to_role_id: number | null;
}

const DEFAULTS: RoleFormValues = {
  role_name: '',
  role_type: 'Agent',
  reports_to_role_id: null,
};

export default function RolesConfiguration() {
  const { addToast } = useToast();
  const [deleteTick, setDeleteTick] = useState(0);

  const form = useEntityForm<Role, RoleFormValues>({
    defaults: DEFAULTS,
    toFormValues: (role) => ({
      role_name: role.role_name,
      role_type: role.role_type,
      reports_to_role_id: role.reports_to_role_id,
    }),
    createFn: (values) => createRole({
      role_name: values.role_name,
      role_type: values.role_type,
      reports_to_role_id: values.reports_to_role_id,
    }),
    updateFn: (id, values) => updateRole(id, {
      role_name: values.role_name,
      role_type: values.role_type,
      reports_to_role_id: values.reports_to_role_id,
    }),
    onSuccess: (mode) => addToast(mode === 'create' ? 'Role created' : 'Role updated', 'success'),
    onError: (_mode, err) => {
      console.error(err);
      addToast('Failed to save role. Name must be unique.', 'error');
    },
  });

  const roles: Role[] = useMemo(() => {
    void form.refreshKey;
    void deleteTick;
    return getRoles();
  }, [form.refreshKey, deleteTick]);

  const handleDelete = (id: number) => {
    if (confirm('Are you sure? This may affect staff assigned to this role.')) {
      try {
        deleteRole(id);
        addToast('Role deleted', 'success');
        setDeleteTick((k) => k + 1);
      } catch (err) {
        console.error(err);
        addToast('Failed to delete role. It might be in use.', 'error');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-text-primary">Roles & Hierarchy</h3>
        <Button onClick={() => form.open()}>+ Add Role</Button>
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-border-subtle">
          <thead className="bg-bg-elevated">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Role Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Reports To</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-bg-hover transition-colors">
                <td className="px-4 py-3 text-sm text-text-primary font-medium">{role.role_name}</td>
                <td className="px-4 py-3 text-sm text-text-secondary">{role.role_type}</td>
                <td className="px-4 py-3 text-sm text-text-secondary">
                  {roles.find(r => r.id === role.reports_to_role_id)?.role_name || '-'}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => form.open(role)}
                    className="text-cyan hover:text-cyan-dim text-xs font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(role.id)}
                    className="text-red hover:text-red-400 text-xs font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-text-muted text-sm">
                  No roles defined yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={form.isOpen} onOpenChange={(open) => (open ? form.open(form.editing ?? undefined) : form.close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.editing ? 'Edit Role' : 'Create Role'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.submit} className="space-y-4">
            <FormField label="Role Name" id="roleName">
              <input
                id="roleName"
                type="text"
                value={form.values.role_name}
                onChange={(e) => form.setField('role_name', e.target.value)}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary focus:border-cyan focus:ring-1 focus:ring-cyan"
                required
              />
            </FormField>

            <FormField label="Role Type" id="roleType">
              <select
                id="roleType"
                value={form.values.role_type}
                onChange={(e) => form.setField('role_type', e.target.value)}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary focus:border-cyan focus:ring-1 focus:ring-cyan"
              >
                <option value="Agent">Agent</option>
                <option value="TeamLeader">Team Leader</option>
                <option value="Manager">Manager</option>
                <option value="QA">QA</option>
                <option value="Trainer">Trainer</option>
                <option value="Specialist">Specialist</option>
              </select>
            </FormField>

            <FormField label="Reports To" id="reportsTo">
              <select
                id="reportsTo"
                value={form.values.reports_to_role_id ?? ''}
                onChange={(e) => form.setField('reports_to_role_id', e.target.value ? Number(e.target.value) : null)}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary focus:border-cyan focus:ring-1 focus:ring-cyan"
              >
                <option value="">- None -</option>
                {roles
                  .filter(r => r.id !== form.editing?.id)
                  .map(r => (
                    <option key={r.id} value={r.id}>{r.role_name}</option>
                  ))
                }
              </select>
            </FormField>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={form.close}>
                Cancel
              </Button>
              <Button type="submit">
                Save Role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
