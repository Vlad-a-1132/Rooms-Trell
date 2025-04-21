// Определение типа для состояния доски
export interface Board {
  _id: string;
  name: string;
  columns: any[];
  createdBy: string;
  dateCreated: string;
  backgroundImage: string;
  users: any[];
}

export interface BoardState {
  board: Board;
  status: 'idle' | 'pending' | 'success' | 'failed';
  isLoading: boolean;
  error: string;
}
