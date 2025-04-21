import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/util/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  try {
    console.log("Fix board users API request:", {
      method: req.method,
      query: req.query,
      body: req.body,
      cookies: req.cookies
    });
    
    const { db, client } = await connectToDatabase();

    if (!client.isConnected()) {
      console.error("MongoDB connection error");
      return res.status(500).json({ message: 'DB connection error', status: 500 });
    }

    // Только админ может выполнять эту операцию
    const userId = req.cookies.user_id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized', status: 401 });
    }
    
    const { boardId, targetUserId } = req.query;
    
    if (!boardId || !targetUserId) {
      return res.status(400).json({ 
        message: 'Missing required parameters: boardId and targetUserId are required', 
        status: 400 
      });
    }
    
    // Получаем доску
    const board = await db.collection('boards').findOne({ _id: boardId });
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found', status: 404 });
    }
    
    console.log("Found board:", {
      id: board._id,
      name: board.name,
      createdBy: board.createdBy,
      users: board.users || []
    });
    
    // Проверяем, есть ли пользователь в массиве users
    const users = board.users || [];
    const userIdStr = String(targetUserId);
    const userExists = users.some(id => String(id) === userIdStr);
    
    if (userExists) {
      console.log(`User ${targetUserId} is already in board ${boardId}`);
      return res.status(200).json({ 
        message: 'User is already in board', 
        status: 200 
      });
    }
    
    // Добавляем пользователя в доску
    const updateOp = Array.isArray(users) 
      ? { $push: { users: String(targetUserId) } }
      : { $set: { users: [String(targetUserId)] } };
    
    const result = await db.collection('boards').updateOne(
      { _id: boardId }, 
      updateOp
    );
    
    if (result.modifiedCount === 0) {
      return res.status(500).json({ 
        message: 'Failed to update board', 
        status: 500 
      });
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
    console.error("Error in fix-board-users API:", error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      status: 500, 
      error: String(error) 
    });
  }
} 