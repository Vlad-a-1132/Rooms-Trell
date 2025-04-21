import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/util/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { db, client } = await connectToDatabase();

  if (client.isConnected()) {
    const requestType = req.method;

    switch (requestType) {
      case 'PATCH': {
        try {
          // Получить user_id из cookies
          const { user_id } = req.cookies;
          
          if (!user_id) {
            res.status(200).json({ 
              message: 'Unauthorized', 
              success: false,
              modifiedCount: 0 
            });
            return;
          }
          
          // Обновить все непрочитанные уведомления пользователя
          const result = await db
            .collection('notifications')
            .updateMany(
              { userId: user_id, isRead: false },
              { $set: { isRead: true } }
            );
            
          res.status(200).json({ 
            message: 'All notifications marked as read',
            success: true,
            modifiedCount: result ? result.modifiedCount : 0 
          });
        } catch (error) {
          console.error('Error updating notifications:', error);
          res.status(200).json({ 
            message: 'Error updating notifications', 
            success: false,
            modifiedCount: 0,
            error: String(error)
          });
        }
        
        break;
      }
      
      default:
        res.status(200).json({ 
          message: 'Method not allowed', 
          success: false,
          modifiedCount: 0 
        });
        break;
    }
  } else {
    res.status(200).json({ 
      message: 'DB connection error', 
      success: false,
      modifiedCount: 0 
    });
  }
} 