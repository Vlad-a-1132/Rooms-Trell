import { NextApiRequest, NextApiResponse } from 'next';
import { cors } from './cors';

// Обработчик для получения досок пользователя
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Создаем обработчик с поддержкой CORS
  async function getBoardsHandler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method === 'GET') {
      try {
        const { userid } = req.query;
        console.log('[API] Запрос досок для пользователя:', userid);

        if (!userid) {
          return res.status(400).json({ message: 'User ID is required' });
        }

        // Отправляем запрос на оригинальный сервер
        const response = await fetch(
          `https://trello-clone-one.vercel.app/api/boards?userid=${userid}`
        );

        // Проверяем ответ
        if (!response.ok) {
          console.error(`[API] Ошибка при получении досок: ${response.status}`);
          return res.status(response.status).json({
            message: 'Error fetching boards',
            error: `Status code: ${response.status}`
          });
        }

        // Получаем данные
        const data = await response.json();
        console.log('[API] Доски получены успешно:', data.length);

        // Отправляем ответ
        return res.status(200).json(data);
      } catch (error) {
        console.error('[API] Ошибка при запросе досок:', error);
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
  return cors(getBoardsHandler)(req, res);
}
