import { Event, EventForm, RepeatInfo } from '../types';
import { getWeekDates, isDateInRange, formatDate, getNextDate } from './dateUtils';

function filterEventsByDateRange(events: Event[], start: Date, end: Date): Event[] {
  return events.filter((event) => {
    const eventDate = new Date(event.date);
    return isDateInRange(eventDate, start, end);
  });
}

function containsTerm(target: string, term: string) {
  return target.toLowerCase().includes(term.toLowerCase());
}

function searchEvents(events: Event[], term: string) {
  return events.filter(
    ({ title, description, location }) =>
      containsTerm(title, term) || containsTerm(description, term) || containsTerm(location, term)
  );
}

function filterEventsByDateRangeAtWeek(events: Event[], currentDate: Date) {
  const weekDates = getWeekDates(currentDate);
  return filterEventsByDateRange(events, weekDates[0], weekDates[6]);
}

function filterEventsByDateRangeAtMonth(events: Event[], currentDate: Date) {
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
  return filterEventsByDateRange(events, monthStart, monthEnd);
}

// 반복 일정의 날짜들을 생성
export function generateRepeatDates(startDate: string, repeat: RepeatInfo): string[] {
  if (repeat.type === 'none' || repeat.interval <= 0) {
    return [startDate];
  }

  const dates: string[] = [startDate];
  let currentDate = new Date(startDate);

  // endDate 설정 (기본값: 2025-10-30)
  const endDate = repeat.endDate && new Date(repeat.endDate) < new Date('2025-10-30') ? new Date(repeat.endDate) : new Date('2025-10-30');

  while (true) {
    const nextDate = getNextDate(currentDate, repeat.type, repeat.interval);

    // endDate를 초과하면 중단
    if (nextDate > endDate) {
      break;
    }

    dates.push(formatDate(nextDate));
    currentDate = nextDate;
  }

  return dates;
}

// 반복 일정 생성 (기준 이벤트 제외)
export function generateRepeatEvents(eventData: Event | EventForm): (Event | EventForm)[] {
  const dates = generateRepeatDates(eventData.date, eventData.repeat);

  // 첫 번째 날짜(기준 일정)를 제외하고 나머지만 반환
  return dates.slice(1).map((date) => ({
    ...eventData,
    date,
  }));
}

export function getFilteredEvents(
  events: Event[],
  searchTerm: string,
  currentDate: Date,
  view: 'week' | 'month'
): Event[] {
  const searchedEvents = searchEvents(events, searchTerm);

  if (view === 'week') {
    return filterEventsByDateRangeAtWeek(searchedEvents, currentDate);
  }

  if (view === 'month') {
    return filterEventsByDateRangeAtMonth(searchedEvents, currentDate);
  }

  return searchedEvents;
}
