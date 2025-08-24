import { Event, EventForm } from '../types';
import { generateEndTimeAfterStart, getRandomDate, getRandomTime } from './utils';

// 이벤트 폼
export const createEventForm = (override: Partial<EventForm> = {}): EventForm => {
  const startTime = getRandomTime();
  const endTime = generateEndTimeAfterStart(startTime);

  const defaults: EventForm = {
    title: `테스트 이벤트 ${crypto.randomUUID()}`,
    date: getRandomDate(),
    startTime,
    endTime,
    description: '',
    location: '',
    category: '',
    repeat: { type: 'none', interval: 0 },
    notificationTime: Math.floor(Math.random() * 60) + 1, // 1-60분
  };

  return { ...defaults, ...override };
};

// 이벤트 (id 포함)
export const createEvent = (override: Partial<Event> = {}): Event => {
  const eventFormDefaults = createEventForm();
  const defaults: Event = {
    id: override.id || crypto.randomUUID(),
    ...eventFormDefaults,
  };

  return { ...defaults, ...override };
};

// 목록
export const createEvents = (overrides: number | Partial<Event>[] = 0): Event[] => {
  if (typeof overrides === 'number') {
    return Array.from({ length: overrides }, () => {
      return createEvent();
    });
  }

  return overrides.map((override) => {
    return createEvent(override as Partial<Event>);
  });
};
