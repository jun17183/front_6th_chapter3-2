import { Box, Stack } from '@mui/material';
import { useState } from 'react';

import { CalendarView } from './components/CalendarView';
import { EventForm } from './components/EventForm';
import { EventList } from './components/EventList';
import { NotificationStack } from './components/NotificationStack';
import { OverlapDialog } from './components/OverlapDialog';
import { useCalendarView } from './hooks/useCalendarView';
import { useEventForm } from './hooks/useEventForm';
import { useEventOperations } from './hooks/useEventOperations';
import { useNotifications } from './hooks/useNotifications';
import { useSearch } from './hooks/useSearch';
import { Event, EventForm as EventFormType } from './types';

function App() {
  const { editingEvent, setEditingEvent, editEvent } = useEventForm();

  const { events, saveEvent, deleteEvent } = useEventOperations(Boolean(editingEvent), () =>
    setEditingEvent(null)
  );

  const { notifications, notifiedEvents, setNotifications } = useNotifications(events);
  const calendarViewHook = useCalendarView();
  const { view, setView, currentDate, holidays, navigate } = calendarViewHook;
  const { filteredEvents } = useSearch(events, currentDate, view);

  const [isOverlapDialogOpen, setIsOverlapDialogOpen] = useState(false);
  const [overlappingEvents, setOverlappingEvents] = useState<Event[]>([]);
  const [pendingEventData, setPendingEventData] = useState<Event | EventFormType | null>(null);

  const handleOverlapDetected = (overlapping: Event[], eventData: Event | EventFormType) => {
    setOverlappingEvents(overlapping);
    setPendingEventData(eventData);
    setIsOverlapDialogOpen(true);
  };

  const handleOverlapConfirm = async (eventData: Event | EventFormType) => {
    await saveEvent(eventData);
    setIsOverlapDialogOpen(false);
    setOverlappingEvents([]);
    setPendingEventData(null);
  };

  const handleOverlapCancel = () => {
    setIsOverlapDialogOpen(false);
    setOverlappingEvents([]);
    setPendingEventData(null);
  };

  const handleEventSaved = () => {
    setEditingEvent(null);
  };

  const removeNotification = (index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', margin: 'auto', p: 5 }}>
      <Stack direction="row" spacing={6} sx={{ height: '100%' }}>
        <EventForm
          events={events}
          onOverlapDetected={handleOverlapDetected}
          onEventSaved={handleEventSaved}
          saveEvent={saveEvent}
          editingEvent={editingEvent}
          setEditingEvent={setEditingEvent}
        />

        <CalendarView
          filteredEvents={filteredEvents}
          notifiedEvents={notifiedEvents}
          view={view}
          setView={setView}
          currentDate={currentDate}
          holidays={holidays}
          navigate={navigate}
        />

        <EventList
          events={events}
          currentDate={currentDate}
          view={view}
          notifiedEvents={notifiedEvents}
          onEditEvent={editEvent}
          onDeleteEvent={deleteEvent}
        />
      </Stack>

      <OverlapDialog
        open={isOverlapDialogOpen}
        overlappingEvents={overlappingEvents}
        eventData={pendingEventData}
        onClose={handleOverlapCancel}
        onConfirm={handleOverlapConfirm}
      />

      <NotificationStack notifications={notifications} onRemoveNotification={removeNotification} />
    </Box>
  );
}

export default App;
