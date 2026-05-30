import { create } from 'zustand';

export type NotificationType = 'booking' | 'ride_update' | 'sos' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationState {
  notifications: Notification[];
  push: (n: { type: NotificationType; title: string; body: string }) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

export function unreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.read).length;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  push: ({ type, title, body }) =>
    set((state) => ({
      notifications: [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type,
          title,
          body,
          read: false,
          createdAt: new Date(),
        },
        ...state.notifications,
      ],
    })),

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  clear: () => set({ notifications: [] }),
}));
