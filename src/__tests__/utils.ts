import { fillZero } from '../utils/dateUtils';

// 두 날짜가 같은지 확인
export const assertDate = (date1: Date, date2: Date) => {
  expect(date1.toISOString()).toBe(date2.toISOString());
};

// 분을 'hh:mm'으로 변환
export const parseHM = (timestamp: number) => {
  const date = new Date(timestamp);
  const h = fillZero(date.getHours());
  const m = fillZero(date.getMinutes());
  return `${h}:${m}`;
};

// 'hh:mm'을 분으로 변환
export const timeToMinutes = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// 날짜를 'yyyy-mm-dd' 형태로 변환
export const getDateString = (date: Date) => {
  return date.toISOString().split('T')[0];
};

// 오늘 날짜에서 한 달 전후로 랜덤한 날짜 반환
export const getRandomDate = () => {
  const today = new Date();
  const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneMonthLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const randomTime =
    oneMonthAgo.getTime() + Math.random() * (oneMonthLater.getTime() - oneMonthAgo.getTime());
  return getDateString(new Date(randomTime));
};

// 30분 단위로 랜덤한 시간 'hh:mm' 형태로 반환
export const getRandomTime = () => {
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.random() < 0.5 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
};

// 'hh:mm' 형태의 시간에 분을 더하거나 빼서 'hh:mm' 형태로 반환
export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = (hours * 60 + mins + minutes) % (24 * 60);

  // 음수인 경우 다음날로 넘김
  const finalMinutes = totalMinutes < 0 ? totalMinutes + 24 * 60 : totalMinutes;

  const newHours = Math.floor(finalMinutes / 60);
  const newMins = finalMinutes % 60;

  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}

// startTime보다 30분~180분 후의 endTime 생성
export function generateEndTimeAfterStart(startTime: string): string {
  const minDuration = 30;
  const maxDuration = 180;
  const duration = minDuration + Math.floor(Math.random() * (maxDuration - minDuration + 1));
  return addMinutesToTime(startTime, duration);
}
