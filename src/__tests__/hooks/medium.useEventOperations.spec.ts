import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../../__mocks__/handlersUtils.ts';
import { useEventOperations } from '../../hooks/useEventOperations.ts';
import { server } from '../../setupTests.ts';
import { Event, EventForm } from '../../types.ts';
import { createEventForm, createEvents } from '../eventFactory.ts';

const enqueueSnackbarFn = vi.fn();

vi.mock('notistack', async () => {
  const actual = await vi.importActual('notistack');
  return {
    ...actual,
    useSnackbar: () => ({
      enqueueSnackbar: enqueueSnackbarFn,
    }),
  };
});

it('저장되어있는 초기 이벤트 데이터를 적절하게 불러온다', async () => {
  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  expect(result.current.events).toEqual([
    {
      id: '1',
      title: '기존 회의',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    },
  ]);
});

it('정의된 이벤트 정보를 기준으로 적절하게 저장이 된다', async () => {
  setupMockHandlerCreation(); // ? Med: 이걸 왜 써야하는지 물어보자

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  const newEvent: Event = {
    id: '1',
    title: '새 회의',
    date: '2025-10-16',
    startTime: '11:00',
    endTime: '12:00',
    description: '새로운 팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  };

  await act(async () => {
    await result.current.saveEvent(newEvent);
  });

  expect(result.current.events).toEqual([{ ...newEvent, id: '1' }]);
});

it("새로 정의된 'title', 'endTime' 기준으로 적절하게 일정이 업데이트 된다", async () => {
  setupMockHandlerUpdating();

  const { result } = renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  const updatedEvent: Event = {
    id: '1',
    date: '2025-10-15',
    startTime: '09:00',
    description: '기존 팀 미팅',
    location: '회의실 B',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
    title: '수정된 회의',
    endTime: '11:00',
  };

  await act(async () => {
    await result.current.saveEvent(updatedEvent);
  });

  expect(result.current.events[0]).toEqual(updatedEvent);
});

it('존재하는 이벤트 삭제 시 에러없이 아이템이 삭제된다.', async () => {
  setupMockHandlerDeletion();

  const { result } = renderHook(() => useEventOperations(false));

  await act(async () => {
    await result.current.deleteEvent('1');
  });

  await act(() => Promise.resolve(null));

  expect(result.current.events).toEqual([]);
});

it("이벤트 로딩 실패 시 '이벤트 로딩 실패'라는 텍스트와 함께 에러 토스트가 표시되어야 한다", async () => {
  server.use(
    http.get('/api/events', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('이벤트 로딩 실패', { variant: 'error' });

  server.resetHandlers();
});

it("존재하지 않는 이벤트 수정 시 '일정 저장 실패'라는 토스트가 노출되며 에러 처리가 되어야 한다", async () => {
  const { result } = renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  const nonExistentEvent: Event = {
    id: '999', // 존재하지 않는 ID
    title: '존재하지 않는 이벤트',
    date: '2025-07-20',
    startTime: '09:00',
    endTime: '10:00',
    description: '이 이벤트는 존재하지 않습니다',
    location: '어딘가',
    category: '기타',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  };

  await act(async () => {
    await result.current.saveEvent(nonExistentEvent);
  });

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정 저장 실패', { variant: 'error' });
});

it("네트워크 오류 시 '일정 삭제 실패'라는 텍스트가 노출되며 이벤트 삭제가 실패해야 한다", async () => {
  server.use(
    http.delete('/api/events/:id', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  await act(async () => {
    await result.current.deleteEvent('1');
  });

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정 삭제 실패', { variant: 'error' });

  expect(result.current.events).toHaveLength(1);
});

// =========== 반복 일정 추가 테스트 ===========

it("반복 일정 추가 시 반복 주기에 맞게 추가 일정이 생성된다", async () => {
  setupMockHandlerCreation();

  const { result } = renderHook(() => useEventOperations(false));

  const event: EventForm = createEventForm({
    title: '토요일 발제',
    date: '2025-10-04',
    repeat: { type: 'weekly', interval: 1, endDate: '2025-10-31' },
  });

  await act(async () => {
    await result.current.saveEvent(event);
  });

  const repeatId = result.current.events[0].repeat?.id;

  expect(result.current.events).toHaveLength(4);
  expect(result.current.events[0].date).toBe('2025-10-04');
  expect(result.current.events[1].date).toBe('2025-10-11');
  expect(result.current.events[2].date).toBe('2025-10-18');
  expect(result.current.events[3].date).toBe('2025-10-25');
  
  expect(result.current.events[1].repeat?.id).toBe(repeatId);
  expect(result.current.events[2].repeat?.id).toBe(repeatId);
  expect(result.current.events[3].repeat?.id).toBe(repeatId);
});

it('매달 31일에 반복 일정 추가 시 31일이 없는 달은 일정이 추가되지 않는다', async () => {
  setupMockHandlerCreation();

  const { result } = renderHook(() => useEventOperations(false));

  const event: EventForm = createEventForm({
    title: '매달 31일 일정',
    date: '2025-07-31',
    repeat: { type: 'monthly', interval: 1 },
  });

  await act(async () => {
    await result.current.saveEvent(event);
  });

  expect(result.current.events).toHaveLength(2);
  expect(result.current.events[0].date).toBe('2025-07-31');
  expect(result.current.events[1].date).toBe('2025-08-31');
});

it('2월 29일에 매년 이벤트 추가 시 윤년이 아닌 해엔 일정이 추가되지 않는다', async () => {
  setupMockHandlerCreation();

  const { result } = renderHook(() => useEventOperations(false));

  const event: EventForm = createEventForm({
    title: '2월 29일 일정',
    date: '2020-02-29',
    repeat: { type: 'yearly', interval: 1 },
  });

  await act(async () => {
    await result.current.saveEvent(event);
  });

  expect(result.current.events).toHaveLength(2);
  expect(result.current.events[0].date).toBe('2020-02-29');
  expect(result.current.events[1].date).toBe('2024-02-29');
});

it('반복 일정을 단일 일정으로 수정 시 해당 일정만 수정된다', async () => {
  const events: Event[] = createEvents([
    {
      id: '1',
      date: '2025-10-01',
      repeat: { id: '1', type: 'daily', interval: 1, endDate: '2025-10-03' },
    },
    {
      id: '2',
      date: '2025-10-02',
      repeat: { id: '1', type: 'daily', interval: 1, endDate: '2025-10-03' },
    },
    {
      id: '3',
      date: '2025-10-03',
      repeat: { id: '1', type: 'daily', interval: 1, endDate: '2025-10-03' },
    },
  ]);
  
  setupMockHandlerUpdating(events);

  const { result } = renderHook(() => useEventOperations(true));

  await act(async () => {
    await result.current.saveEvent({
      ...events[0],
      title: '수정된 일정',
      repeat: { type: 'none', interval: 0 },
    });
  });

  expect(result.current.events).toHaveLength(3);
  expect(result.current.events[0].title).toBe('수정된 일정');
  expect(result.current.events[0].repeat?.type).toBe('none');
  expect(result.current.events[1].repeat?.type).toBe('daily');
  expect(result.current.events[2].repeat?.type).toBe('daily');
  expect(result.current.events[0].repeat?.id).toBe(undefined);
  expect(result.current.events[1].repeat?.id).toBe('1');
  expect(result.current.events[2].repeat?.id).toBe('1');
});

it('반복 일정 삭제 시 해당 일정만 삭제된다', async () => {
  const events: Event[] = createEvents([
    {
      id: '1',
      date: '2025-10-01',
      repeat: { id: '1', type: 'daily', interval: 1, endDate: '2025-10-03' },
    },
    {
      id: '2',
      date: '2025-10-02',
      repeat: { id: '1', type: 'daily', interval: 1, endDate: '2025-10-03' },
    },
    {
      id: '3',
      date: '2025-10-03',
      repeat: { id: '1', type: 'daily', interval: 1, endDate: '2025-10-03' },
    },
  ]);

  setupMockHandlerDeletion(events);

  const { result } = renderHook(() => useEventOperations(true));

  await act(async () => {
    await result.current.deleteEvent('1');
  });

  expect(result.current.events).toHaveLength(2);
  expect(result.current.events[0].id).toBe('2');
  expect(result.current.events[1].id).toBe('3');
  expect(result.current.events[0].repeat?.id).toBe('1');
  expect(result.current.events[1].repeat?.id).toBe('1');
});

it('반복 일정의 반복 정보를 수정 시 새 반복 일정이 생성되며 기존 반복 일정은 유지된다', async () => {
  const events: Event[] = createEvents([
    {
      id: '1',
      date: '2025-10-01',
      repeat: { id: '1', type: 'daily', interval: 1, endDate: '2025-10-03' },
    },
    {
      id: '2',
      date: '2025-10-02',
      repeat: { id: '1', type: 'daily', interval: 1, endDate: '2025-10-03' },
    },
    {
      id: '3',
      date: '2025-10-03',
      repeat: { id: '1', type: 'daily', interval: 1, endDate: '2025-10-03' },
    },
  ]);

  setupMockHandlerUpdating(events);

  const { result } = renderHook(() => useEventOperations(true));

  await act(async () => {
    await result.current.saveEvent({
      ...events[0],
      repeat: { type: 'weekly', interval: 1, endDate: '2025-10-15' },
    });
  });

  expect(result.current.events).toHaveLength(5);
  expect(result.current.events[0].repeat?.type).toBe('daily');
  expect(result.current.events[1].repeat?.type).toBe('daily');
  expect(result.current.events[2].repeat?.type).toBe('weekly');
  expect(result.current.events[3].repeat?.type).toBe('weekly');
  expect(result.current.events[4].repeat?.type).toBe('weekly');
  
  const newRepeatId = result.current.events[2].repeat?.id;
  
  expect(result.current.events[3].repeat?.id).toBe(newRepeatId);
  expect(result.current.events[4].repeat?.id).toBe(newRepeatId);
});

it('반복 일정 수정 시 반복 정보를 유지하더라도 새로운 반복 일정이 생성된다', async () => {
  const events: Event[] = createEvents([
    {
      id: '1',
      date: '2025-10-01',
      repeat: { id: '1', type: 'daily', interval: 1, endDate: '2025-10-03' },
    },
    {
      id: '2',
      date: '2025-10-02',
      repeat: { id: '1', type: 'daily', interval: 1, endDate: '2025-10-03' },
    },
    {
      id: '3',
      date: '2025-10-03',
      repeat: { id: '1', type: 'daily', interval: 1, endDate: '2025-10-03' },
    },
  ]);

  setupMockHandlerUpdating(events);

  const { result } = renderHook(() => useEventOperations(true));

  await act(async () => {
    await result.current.saveEvent({
      ...events[0],
      title: '수정된 일정',
    });
  });

  const oldRepeatId = result.current.events[0].repeat?.id;
  const newRepeatId = result.current.events[2].repeat?.id;

  expect(result.current.events).toHaveLength(5);
  expect(result.current.events[0].repeat?.id).toBe(oldRepeatId);
  expect(result.current.events[1].repeat?.id).toBe(oldRepeatId);
  expect(result.current.events[2].repeat?.id).toBe(newRepeatId);
  expect(result.current.events[3].repeat?.id).toBe(newRepeatId);
  expect(result.current.events[4].repeat?.id).toBe(newRepeatId);
});