import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/util/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  try {
    console.log('Fix invitation API request:', {
      method: req.method,
      body: req.body,
      query: req.query,
      cookies: req.cookies
    });

    const { db, client } = await connectToDatabase();

    if (!client.isConnected()) {
      console.error('Database connection failed');
      return res.status(500).json({ message: 'DB connection error', status: 500 });
    }

    // Получаем ID пользователя из cookies
    const userId = req.cookies.user_id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized - User ID not found', status: 401 });
    }

    const { boardId } = req.query;

    if (!boardId) {
      return res.status(400).json({ message: 'Board ID is required', status: 400 });
    }

    // Получаем текущую доску для проверки
    const board = await db.collection('boards').findOne({ _id: boardId });

    if (!board) {
      return res.status(404).json({ message: 'Board not found', status: 404 });
    }

    console.log('Current board state:', {
      id: board._id,
      name: board.name,
      createdBy: board.createdBy,
      users: board.users || []
    });

    // Проверяем, есть ли уже пользователь в доске
    const users = board.users || [];
    const userExists = users.some((id) => String(id) === String(userId));

    if (userExists) {
      console.log(`User ${userId} is already in board ${boardId}`);
      return res.status(200).json({
        message: 'User is already in board',
        status: 200,
        board: {
          id: board._id,
          name: board.name,
          users: board.users
        }
      });
    }

    // Добавляем пользователя в доску
    console.log(`Adding user ${userId} to board ${boardId}`);

    // Если users не массив, создаем новый массив
    const updateOp = Array.isArray(users)
      ? { $push: { users: String(userId) } }
      : { $set: { users: [String(userId)] } };

    const updateResult = await db.collection('boards').updateOne({ _id: boardId }, updateOp);

    if (!updateResult || updateResult.modifiedCount === 0) {
      console.error('Failed to update board:', updateResult);
      return res.status(500).json({ message: 'Failed to update board', status: 500 });
    }

    // Получаем обновленную доску
    const updatedBoard = await db.collection('boards').findOne({ _id: boardId });

    return res.status(200).json({
      message: 'User added to board successfully',
      status: 200,
      board: {
        id: updatedBoard._id,
        name: updatedBoard.name,
        users: updatedBoard.users
      }
    });
  } catch (error) {
    console.error('Error in fix-invitation API:', error);
    return res.status(500).json({
      message: 'Internal server error',
      status: 500,
      error: String(error)
    });
  }
}
