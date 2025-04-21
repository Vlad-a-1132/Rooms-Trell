import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import checkEnvironment from '@/util/check-environment';
import { SingleUser } from '@/src/types/user';
import { BoardSlice } from '@/src/types/boards';

const initialState = {
  boards: [],
  status: 'idle',
  doneFetching: true,
  isRequesting: false,
  error: {}
};

const host = checkEnvironment();

export const fetchBoards = createAsyncThunk('boards/fetchBoards', async (_obj, { getState }) => {
  const { user } = getState() as { user: SingleUser };
  const id = user.id;

  console.log('Fetching boards for user id:', id);

  try {
    const response = await fetch(`${host}/api/boards?userid=${id}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching boards:', errorText);
      throw new Error(errorText);
    }

    const data = await response.json();
    console.log('Received boards data:', {
      total: data.length,
      boards: data.map((b) => ({ id: b._id, name: b.name, createdBy: b.createdBy, users: b.users }))
    });

    return data;
  } catch (error) {
    console.error('Error in fetchBoards:', error);
    throw error;
  }
});

export const createBoard = createAsyncThunk('board/create', async (_obj, { getState }) => {
  const { board } = getState() as { board: BoardSlice };
  const { user } = getState() as { user: SingleUser };

  const data = {
    _id: board.board._id,
    name: board.board.name,
    dateCreated: board.board.dateCreated,
    createdBy: user.id,
    backgroundImage: '/boards/board-background.jpg'
  };

  const url = `${host}/api/boards`;

  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data)
  });

  const inJSON = await response.json();
  return inJSON;
});

export const boardSlice = createSlice({
  name: 'boards',
  initialState: initialState,
  reducers: {
    resetBoards: () => initialState
  },
  extraReducers: {
    [fetchBoards.pending.toString()]: (state) => {
      state.status = 'pending';
    },
    [fetchBoards.fulfilled.toString()]: (state, { payload }) => {
      state.boards = payload;
      state.status = 'success';
    },
    [fetchBoards.rejected.toString()]: (state) => {
      state.status = 'failed';
    },
    [createBoard.pending.toString()]: (state) => {
      state.isRequesting = true;
      state.status = 'pending';
    },
    [createBoard.fulfilled.toString()]: (state) => {
      state.isRequesting = false;
      state.status = 'success';
    },
    [createBoard.rejected.toString()]: (state) => {
      state.isRequesting = false;
      state.status = 'failed';
    }
  }
});

export const { resetBoards } = boardSlice.actions;

export default boardSlice.reducer;
