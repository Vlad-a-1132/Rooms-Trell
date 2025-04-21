import { NextApiRequest, NextApiResponse } from 'next';
import { cors } from '../cors';

// Обработчик для получения данных пользователя
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Создаем обработчик с поддержкой CORS
  async function getUserHandler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method === 'GET') {
      try {
        const { slug } = req.query;
        console.log('[API] Запрос данных пользователя с ID:', slug);

        // Отправляем запрос на оригинальный сервер
        const response = await fetch(`https://trello-clone-one.vercel.app/api/users/${slug}`);

        // Проверяем ответ
        if (!response.ok) {
          console.error(`[API] Ошибка при получении данных пользователя: ${response.status}`);
          return res.status(response.status).json({
            message: 'Error fetching user data',
            error: `Status code: ${response.status}`
          });
        }

        // Получаем данные
        const data = await response.json();
        console.log('[API] Данные пользователя получены успешно');

        // Отправляем ответ
        return res.status(200).json(data);
      } catch (error) {
        console.error('[API] Ошибка при запросе данных пользователя:', error);
        return res.status(500).json({
          message: 'Internal server error',
          error: error.message
        });
      }
    } else {
      // Для других методов возвращаем ошибку Method Not Allowed
      return res.status(405).json({ message: 'Method Not Allowed' });
    }
  }

  // Применяем CORS и выполняем обработчик
  return cors(getUserHandler)(req, res);
}
