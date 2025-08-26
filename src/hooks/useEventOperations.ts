import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

import { Event, EventForm } from '../types';
import { 
  generateRepeatEvents
} from '../utils/eventUtils';

export const useEventOperations = (editing: boolean, onSave?: () => void) => {
  const [events, setEvents] = useState<Event[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const { events } = await response.json();
      setEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      enqueueSnackbar('이벤트 로딩 실패', { variant: 'error' });
    }
  };

  const saveEvent = async (eventData: Event | EventForm) => {
    try {
      let response;
      if (editing) {
        
        if (eventData.repeat.type !== 'none') {
          const copyData = { ...eventData } as Event;
          const repeatEvents = generateRepeatEvents(copyData);

          await deleteEvent(copyData.id);
          response = await addEvents([copyData, ...repeatEvents]);
        } else {
          // 반복 설정이 없으면 repeat 초기화해서 수정
          await updateEvent({ ...eventData, repeat: { type: 'none', interval: 0 } } as Event);
        }
      } else {
        if (eventData.repeat.type !== 'none') {
          // 기준 일정 + 추가 반복 일정들을 한 번에 생성
          const repeatEvents = generateRepeatEvents(eventData);
          const allEvents = [eventData, ...repeatEvents];

          response = await addEvents(allEvents);
        } else {
          response = await addEvent(eventData);
        }
      }

      await fetchEvents();
      onSave?.();
      enqueueSnackbar(editing ? '일정이 수정되었습니다.' : '일정이 추가되었습니다.', {
        variant: 'success',
      });
    } catch (error) {
      console.error('Error saving event:', error);
      enqueueSnackbar('일정 저장 실패', { variant: 'error' });
    }
  };

  // 단일 이벤트 추가
  const addEvent = async (eventData: Event | EventForm) => {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      throw new Error('Failed to create event');
    }
  };

  // 이벤트 수정
  const updateEvent = async (eventData: Event) => {
    const response = await fetch(`/api/events/${eventData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      throw new Error('Failed to update event');
    }
  };

  // 여러 이벤트 추가 (bulk)
  const addEvents = async (events: (Event | EventForm)[] | Event | EventForm) => {
    // 단일 이벤트면 배열로 변환, 배열이면 그대로 사용
    const eventArray = Array.isArray(events) ? events : [events];
    
    if (eventArray.length === 0) return;

    const response = await fetch('/api/events-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventArray),
    });

    if (!response.ok) {
      throw new Error('Failed to create events');
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      await fetchEvents();
      enqueueSnackbar('일정이 삭제되었습니다.', { variant: 'info' });
    } catch (error) {
      console.error('Error deleting event:', error);
      enqueueSnackbar('일정 삭제 실패', { variant: 'error' });
    }
  };

  async function init() {
    await fetchEvents();
    enqueueSnackbar('일정 로딩 완료!', { variant: 'info' });
  }

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { 
    events, 
    fetchEvents, 
    saveEvent, 
    deleteEvent 
  };
};
