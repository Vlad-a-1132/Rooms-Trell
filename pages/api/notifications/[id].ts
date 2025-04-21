import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/util/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { db, client } = await connectToDatabase();

  if (client.isConnected()) {
    const requestType = req.method;
    const { id } = req.query;

    switch (requestType) {
      case 'PATCH': {
        try {
          // Получить user_id из cookies
          const { user_id } = req.cookies;

          if (!user_id) {
            res.status(200).json({ message: 'Unauthorized', success: false });
            return;
          }

          const { isRead } = req.body;

          // Проверка валидности id
          if (!id || typeof id !== 'string') {
            res.status(200).json({ message: 'Invalid notification ID', success: false });
            return;
          }

          let objectId;
          try {
            objectId = new ObjectId(id);
          } catch (error) {
            res.status(200).json({ message: 'Invalid ObjectId format', success: false });
            return;
          }

          // Проверяем, что уведомление принадлежит текущему пользователю
          const notification = await db
            .collection('notifications')
            .findOne({ _id: objectId, userId: user_id });

          if (!notification) {
            res.status(200).json({ message: 'Notification not found', success: false });
            return;
          }

          // Обновляем статус прочтения
          const result = await db
            .collection('notifications')
            .findOneAndUpdate({ _id: objectId }, { $set: { isRead } }, { returnDocument: 'after' });

          if (result.value) {
            res.status(200).json({ ...result.value, success: true });
          } else {
            res.status(200).json({ message: 'Update failed', success: false });
          }
        } catch (error) {
          console.error('Error updating notification:', error);
          res.status(200).json({ message: 'Error updating notification', success: false });
        }

        break;
      }

      default:
        res.status(200).json({ message: 'Method not allowed', success: false });
        break;
    }
  } else {
    res.status(200).json({ message: 'DB connection error', success: false });
  }
}
