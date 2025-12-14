import { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { PaginationControls } from '../ui/PaginationControls';
import { getClients, createClient, type Client } from '../../lib/database/dataAccess';
import { useToast } from '../ui/Toast';

interface ClientManagerProps {
  onSelectClient: (clientId: number | null) => void;
  selectedClientId: number | null;
}

export default function ClientManager({ onSelectClient, selectedClientId }: ClientManagerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { addToast } = useToast();

  // Form state
  const [clientName, setClientName] = useState('');
  const [industry, setIndustry] = useState('');

  const { data: clients, total: totalClients } = useMemo(() => {
    void refreshKey;
    const offset = (currentPage - 1) * itemsPerPage;
    return getClients(false, itemsPerPage, offset);
  }, [currentPage, itemsPerPage, refreshKey]);

  const totalPages = Math.ceil(totalClients / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setClientName(client.client_name);
      setIndustry(client.industry || '');
    } else {
      setEditingClient(null);
      setClientName('');
      setIndustry('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        addToast('Client update not yet implemented', 'warning');
      } else {
        createClient(clientName, industry || undefined);
        addToast('Client created', 'success');
      }
      setIsModalOpen(false);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      console.error(err);
      addToast('Failed to save client. Name must be unique.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-text-primary">Clients</h3>
        <Button onClick={() => openModal()}>+ Add Client</Button>
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-border-subtle">
            <thead className="bg-bg-elevated">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Client Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Industry</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {clients.map((client) => (
                <tr 
                  key={client.id} 
                  className={`hover:bg-bg-hover transition-colors cursor-pointer ${selectedClientId === client.id ? 'bg-cyan/10' : ''}`}
                  onClick={() => onSelectClient(client.id)}
                >
                  <td className="px-4 py-3 text-sm text-text-primary font-medium">{client.client_name}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{client.industry || '-'}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {client.active ? 'Active' : 'Inactive'}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openModal(client); }}
                      className="text-cyan hover:text-cyan-dim text-xs font-medium"
                    >
                      View/Edit
                    </button>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-muted text-sm">
                    No clients defined yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalClients}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
        />
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClient ? 'View/Edit Client' : 'Add New Client'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Client Name" id="clientName">
              <input
                id="clientName"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary focus:border-cyan focus:ring-1 focus:ring-cyan"
                required
              />
            </FormField>

            <FormField label="Industry" id="industry">
              <input
                id="industry"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary focus:border-cyan focus:ring-1 focus:ring-cyan"
                placeholder="e.g., Finance, Retail, Healthcare"
              />
            </FormField>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingClient ? 'Save Changes' : 'Create Client'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
