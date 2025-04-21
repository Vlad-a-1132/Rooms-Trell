import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import checkEnvironment from '@/util/check-environment';

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  message: string;
  boardId: string;
  boardName: string;
  fromUser: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsState {
  items: Notification[];
  unreadCount: number;
  status: 'idle' | 'loading' | 'failed' | 'succeeded';
  error: string | null;
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  status: 'idle',
  error: null
};

const host = checkEnvironment();

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async () => {
    const response = await fetch(`${host}/api/notifications`);
    const data = await response.json();
    return data;
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string) => {
    const response = await fetch(`${host}/api/notifications/${notificationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isRead: true })
    });
    const data = await response.json();
    return data;
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async () => {
    const response = await fetch(`${host}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    return data;
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const notificationsArray = Array.isArray(action.payload) ? action.payload : [];
        state.items = notificationsArray;
        state.unreadCount = notificationsArray.filter((notification: Notification) => !notification.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        if (action.payload && action.payload._id) {
          const index = state.items.findIndex(item => item._id === action.payload._id);
          if (index !== -1) {
            state.items[index] = action.payload;
            state.unreadCount = state.items.filter(notification => !notification.isRead).length;
          }
        }
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.items = state.items.map(item => ({ ...item, isRead: true }));
        state.unreadCount = 0;
      });
  }
});

export default notificationsSlice.reducer; 