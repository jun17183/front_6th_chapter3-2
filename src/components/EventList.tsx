import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import Notifications from '@mui/icons-material/Notifications';
import {
  Box,
  FormControl,
  FormLabel,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { useSearch } from '../hooks/useSearch';
import { Event } from '../types';

const notificationOptions = [
  { value: 1, label: '1분 전' },
  { value: 10, label: '10분 전' },
  { value: 60, label: '1시간 전' },
  { value: 120, label: '2시간 전' },
  { value: 1440, label: '1일 전' },
];

interface EventListProps {
  events: Event[];
  currentDate: Date;
  view: 'week' | 'month';
  notifiedEvents: string[];
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (id: string) => void;
}

export function EventList({
  events,
  currentDate,
  view,
  notifiedEvents,
  onEditEvent,
  onDeleteEvent,
}: EventListProps) {
  const { searchTerm, filteredEvents, setSearchTerm } = useSearch(events, currentDate, view);

  return (
    <Stack
      data-testid="event-list"
      spacing={2}
      sx={{ width: '30%', height: '100%', overflowY: 'auto' }}
    >
      <FormControl fullWidth>
        <FormLabel htmlFor="search">일정 검색</FormLabel>
        <TextField
          id="search"
          size="small"
          placeholder="검색어를 입력하세요"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </FormControl>

      {filteredEvents.length === 0 ? (
        <Typography>검색 결과가 없습니다.</Typography>
      ) : (
        filteredEvents.map((event) => (
          <Box
            key={event.id}
            data-testid="event-item"
            sx={{ border: 1, borderRadius: 2, p: 3, width: '100%' }}
          >
            <Stack direction="row" justifyContent="space-between">
              <Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  {notifiedEvents.includes(event.id) && <Notifications color="error" />}
                  <Typography
                    fontWeight={notifiedEvents.includes(event.id) ? 'bold' : 'normal'}
                    color={notifiedEvents.includes(event.id) ? 'error' : 'inherit'}
                  >
                    {event.title}
                  </Typography>
                </Stack>
                <Typography>{event.date}</Typography>
                <Typography>
                  {event.startTime} - {event.endTime}
                </Typography>
                <Typography>{event.description}</Typography>
                <Typography>{event.location}</Typography>
                <Typography>카테고리: {event.category}</Typography>
                {event.repeat.type !== 'none' && (
                  <Typography>
                    반복: {event.repeat.interval}
                    {event.repeat.type === 'daily' && '일'}
                    {event.repeat.type === 'weekly' && '주'}
                    {event.repeat.type === 'monthly' && '월'}
                    {event.repeat.type === 'yearly' && '년'}
                    마다
                    {event.repeat.endDate && ` (종료: ${event.repeat.endDate})`}
                  </Typography>
                )}
                <Typography>
                  알림:{' '}
                  {
                    notificationOptions.find((option) => option.value === event.notificationTime)
                      ?.label
                  }
                </Typography>
              </Stack>
              <Stack>
                <IconButton aria-label="Edit event" onClick={() => onEditEvent(event)}>
                  <Edit />
                </IconButton>
                <IconButton aria-label="Delete event" onClick={() => onDeleteEvent(event.id)}>
                  <Delete />
                </IconButton>
              </Stack>
            </Stack>
          </Box>
        ))
      )}
    </Stack>
  );
}
