import type { NextApiRequest, NextApiResponse } from 'next';
import { cors } from '../cors';

// Обработчик API для перенаправления запросов на оригинальный сервер
async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // Разрешаем только POST запросы
  if (req.method === 'POST') {
    try {
      // Отправляем запрос на оригинальный сервер
      const response = await fetch('https://trello-clone-one.vercel.app/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      });

      // Получаем ответ
      const data = await response.json();

      // Возвращаем такой же статус и данные
      res.status(response.status).json(data);
    } catch (error) {
      console.error('Error forwarding register request:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  } else {
    // Для других методов возвращаем ошибку Method Not Allowed
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

// Оборачиваем обработчик в CORS middleware
export default cors(handler);
