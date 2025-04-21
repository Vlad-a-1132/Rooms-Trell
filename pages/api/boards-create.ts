import { NextApiRequest, NextApiResponse } from 'next';
import { cors } from './cors';

// Обработчик для создания новой доски
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Создаем обработчик с поддержкой CORS
  async function createBoardHandler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method === 'POST') {
      try {
        console.log('[API] Запрос на создание новой доски:', req.body);

        // Отправляем запрос на оригинальный сервер
        const response = await fetch('https://trello-clone-one.vercel.app/api/boards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(req.body)
        });

        // Проверяем ответ
        if (!response.ok) {
          console.error(`[API] Ошибка при создании доски: ${response.status}`);
          return res.status(response.status).json({
            message: 'Error creating board',
            error: `Status code: ${response.status}`
          });
        }

        // Получаем данные
        const data = await response.json();
        console.log('[API] Доска успешно создана:', data);

        // Отправляем ответ
        return res.status(200).json(data);
      } catch (error) {
        console.error('[API] Ошибка при создании доски:', error);
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
  return cors(createBoardHandler)(req, res);
}
