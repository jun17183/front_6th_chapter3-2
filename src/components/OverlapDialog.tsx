import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';

import { Event, EventForm } from '../types';

interface OverlapDialogProps {
  open: boolean;
  overlappingEvents: Event[];
  eventData: Event | EventForm | null;
  onClose: () => void;
  onConfirm: (eventData: Event | EventForm) => void;
}

export function OverlapDialog({
  open,
  overlappingEvents,
  eventData,
  onClose,
  onConfirm,
}: OverlapDialogProps) {
  const handleConfirm = () => {
    if (eventData) {
      onConfirm(eventData);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>일정 겹침 경고</DialogTitle>
      <DialogContent>
        <DialogContentText>
          다음 일정과 겹칩니다:
          {overlappingEvents.map((event) => (
            <Typography key={event.id}>
              {event.title} ({event.date} {event.startTime}-{event.endTime})
            </Typography>
          ))}
          계속 진행하시겠습니까?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button color="error" onClick={handleConfirm}>
          계속 진행
        </Button>
      </DialogActions>
    </Dialog>
  );
}
