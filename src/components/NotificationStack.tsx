import Close from '@mui/icons-material/Close';
import { Alert, AlertTitle, IconButton, Stack } from '@mui/material';

interface Notification {
  id: string;
  message: string;
}

interface NotificationStackProps {
  notifications: Notification[];
  onRemoveNotification: (index: number) => void;
}

export function NotificationStack({ notifications, onRemoveNotification }: NotificationStackProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <Stack position="fixed" top={16} right={16} spacing={2} alignItems="flex-end">
      {notifications.map((notification, _index) => (
        <Alert
          key={_index}
          severity="info"
          sx={{ width: 'auto' }}
          action={
            <IconButton size="small" onClick={() => onRemoveNotification(_index)}>
              <Close />
            </IconButton>
          }
        >
          <AlertTitle>{notification.message}</AlertTitle>
        </Alert>
      ))}
    </Stack>
  );
}
