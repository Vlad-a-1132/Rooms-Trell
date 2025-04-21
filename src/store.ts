import { configureStore } from '@reduxjs/toolkit';
import boardsSlice from '@/src/slices/boards';
import userSlice from '@/src/slices/user';
import boardSlice from '@/src/slices/board';
import columnsSlice from '@/src/slices/columns';
import cardsSlice from '@/src/slices/cards';
import usersSlice from '@/src/slices/users';
import notificationsSlice from '@/src/slices/notifications';

const rootReducer = {
  boards: boardsSlice,
  board: boardSlice,
  user: userSlice,
  columns: columnsSlice,
  cards: cardsSlice,
  users: usersSlice,
  notifications: notificationsSlice
};

const createStore = (preloadedState = {}) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState
  });
};

// Создаем тип RootState на основе возвращаемого типа configureStore
export type RootState = {
  boards: ReturnType<typeof boardsSlice>;
  board: ReturnType<typeof boardSlice>;
  user: ReturnType<typeof userSlice>;
  columns: ReturnType<typeof columnsSlice>;
  cards: ReturnType<typeof cardsSlice>;
  users: ReturnType<typeof usersSlice>;
  notifications: ReturnType<typeof notificationsSlice>;
};

export type AppDispatch = ReturnType<typeof createStore>['dispatch'];

export default createStore;
