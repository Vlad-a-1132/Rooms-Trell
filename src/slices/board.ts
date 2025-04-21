import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import checkEnvironment from '@/util/check-environment';
import { BoardSlice } from '@/src/types/boards';
import { RootState } from '@/src/store';
import { AxiosError } from 'axios';

const initialState = {
  board: {
    _id: '',
    name: '',
    columns: [],
    createdBy: '',
    dateCreated: '',
    backgroundImage: '',
    users: []
  },
  status: 'idle',
  isLoading: false,
  error: ''
};

const host = checkEnvironment();

export const saveBoard = createAsyncThunk('board/save', async (obj, { getState }) => {
  const { board } = getState() as { board: BoardSlice };

  const data = {
    _id: board.board._id,
    name: board.board.name,
    dateCreated: board.board.dateCreated,
    createdBy: board.board.createdBy,
    backgroundImage: board.board.backgroundImage
  };

  const url = `${host}/api/boards/${data._id}`;

  const response = await fetch(url, {
    method: 'PATCH',
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

  const json = await response.json();

  return json;
});

export const fetchBoard = createAsyncThunk(
  'board/fetch',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { board } = getState() as RootState;
      const slug = board._id;

      console.log(`📝 Fetching board: ${slug}`);

      const url = `${host}/api/boards/${slug}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.log("🚀 ~ file: board.ts ~ fetchBoard ~ error", error);
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      
      return rejectWithValue("An error occurred while fetching the board.");
    }
  }
);

export const deleteBoard = createAsyncThunk('board/delete', async (obj, { getState }) => {
  const { board } = getState() as { board: BoardSlice };

  const _id = board.board._id;

  const url = `${host}/api/boards/${_id}`;

  const response = await fetch(url, {
    method: 'DELETE',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer'
  });

  const json = await response.json();

  return json;
});

export const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    updateBoardDetail: (state, { payload }) => {
      state.board[payload.type] = payload.value;
    },
    resetBoard: () => initialState
  },
  extraReducers: {
    [fetchBoard.pending.toString()]: (state) => {
      state.status = 'pending';
    },
    [fetchBoard.fulfilled.toString()]: (state, { payload }) => {
      state.board = payload;
      state.status = 'success';
    },
    [fetchBoard.rejected.toString()]: (state) => {
      state.status = 'failed';
    },
    [saveBoard.pending.toString()]: (state) => {
      state.status = 'pending';
      state.isLoading = true;
    },
    [saveBoard.fulfilled.toString()]: (state, { payload }) => {
      state.isLoading = false;
      state.status = 'success';
    },
    [saveBoard.rejected.toString()]: (state) => {
      state.status = 'failed';
      state.isLoading = false;
    },
    [deleteBoard.pending.toString()]: (state) => {
      state.status = 'pending';
      state.isLoading = true;
    },
    [deleteBoard.fulfilled.toString()]: (state) => {
      state.isLoading = false;
      state.status = 'success';
    },
    [deleteBoard.rejected.toString()]: (state) => {
      state.status = 'failed';
      state.isLoading = false;
    }
  }
});

export const { updateBoardDetail, resetBoard } = boardSlice.actions;

export default boardSlice.reducer;
