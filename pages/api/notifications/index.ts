import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/util/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { db, client } = await connectToDatabase();

  if (client.isConnected()) {
    const requestType = req.method;

    switch (requestType) {
      case 'GET': {
        // Получить user_id из cookies или session
        const { user_id } = req.cookies;

        if (!user_id) {
          // Возвращаем пустой массив вместо ошибки авторизации
          res.status(200).json([]);
          return;
        }

        try {
          const notifications = await db
            .collection('notifications')
            .find({ userId: user_id })
            .sort({ createdAt: -1 })
            .toArray();

          // Возвращаем пустой массив, если notifications равен null или undefined
          res.status(200).json(notifications || []);
        } catch (error) {
          console.error('Error fetching notifications:', error);
          // Возвращаем пустой массив вместо ошибки
          res.status(200).json([]);
        }

        break;
      }

      default:
        res.status(405).json([]);
        break;
    }
  } else {
    // Возвращаем пустой массив вместо ошибки соединения с БД
    res.status(200).json([]);
  }
}
