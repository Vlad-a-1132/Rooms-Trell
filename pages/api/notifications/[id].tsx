import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/util/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  try {
    console.log('API notifications/[id] request:', { 
      method: req.method, 
      id: req.query.id,
      body: req.body,
      cookies: req.cookies
    });

    const { db, client } = await connectToDatabase();

    if (!client.isConnected()) {
      console.error('DB connection error');
      return res.status(500).json({ message: 'DB connection error', status: 500 });
    }

    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid notification ID', status: 400 });
    }

    const requestType = req.method;

    switch (requestType) {
      case 'PATCH': {
        // Получаем уведомление
        const notification = await db.collection('notifications').findOne({ _id: id });
        
        if (!notification) {
          console.error(`Notification with ID ${id} not found`);
          return res.status(404).json({ message: 'Notification not found', status: 404 });
        }
        
        console.log("Found notification:", notification);
        
        // Обновляем уведомление
        const { isRead } = req.body;
        const updateResult = await db.collection('notifications').updateOne(
          { _id: id },
          { $set: { isRead } }
        );
        
        if (!updateResult || updateResult.modifiedCount === 0) {
          console.error("Failed to update notification:", updateResult);
          return res.status(500).json({ message: 'Failed to update notification', status: 500 });
        }
        
        // Если это приглашение в доску, убедимся, что пользователь добавлен в доску
        if (notification.type === 'board_invite' && notification.boardId) {
          const userId = notification.userId;
          const boardId = notification.boardId;
          
          console.log(`Checking if user ${userId} is added to board ${boardId}`);
          
          // Проверяем, есть ли пользователь в доске
          const board = await db.collection('boards').findOne({ _id: boardId });
          
          if (!board) {
            console.error(`Board with ID ${boardId} not found`);
          } else {
            const users = board.users || [];
            const userIdStr = String(userId);
            const userIds = users.map(id => String(id));
            
            if (!userIds.includes(userIdStr)) {
              console.log(`User ${userId} not found in board users. Adding...`);
              
              // Добавляем пользователя в доску
              await db.collection('boards').updateOne(
                { _id: boardId },
                { $push: { users: String(userId) } }
              );
              
              console.log(`User ${userId} added to board ${boardId}`);
            } else {
              console.log(`User ${userId} already in board users`);
            }
          }
        }
        
        // Получаем обновленное уведомление
        const updatedNotification = await db.collection('notifications').findOne({ _id: id });
        
        return res.status(200).json(updatedNotification);
      }

      default:
        console.error(`Method ${requestType} not allowed`);
        return res.status(405).json({ message: 'Method not allowed', status: 405 });
    }
  } catch (error) {
    console.error('Error in notifications/[id] API:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      status: 500, 
      error: String(error) 
    });
  }
} 