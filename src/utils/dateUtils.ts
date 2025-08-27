import { Event } from '../types.ts';

/**
 * 주어진 년도와 월의 일수를 반환합니다.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * 주어진 날짜가 속한 주의 모든 날짜를 반환합니다.
 */
export function getWeekDates(date: Date): Date[] {
  const day = date.getDay();
  const diff = date.getDate() - day;
  const sunday = new Date(date.setDate(diff));
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(sunday);
    nextDate.setDate(sunday.getDate() + i);
    weekDates.push(nextDate);
  }
  return weekDates;
}

export function getWeeksAtMonth(currentDate: Date) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month + 1);
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weeks = [];

  const initWeek = () => Array(7).fill(null);

  let week: Array<number | null> = initWeek();

  for (let i = 0; i < firstDayOfMonth; i++) {
    week[i] = null;
  }

  for (const day of days) {
    const dayIndex = (firstDayOfMonth + day - 1) % 7;
    week[dayIndex] = day;
    if (dayIndex === 6 || day === daysInMonth) {
      weeks.push(week);
      week = initWeek();
    }
  }

  return weeks;
}

export function getEventsForDay(events: Event[], date: number): Event[] {
  return events.filter((event) => new Date(event.date).getDate() === date);
}

export function formatWeek(targetDate: Date) {
  const dayOfWeek = targetDate.getDay();
  const diffToThursday = 4 - dayOfWeek;
  const thursday = new Date(targetDate);
  thursday.setDate(targetDate.getDate() + diffToThursday);

  const year = thursday.getFullYear();
  const month = thursday.getMonth() + 1;

  const firstDayOfMonth = new Date(thursday.getFullYear(), thursday.getMonth(), 1);

  const firstThursday = new Date(firstDayOfMonth);
  firstThursday.setDate(1 + ((4 - firstDayOfMonth.getDay() + 7) % 7));

  const weekNumber: number =
    Math.floor((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

  return `${year}년 ${month}월 ${weekNumber}주`;
}

/**
 * 주어진 날짜의 월 정보를 "YYYY년 M월" 형식으로 반환합니다.
 */
export function formatMonth(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}년 ${month}월`;
}

const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * 주어진 날짜가 특정 범위 내에 있는지 확인합니다.
 */
export function isDateInRange(date: Date, rangeStart: Date, rangeEnd: Date): boolean {
  const normalizedDate = stripTime(date);
  const normalizedStart = stripTime(rangeStart);
  const normalizedEnd = stripTime(rangeEnd);

  return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
}

export function fillZero(value: number, size = 2) {
  return String(value).padStart(size, '0');
}

export function formatDate(currentDate: Date, day?: number) {
  return [
    currentDate.getFullYear(),
    fillZero(currentDate.getMonth() + 1),
    fillZero(day ?? currentDate.getDate()),
  ].join('-');
}

// 주어진 날짜에 interval일을 더한 날짜를 반환
export function addDays(date: Date, interval: number): Date {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + interval);
  return newDate;
}

// 주어진 날짜에 interval주를 더한 날짜를 반환
export function addWeeks(date: Date, interval: number): Date {
  return addDays(date, interval * 7);
}

// 주어진 날짜에 interval개월을 더한 날짜를 반환
export function addMonths(date: Date, interval: number): Date {
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
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// 주어진 날짜에 interval년을 더한 날짜를 반환
export function addYears(date: Date, interval: number): Date {
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
export function getNextDate(currentDate: Date, repeatType: string, interval: number): Date {
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
