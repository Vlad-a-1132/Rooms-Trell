import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/util/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  try {
    console.log("Debug boards API request:", {
      method: req.method,
      query: req.query,
      cookies: req.cookies
    });
    
    const { db, client } = await connectToDatabase();

    if (!client.isConnected()) {
      console.error("MongoDB connection error");
      return res.status(500).json({ message: 'DB connection error', status: 500 });
    }

    // Получаем пользователя из cookies
    const userId = req.cookies.user_id;
    console.log("User ID from cookies:", userId);
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized - User ID not found', status: 401 });
    }
    
    // Получаем все доски в базе данных
    const allBoards = await db.collection('boards').find({}).toArray();
    console.log("Total boards in database:", allBoards.length);
    
    // Выводим информацию о каждой доске
    allBoards.forEach(board => {
      console.log(`Board ${board.name} (${board._id}):`, {
        createdBy: board.createdBy,
        users: board.users || [],
        usersType: board.users ? typeof board.users : 'undefined',
        isArray: Array.isArray(board.users)
      });
    });
    
    // Проверяем, нужно ли добавить пользователя в доску для тестирования
    if (req.query.addToBoard && req.query.boardId) {
      const boardId = req.query.boardId as string;
      
      // Получаем доску
      const board = await db.collection('boards').findOne({ _id: boardId });
      
      if (!board) {
        return res.status(404).json({ message: 'Board not found', status: 404 });
      }
      
      // Проверяем, есть ли пользователь уже в доске
      const users = board.users || [];
      const userIdStr = String(userId);
      const isUserInBoard = users.some(id => String(id) === userIdStr);
      
      if (isUserInBoard) {
        console.log(`User ${userId} is already in board ${boardId}`);
      } else {
        // Добавляем пользователя в доску
        const result = await db.collection('boards').updateOne(
          { _id: boardId },
          { $push: { users: String(userId) } }
        );
        
        console.log(`Added user ${userId} to board ${boardId}:`, result);
      }
    }
    
    // Получаем личные доски пользователя
    const personalBoards = await db
      .collection('boards')
      .find({ createdBy: userId })
      .toArray();
    
    // Получаем доски, в которые пользователь был приглашен
    const invitedBoards = await db
      .collection('boards')
      .find({ users: userId })
      .toArray();
    
    // Проверяем, есть ли пользователь в массиве users каждой доски
    invitedBoards.forEach(board => {
      console.log(`Checking board ${board.name} (${board._id}):`);
      const users = board.users || [];
      console.log(`Board users:`, users);
      
      const userExists = users.some(id => String(id) === String(userId));
      console.log(`User ${userId} exists in board: ${userExists}`);
    });
    
    // Возвращаем результаты
    return res.status(200).json({
      personalBoards: personalBoards.map(b => ({ id: b._id, name: b.name })),
      invitedBoards: invitedBoards.map(b => ({ id: b._id, name: b.name })),
      allBoards: allBoards.map(b => ({ 
        id: b._id, 
        name: b.name, 
        createdBy: b.createdBy, 
        users: b.users || [] 
      }))
    });
  } catch (error) {
    console.error("Error in debug-boards API:", error);
    return res.status(500).json({ message: 'Internal server error', status: 500, error: String(error) });
  }
} 