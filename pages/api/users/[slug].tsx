import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/util/mongodb';
import { cors } from '../cors';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // Оборачиваем в CORS middleware
  return cors(userHandler)(req, res);
}

// Обработчик запросов к пользователям
async function userHandler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { slug } = req.query;

  try {
    // Проверяем наличие локальной базы данных
    const { db, client } = await connectToDatabase();

    if (client.isConnected()) {
      const requestType = req.method;

      switch (requestType) {
        case 'GET': {
          console.log('[API] Запрос данных пользователя с ID:', slug);

          try {
            // Сначала пробуем найти пользователя в нашей базе данных
            const user = await db.collection('users').findOne({ _id: slug });

            if (user) {
              console.log('[API] Пользователь найден в локальной БД');
              return res.status(200).json(user);
            } else {
              console.log(
                '[API] Пользователь не найден в локальной БД, обращаемся к оригинальному API'
              );

              // Если пользователь не найден, делаем запрос к оригинальному API
              const response = await fetch(`https://trello-clone-one.vercel.app/api/users/${slug}`);

              if (!response.ok) {
                console.error(`[API] Ошибка при получении данных пользователя: ${response.status}`);
                return res.status(response.status).json({
                  message: 'Error fetching user data',
                  error: `Status code: ${response.status}`
                });
              }

              const userData = await response.json();
              console.log('[API] Данные пользователя получены успешно');

              return res.status(200).json(userData);
            }
          } catch (error) {
            console.error('[API] Ошибка при запросе данных пользователя:', error);
            return res.status(500).json({
              message: 'Internal server error',
              error: error.message
            });
          }
        }

        case 'PATCH': {
          break;
        }

        case 'DELETE': {
          break;
        }

        default:
          res.status(405).json({ message: 'Method Not Allowed' });
          break;
      }
    } else {
      console.log('[API] Ошибка подключения к БД, перенаправляем запрос на оригинальный API');

      // Если нет подключения к БД, просто перенаправляем запрос к оригинальному API
      const response = await fetch(`https://trello-clone-one.vercel.app/api/users/${slug}`);

      if (!response.ok) {
        return res.status(response.status).json({
          message: 'Error fetching user data',
          error: `Status code: ${response.status}`
        });
      }

      const userData = await response.json();
      return res.status(200).json(userData);
    }
  } catch (dbError) {
    console.error('[API] Ошибка при работе с базой данных:', dbError);

    // В случае ошибки с базой данных перенаправляем запрос к оригинальному API
    try {
      const response = await fetch(`https://trello-clone-one.vercel.app/api/users/${slug}`);

      if (!response.ok) {
        return res.status(response.status).json({
          message: 'Error fetching user data',
          error: `Status code: ${response.status}`
        });
      }

      const userData = await response.json();
      return res.status(200).json(userData);
    } catch (apiError) {
      return res.status(500).json({
        message: 'Internal server error',
        dbError: dbError.message,
        apiError: apiError.message
      });
    }
  }
}
