import type { NextApiRequest, NextApiResponse } from 'next';
import { cors } from '../cors';
import { serialize } from 'cookie';

// Обработчик API для перенаправления запросов входа на оригинальный сервер
async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // Разрешаем только POST запросы
  if (req.method === 'POST') {
    try {
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

      // Если ответ успешный и содержит токен, устанавливаем куки вручную
      if (response.status === 200 && data.token) {
        // Устанавливаем куки для токена и user_id
        const cookieOptions = {
          httpOnly: true,
          secure: false, // Отключаем secure для тестирования
          maxAge: 60 * 60 * 24 * 1000, // 1 день
          sameSite: 'none' as const, // Для кросс-доменных запросов
          path: '/'
        };

        // Добавляем domain если мы на Vercel
        if (req.headers.host?.includes('vercel.app')) {
          console.log('Vercel environment detected, setting specific cookie options');
        }

        // Установка куков вручную
        res.setHeader('Set-Cookie', [
          serialize('token', data.token, cookieOptions),
          serialize('user_id', data.id || '', {
            ...cookieOptions,
            httpOnly: false // Make user_id accessible on client-side
          })
        ]);

        // Для отладки, выведем в консоль
        console.log('Setting cookies with token:', data.token);
        console.log('User ID:', data.id);
        console.log('Host:', req.headers.host);

        // Явно включаем данные в ответ для использования клиентом
        data.id = data.id || '';
        data.clientToken = data.token;
        data.success = true;
      }

      // Возвращаем статус и данные
      res.status(response.status).json(data);
    } catch (error) {
      console.error('Error forwarding login request:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  } else {
    // Для других методов возвращаем ошибку Method Not Allowed
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

// Оборачиваем обработчик в CORS middleware
export default cors(handler);
