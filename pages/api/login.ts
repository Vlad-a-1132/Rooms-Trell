import { NextApiRequest, NextApiResponse } from 'next';
import { cors } from './cors';

// Прямой обработчик, чтобы избежать 404 ошибки
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Реализуем тот же функционал, что и в login/index.tsx
  async function directLoginHandler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    // Разрешаем только POST запросы
    if (req.method === 'POST') {
      try {
        console.log('[API] Обработка запроса login');

        // Отправляем запрос на оригинальный сервер
        const response = await fetch('https://trello-clone-one.vercel.app/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(req.body)
        });

        // Получаем ответ
        const data = await response.json();
        console.log('[API] Получен ответ от оригинального сервера:', response.status);

        // Если ответ успешный и содержит токен, устанавливаем куки вручную
        if (response.status === 200 && data.token) {
          console.log('[API] Установка куки...');

          // Установка куков вручную
          res.setHeader('Set-Cookie', [
            `token=${data.token}; Path=/; Max-Age=86400; HttpOnly`,
            `user_id=${data.id || ''}; Path=/; Max-Age=86400`
          ]);

          // Явно включаем данные в ответ для использования клиентом
          data.id = data.id || '';
          data.clientToken = data.token;
          data.success = true;
        }

        // Возвращаем статус и данные
        res.status(response.status).json(data);
      } catch (error) {
        console.error('[API] Ошибка при обработке запроса login:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
      }
    } else {
      // Для других методов возвращаем ошибку Method Not Allowed
      res.status(405).json({ message: 'Method Not Allowed' });
    }
  }

  // Применяем CORS и выполняем обработчик
  return cors(directLoginHandler)(req, res);
}
