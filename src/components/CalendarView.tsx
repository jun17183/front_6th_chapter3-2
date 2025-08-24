import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Notifications from '@mui/icons-material/Notifications';
import {
  Box,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React from 'react';

import { Event } from '../types';
import {
  formatDate,
  formatMonth,
  formatWeek,
  getEventsForDay,
  getWeekDates,
  getWeeksAtMonth,
} from '../utils/dateUtils';

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

interface CalendarViewProps {
  filteredEvents: Event[];
  notifiedEvents: string[];
  view: 'week' | 'month';
  setView: (view: 'week' | 'month') => void;
  currentDate: Date;
  holidays: { [key: string]: string };
  navigate: (direction: 'prev' | 'next') => void;
}

export function CalendarView({
  filteredEvents,
  notifiedEvents,
  view,
  setView,
  currentDate,
  holidays,
  navigate,
}: CalendarViewProps) {
  const renderEvent = (event: Event) => {
    const isNotified = notifiedEvents.includes(event.id);
    return (
      <Box
        key={event.id}
        sx={{
          p: 0.5,
          my: 0.5,
          backgroundColor: isNotified ? '#ffebee' : '#f5f5f5',
          borderRadius: 1,
          fontWeight: isNotified ? 'bold' : 'normal',
          color: isNotified ? '#d32f2f' : 'inherit',
          minHeight: '18px',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          {isNotified && <Notifications fontSize="small" />}
          <Typography variant="caption" noWrap sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
            {event.title}
          </Typography>
        </Stack>
      </Box>
    );
  };

  const renderTableHeader = () => (
    <TableHead>
      <TableRow>
        {weekDays.map((day) => (
          <TableCell key={day} sx={{ width: '14.28%', padding: 1, textAlign: 'center' }}>
            {day}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );

  const cellStyle = {
    height: '120px',
    verticalAlign: 'top' as const,
    width: '14.28%',
    padding: 1,
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
  };

  const renderEventsForDate = (date: Date) => {
    return filteredEvents
      .filter((event) => new Date(event.date).toDateString() === date.toDateString())
      .map(renderEvent);
  };

  const renderEventsForDay = (day: number) => {
    return getEventsForDay(filteredEvents, day).map(renderEvent);
  };

  const renderCalendarTable = (title: string, children: React.ReactNode, testId: string) => (
    <Stack data-testid={testId} spacing={4} sx={{ width: '100%' }}>
      <Typography variant="h5">{title}</Typography>
      <TableContainer>
        <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
          {renderTableHeader()}
          <TableBody>{children}</TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);
    return renderCalendarTable(
      formatWeek(currentDate),
      <TableRow>
        {weekDates.map((date) => (
          <TableCell key={date.toISOString()} sx={cellStyle}>
            <Typography variant="body2" fontWeight="bold">
              {date.getDate()}
            </Typography>
            {renderEventsForDate(date)}
          </TableCell>
        ))}
      </TableRow>,
      'week-view'
    );
  };

  const renderMonthView = () => {
    const weeks = getWeeksAtMonth(currentDate);

    return renderCalendarTable(
      formatMonth(currentDate),
      weeks.map((week, weekIndex) => (
        <TableRow key={weekIndex}>
          {week.map((day, dayIndex) => {
            const dateString = day ? formatDate(currentDate, day) : '';
            const holiday = holidays[dateString];

            return (
              <TableCell
                key={dayIndex}
                sx={{
                  ...cellStyle,
                  position: 'relative',
                }}
              >
                {day && (
                  <>
                    <Typography variant="body2" fontWeight="bold">
                      {day}
                    </Typography>
                    {holiday && (
                      <Typography variant="body2" color="error">
                        {holiday}
                      </Typography>
                    )}
                    {renderEventsForDay(day)}
                  </>
                )}
              </TableCell>
            );
          })}
        </TableRow>
      )),
      'month-view'
    );
  };

  return (
    <Stack flex={1} spacing={5}>
      <Typography variant="h4">일정 보기</Typography>

      <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
        <IconButton aria-label="Previous" onClick={() => navigate('prev')}>
          <ChevronLeft />
        </IconButton>
        <Select
          size="small"
          aria-label="뷰 타입 선택"
          value={view}
          onChange={(e) => setView(e.target.value as 'week' | 'month')}
        >
          <MenuItem value="week" aria-label="week-option">
            Week
          </MenuItem>
          <MenuItem value="month" aria-label="month-option">
            Month
          </MenuItem>
        </Select>
        <IconButton aria-label="Next" onClick={() => navigate('next')}>
          <ChevronRight />
        </IconButton>
      </Stack>

      {view === 'week' && renderWeekView()}
      {view === 'month' && renderMonthView()}
    </Stack>
  );
}
