import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useDatabaseStore } from '../../store/databaseStore';
import { EventModal } from './EventModal';
import { Button } from '../ui/Button';
import type { CalendarEvent } from '../../lib/database/dataAccess';
import { useToast } from '../ui/Toast';

type CalendarDatesSetArg = { startStr: string; endStr: string };
type CalendarDateClickArg = { dateStr: string };
type CalendarEventClickArg = { event: { id: string } };

export default function CalendarView() {
  const { 
    calendarEvents, 
    fetchCalendarEvents, 
    addCalendarEvent, 
    editCalendarEvent, 
    removeCalendarEvent,
    selectedCampaignId 
  } = useDatabaseStore();
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>(undefined);
  const [viewRange, setViewRange] = useState<{start: string, end: string} | null>(null);

  // Load events when view range changes
  useEffect(() => {
    if (viewRange) {
      // FullCalendar datesSet often gives range including padding days (prev/next month)
      // fetchCalendarEvents(viewRange.start, viewRange.end);
      // Ensure we fetch enough range.
      // Note: startStr and endStr are ISO strings.
      fetchCalendarEvents(viewRange.start, viewRange.end);
    }
  }, [viewRange, selectedCampaignId, fetchCalendarEvents]);

  const handleDatesSet = (dateInfo: CalendarDatesSetArg) => {
    setViewRange({
      start: dateInfo.startStr,
      end: dateInfo.endStr
    });
  };

  const handleDateClick = (arg: CalendarDateClickArg) => {
    setSelectedDate(arg.dateStr);
    setSelectedEvent(undefined);
    setIsModalOpen(true);
  };

  const handleEventClick = (arg: CalendarEventClickArg) => {
    const eventId = parseInt(arg.event.id);
    const event = calendarEvents.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setSelectedDate(undefined);
      setIsModalOpen(true);
    }
  };

  const handleSave = (eventData: Omit<CalendarEvent, 'id' | 'created_at'>) => {
    if (selectedEvent) {
      editCalendarEvent(selectedEvent.id, eventData);
      addToast('Event updated', 'success');
    } else {
      addCalendarEvent(eventData);
      addToast('Event created', 'success');
    }
    // Refresh immediately to show changes
    if (viewRange) fetchCalendarEvents(viewRange.start, viewRange.end);
  };

  const handleDelete = () => {
    if (selectedEvent) {
      removeCalendarEvent(selectedEvent.id);
      addToast('Event deleted', 'success');
      setIsModalOpen(false);
      if (viewRange) fetchCalendarEvents(viewRange.start, viewRange.end);
    }
  };

  // Map DB events to FullCalendar events
  const fcEvents = calendarEvents.map(e => ({
    id: e.id.toString(),
    title: `${e.event_name} (${(e.productivity_modifier * 100).toFixed(0)}%)`,
    start: e.start_datetime,
    end: e.end_datetime,
    allDay: Boolean(e.all_day),
    backgroundColor: getEventColor(e.event_type),
    borderColor: getEventColor(e.event_type),
    extendedProps: { ...e }
  }));

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-lg p-6 h-[800px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Calendar & Scheduling</h2>
          <p className="text-sm text-text-secondary">Manage holidays, training, and downtime.</p>
        </div>
        <Button onClick={() => { setSelectedDate(undefined); setSelectedEvent(undefined); setIsModalOpen(true); }}>
          + Add Event
        </Button>
      </div>
      
      {/* FullCalendar wrapper - Needs light theme for standard CSS or custom overrides. 
          For speed, I'm setting bg-white and text-black on the container to ensure readability 
          if FullCalendar styles assume light background. */}
      <div className="flex-1 bg-white text-black rounded-lg overflow-hidden p-2 shadow-inner">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={fcEvents}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          datesSet={handleDatesSet}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="100%"
        />
      </div>

      <EventModal
        key={`${isModalOpen}-${selectedEvent?.id ?? 'new'}-${selectedDate ?? ''}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        initialDate={selectedDate}
        eventToEdit={selectedEvent}
      />
    </div>
  );
}

function getEventColor(type: string): string {
  switch (type) {
    case 'Training': return '#3b82f6'; // blue
    case 'Holiday': return '#10b981'; // green
    case 'Downtime': return '#ef4444'; // red
    case 'Meeting': return '#f59e0b'; // amber
    case 'Onboarding': return '#8b5cf6'; // purple
    case 'TownHall': return '#ec4899'; // pink
    default: return '#6b7280'; // gray
  }
}
