import { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { PaginationControls } from '../ui/PaginationControls';
import { 
  getStaff, getRoles, createStaff, updateStaff, deleteStaff, 
  type Staff, type Role 
} from '../../lib/database/dataAccess';
import { useToast } from '../ui/Toast';

export default function StaffManager() {
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const itemsPerPage = 10; // Show 10 per page

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const { addToast } = useToast();

  const { data: staffList, total: totalStaff } = useMemo(() => {
    void refreshKey;
    const offset = (currentPage - 1) * itemsPerPage;
    return getStaff(false, itemsPerPage, offset);
  }, [currentPage, itemsPerPage, refreshKey]);

  const roles: Role[] = useMemo(() => {
    void refreshKey;
    return getRoles();
  }, [refreshKey]);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [roleId, setRoleId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [attritionProb, setAttritionProb] = useState(0.15);

  const totalPages = Math.ceil(totalStaff / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openModal = (staff?: Staff) => {
    if (staff) {
      setEditingStaff(staff);
      setFirstName(staff.first_name);
      setLastName(staff.last_name);
      setEmployeeId(staff.employee_id);
      setRoleId(staff.primary_role_id);
      setStartDate(staff.start_date);
      setAttritionProb(staff.attrition_probability);
    } else {
      setEditingStaff(null);
      setFirstName('');
      setLastName('');
      setEmployeeId(`EMP-${Math.floor(Math.random() * 10000)}`);
      setRoleId(roles.length > 0 ? roles[0].id : null);
      setStartDate(new Date().toISOString().split('T')[0]);
      setAttritionProb(0.15);
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
      const staffData = {
        employee_id: employeeId,
        first_name: firstName,
        last_name: lastName,
        primary_role_id: roleId,
        employment_type: 'Full-time',
        manager_id: null,
        start_date: startDate,
        end_date: null,
        site_id: null,
        attrition_probability: attritionProb
      };

      if (editingStaff) {
        updateStaff(editingStaff.id, staffData);
        addToast('Staff updated', 'success');
      } else {
        createStaff(staffData);
        addToast('Staff added', 'success');
      }
      setIsModalOpen(false);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      console.error(err);
      addToast('Failed to save staff member. ID must be unique.', 'error');
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      try {
        deleteStaff(id);
        addToast('Staff removed', 'success');
        setRefreshKey((key) => key + 1);
      } catch (err) {
        console.error(err);
        addToast('Failed to delete staff. It might be assigned to events.', 'error');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-text-primary">Staff Directory</h3>
        <Button onClick={() => openModal()}>+ Add Staff</Button>
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
                      onClick={() => openModal(staff)}
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
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted text-sm">
                    No staff found.
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff' : 'Add Staff Member'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form fields remain unchanged */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="First Name" id="firstName">
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary focus:border-cyan focus:ring-1 focus:ring-cyan"
                  required
                />
              </FormField>
              <FormField label="Last Name" id="lastName">
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary focus:border-cyan focus:ring-1 focus:ring-cyan"
                  required
                />
              </FormField>
            </div>

            <FormField label="Employee ID" id="employeeId">
              <input
                id="employeeId"
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary focus:border-cyan focus:ring-1 focus:ring-cyan"
                required
              />
            </FormField>

            <FormField label="Role" id="roleId">
              <select
                id="roleId"
                value={roleId || ''}
                onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : null)}
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
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary focus:border-cyan focus:ring-1 focus:ring-cyan"
                  required
                />
              </FormField>
              <FormField label="Attrition Probability" id="attritionProb">
                <input
                  id="attritionProb"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={attritionProb}
                  onChange={(e) => setAttritionProb(parseFloat(e.target.value))}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary focus:border-cyan focus:ring-1 focus:ring-cyan"
                />
              </FormField>
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
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
