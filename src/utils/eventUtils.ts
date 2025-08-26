import { Event, EventForm, RepeatInfo } from '../types';
import { getWeekDates, isDateInRange, formatDate } from './dateUtils';

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

// 주어진 날짜에 interval일을 더한 날짜를 반환
function addDays(date: Date, interval: number): Date {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + interval);
  return newDate;
}

// 주어진 날짜에 interval주를 더한 날짜를 반환
function addWeeks(date: Date, interval: number): Date {
  return addDays(date, interval * 7);
}

// 주어진 날짜에 interval개월을 더한 날짜를 반환
function addMonths(date: Date, interval: number): Date {
  const newDate = new Date(date);
  const targetMonth = newDate.getMonth() + interval;
  const targetYear = newDate.getFullYear() + Math.floor(targetMonth / 12);
  const adjustedMonth = targetMonth % 12;
  
  newDate.setFullYear(targetYear);
  newDate.setMonth(adjustedMonth);
  
  // 원래 날짜가 31일이었는데 30일까지인 달로 이동한 경우 등
  // 유효하지 않은 날짜가 있으면 해당 달을 건너뛰고 다음 달로 이동
  if (newDate.getDate() !== date.getDate()) {
    // 해당 달을 건너뛰고 다음 달의 같은 날짜로 설정
    newDate.setMonth(adjustedMonth + 1);
    newDate.setDate(date.getDate());
    
    // 다음 달도 유효하지 않으면 계속 다음 달로 이동
    while (newDate.getDate() !== date.getDate()) {
      newDate.setMonth(newDate.getMonth() + 1);
      newDate.setDate(date.getDate());
    }
  }
  
  return newDate;
}

// 윤년인지 확인하는 함수
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// 주어진 날짜에 interval년을 더한 날짜를 반환
function addYears(date: Date, interval: number): Date {
  // 2월 29일인 경우 특별 처리
  if (date.getMonth() === 1 && date.getDate() === 29) {
    let targetYear = date.getFullYear() + interval;
    
    // 윤년이 아닌 해는 건너뛰고 다음 윤년으로 이동
    while (!isLeapYear(targetYear)) {
      targetYear++;
    }
    
    // 새로운 Date 객체를 생성하여 2월 29일로 설정
    return new Date(targetYear, 1, 29);
  }
  
  // 일반적인 경우
  const newDate = new Date(date);
  newDate.setFullYear(date.getFullYear() + interval);
  return newDate;
}

// 반복 타입에 따라 다음 날짜를 계산
function getNextDate(currentDate: Date, repeatType: string, interval: number): Date {
  switch (repeatType) {
    case 'daily':
      return addDays(currentDate, interval);
    case 'weekly':
      return addWeeks(currentDate, interval);
    case 'monthly':
      return addMonths(currentDate, interval);
    case 'yearly':
      return addYears(currentDate, interval);
    default:
      return currentDate;
  }
}

// 반복 일정의 날짜들을 생성
export function generateRepeatDates(
  startDate: string,
  repeat: RepeatInfo
): string[] {
  if (repeat.type === 'none' || repeat.interval <= 0) {
    return [startDate];
  }

  const dates: string[] = [startDate];
  let currentDate = new Date(startDate);
  
  // endDate 설정 (기본값: 2025-10-30)
  const endDate = repeat.endDate ? new Date(repeat.endDate) : new Date('2025-10-30');
  
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
export function generateRepeatEvents(
  eventData: Event | EventForm
): (Event | EventForm)[] {
  const dates = generateRepeatDates(eventData.date, eventData.repeat);
  
  // 첫 번째 날짜(기준 일정)를 제외하고 나머지만 반환
  return dates.slice(1).map(date => ({
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
