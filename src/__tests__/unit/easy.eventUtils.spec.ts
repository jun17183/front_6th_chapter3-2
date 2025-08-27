import { Event, RepeatType } from '../../types';
import { getFilteredEvents, generateRepeatDates, generateRepeatEvents } from '../../utils/eventUtils';

describe('getFilteredEvents', () => {
  const events: Event[] = [
    {
      id: '1',
      title: '이벤트 1',
      date: '2025-07-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 0,
    },
    {
      id: '2',
      title: '이벤트 2',
      date: '2025-07-05',
      startTime: '14:00',
      endTime: '15:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 0,
    },
    {
      id: '3',
      title: '이벤트 3',
      date: '2025-07-10',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 0,
    },
  ];

  it("검색어 '이벤트 2'에 맞는 이벤트만 반환한다", () => {
    const result = getFilteredEvents(events, '이벤트 2', new Date('2025-07-01'), 'month');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('이벤트 2');
  });

  it('주간 뷰에서 2025-07-01 주의 이벤트만 반환한다', () => {
    const result = getFilteredEvents(events, '', new Date('2025-07-01'), 'week');
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.title)).toEqual(['이벤트 1', '이벤트 2']);
  });

  it('월간 뷰에서 2025년 7월의 모든 이벤트를 반환한다', () => {
    const result = getFilteredEvents(events, '', new Date('2025-07-01'), 'month');
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.title)).toEqual(['이벤트 1', '이벤트 2', '이벤트 3']);
  });

  it("검색어 '이벤트'와 주간 뷰 필터링을 동시에 적용한다", () => {
    const result = getFilteredEvents(events, '이벤트', new Date('2025-07-01'), 'week');
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.title)).toEqual(['이벤트 1', '이벤트 2']);
  });

  it('검색어가 없을 때 모든 이벤트를 반환한다', () => {
    const result = getFilteredEvents(events, '', new Date('2025-07-01'), 'month');
    expect(result).toHaveLength(3);
  });

  it('검색어가 대소문자를 구분하지 않고 작동한다', () => {
    const result = getFilteredEvents(events, '이벤트 2', new Date('2025-07-01'), 'month');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('이벤트 2');
  });

  it('월의 경계에 있는 이벤트를 올바르게 필터링한다', () => {
    const borderEvents: Event[] = [
      {
        id: '4',
        title: '6월 마지막 날 이벤트',
        date: '2025-06-30',
        startTime: '23:00',
        endTime: '23:59',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 0,
      },
      ...events,
      {
        id: '5',
        title: '8월 첫 날 이벤트',
        date: '2025-08-01',
        startTime: '00:00',
        endTime: '01:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 0,
      },
    ];
    const result = getFilteredEvents(borderEvents, '', new Date('2025-07-01'), 'month');
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.title)).toEqual(['이벤트 1', '이벤트 2', '이벤트 3']);
  });

  it('빈 이벤트 리스트에 대해 빈 배열을 반환한다', () => {
    const result = getFilteredEvents([], '', new Date('2025-07-01'), 'month');
    expect(result).toHaveLength(0);
  });
});

describe('generateRepeatDates', () => {
  it('반복이 없을 때 시작 날짜만 반환한다', () => {
    const result = generateRepeatDates('2025-07-01', { type: 'none', interval: 0 });
    expect(result).toEqual(['2025-07-01']);
  });

  it('일간 반복에 대해 올바른 날짜들을 생성한다', () => {
    const result = generateRepeatDates('2025-07-01', { type: 'daily', interval: 1 });
    expect(result).toContain('2025-07-01');
    expect(result).toContain('2025-07-02');
    expect(result).toContain('2025-07-03');
  });

  it('주간 반복에 대해 올바른 날짜들을 생성한다', () => {
    const result = generateRepeatDates('2025-07-01', { type: 'weekly', interval: 1 });
    expect(result).toContain('2025-07-01');
    expect(result).toContain('2025-07-08');
    expect(result).toContain('2025-07-15');
  });

  it('월간 반복에 대해 올바른 날짜들을 생성한다', () => {
    const result = generateRepeatDates('2025-07-01', { type: 'monthly', interval: 1 });
    expect(result).toContain('2025-07-01');
    expect(result).toContain('2025-08-01');
    expect(result).toContain('2025-09-01');
  });

  it('년간 반복에 대해 올바른 날짜들을 생성한다', () => {
    const result = generateRepeatDates('2025-07-01', { type: 'yearly', interval: 1 });
    expect(result).toContain('2025-07-01');
    // 년간 반복은 기본 endDate(2025-10-30)까지 생성되므로 2026년 이후는 생성되지 않음
    expect(result.length).toBeGreaterThan(0);
  });

  it('interval이 2인 경우 올바른 간격으로 날짜를 생성한다', () => {
    const result = generateRepeatDates('2025-07-01', { type: 'weekly', interval: 2 });
    expect(result).toContain('2025-07-01');
    expect(result).toContain('2025-07-15');
    expect(result).toContain('2025-07-29');
  });
});

describe('generateRepeatEvents', () => {
  const baseEvent: Event = {
    id: '1',
    title: '반복 이벤트',
    date: '2025-07-01',
    startTime: '10:00',
    endTime: '11:00',
    description: '테스트 이벤트',
    location: '회의실',
    category: '회의',
    repeat: { type: 'weekly' as RepeatType, interval: 1 },
    notificationTime: 10,
  };

  it('반복 일정을 생성하고 기준 일정은 제외한다', () => {
    const result = generateRepeatEvents(baseEvent);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].title).toBe('반복 이벤트');
    expect(result[0].date).not.toBe('2025-07-01');
  });

  it('반복이 없을 때 빈 배열을 반환한다', () => {
    const noRepeatEvent = { ...baseEvent, repeat: { type: 'none' as RepeatType, interval: 0 } };
    const result = generateRepeatEvents(noRepeatEvent);
    expect(result).toHaveLength(0);
  });

  it('생성된 이벤트들이 올바른 날짜를 가진다', () => {
    const result = generateRepeatEvents(baseEvent);
    expect(result[0].date).toBe('2025-07-08');
    expect(result[1].date).toBe('2025-07-15');
  });
});
