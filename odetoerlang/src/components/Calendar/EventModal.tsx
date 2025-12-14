import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import type { CalendarEvent } from '../../lib/database/dataAccess';
import { useDatabaseStore } from '../../store/databaseStore';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id' | 'created_at'>) => void;
  onDelete?: () => void;
  initialDate?: string;
  eventToEdit?: CalendarEvent;
}

const EVENT_TYPES = ['Training', 'Meeting', 'Holiday', 'Downtime', 'Onboarding', 'TownHall', 'Other'];

export const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, onDelete, initialDate, eventToEdit }) => {
  const { selectedCampaignId } = useDatabaseStore();
  const dateBase = initialDate || new Date().toISOString().split('T')[0];

  const [name, setName] = useState(() => eventToEdit?.event_name ?? '');
  const [type, setType] = useState(() => eventToEdit?.event_type ?? 'Training');
  const [start, setStart] = useState(() => eventToEdit?.start_datetime ?? `${dateBase}T09:00`);
  const [end, setEnd] = useState(() => eventToEdit?.end_datetime ?? `${dateBase}T10:00`);
  const [allDay, setAllDay] = useState(() => eventToEdit?.all_day ?? false);
  const [productivity, setProductivity] = useState(() => (eventToEdit ? eventToEdit.productivity_modifier * 100 : 0)); // 0% productivity for training usually

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      event_name: name,
      event_type: type,
      start_datetime: start,
      end_datetime: end,
      all_day: allDay,
      productivity_modifier: productivity / 100,
      applies_to_filter: null,
      campaign_id: eventToEdit?.campaign_id || selectedCampaignId, // Use existing or current selected
    });
    onClose();
  };

  const inputClass = "block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2 focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/20 transition-all duration-fast";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{eventToEdit ? 'Edit Event' : 'Add Event'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Event Name" id="name">
            <input 
              type="text" 
              id="name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              className={inputClass}
              placeholder="e.g. New Hire Training"
            />
          </FormField>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Type" id="type">
              <select 
                id="type" 
                value={type} 
                onChange={e => setType(e.target.value)} 
                className={inputClass}
              >
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            
            <FormField label="Productivity %" id="productivity">
              <input 
                type="number" 
                id="productivity" 
                min="0" max="100" 
                value={productivity} 
                onChange={e => setProductivity(parseFloat(e.target.value))} 
                className={inputClass}
              />
            </FormField>
          </div>

          <div className="flex items-center space-x-2 mb-2">
            <input 
              type="checkbox" 
              id="allDay" 
              checked={allDay} 
              onChange={e => setAllDay(e.target.checked)}
              className="rounded bg-bg-surface border-border-subtle text-cyan focus:ring-cyan"
            />
            <label htmlFor="allDay" className="text-sm text-text-primary">All Day Event</label>
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start" id="start">
                <input 
                  type="datetime-local" 
                  id="start" 
                  value={start} 
                  onChange={e => setStart(e.target.value)} 
                  required 
                  className={inputClass}
                />
              </FormField>
              <FormField label="End" id="end">
                <input 
                  type="datetime-local" 
                  id="end" 
                  value={end} 
                  onChange={e => setEnd(e.target.value)} 
                  required 
                  className={inputClass}
                />
              </FormField>
            </div>
          )}

          {allDay && (
             <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Date" id="startDate">
                <input 
                  type="date" 
                  id="startDate" 
                  value={start.split('T')[0]} 
                  onChange={e => setStart(e.target.value)} 
                  required 
                  className={inputClass}
                />
              </FormField>
              <FormField label="End Date" id="endDate">
                <input 
                  type="date" 
                  id="endDate" 
                  value={end.split('T')[0]} 
                  onChange={e => setEnd(e.target.value)} 
                  required 
                  className={inputClass}
                />
              </FormField>
            </div>
          )}

          <DialogFooter>
            {eventToEdit && onDelete && (
              <Button type="button" variant="danger" onClick={onDelete} className="mr-auto">
                Delete
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Event</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
