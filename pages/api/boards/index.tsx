import type { NextApiRequest, NextApiResponse } from 'next';
import { cors } from '../cors';

import { connectToDatabase } from '@/util/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  try {
    console.log('Boards API request:', {
      method: req.method,
      query: req.query,
      cookies: req.cookies
    });

    const { db, client } = await connectToDatabase();

    if (client.isConnected()) {
      const requestType = req.method;

      switch (requestType) {
        case 'POST': {
          const { _id, name, dateCreated, createdBy, backgroundImage } = req.body;

          const data = {
            _id,
            name,
            dateCreated,
            createdBy,
            backgroundImage,
            users: []
          };

          const board = await db.collection('boards').insertOne(data);
          res.send(board);

          return;
        }

        case 'GET': {
          const { userid } = req.query;
          console.log('Fetching boards for user:', userid);

          // Получаем личные доски
          const boards = await db
            .collection('boards')
            .find({ createdBy: userid })
            .limit(30)
            .toArray();

          console.log('Found personal boards:', boards.length);

          // Получаем доски, в которые пользователь был приглашен
          // Используем $in оператор для поиска пользователя в массиве users
          // Учитываем возможные форматы ID (строка или ObjectId)
          const invitedBoards = await db
            .collection('boards')
            .find({
              users: userid,
              createdBy: { $ne: userid } // Исключаем доски, созданные пользователем
            })
            .toArray();

          console.log('Found invited boards:', invitedBoards.length);

          // Проверка содержимого invitedBoards
          if (invitedBoards.length > 0) {
            invitedBoards.forEach((board) => {
              console.log('Invited board:', {
                id: board._id,
                name: board.name,
                createdBy: board.createdBy,
                users: board.users
              });
            });
          } else {
            // Проверим содержимое всех досок, чтобы увидеть формат users
            console.log('Checking all boards to find invitation format...');
            const allBoards = await db.collection('boards').find({}).limit(10).toArray();

            allBoards.forEach((board) => {
              if (board.users && board.users.length > 0) {
                console.log(`Board ${board.name} users:`, {
                  usersArray: board.users,
                  usersType: typeof board.users,
                  firstUserType: typeof board.users[0]
                });
              }
            });
          }

          const updatedBoards = boards.concat(invitedBoards);
          console.log('Total boards:', updatedBoards.length);

          res.send(updatedBoards);

          return;
        }

        default:
          break;
      }
    } else {
      console.error('MongoDB connection error');
      res.send([]);
    }
  } catch (error) {
    console.error('Error in boards API:', error);
    res.status(500).send({ error: String(error) });
  }
}

// Обработчик для получения досок пользователя
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
function corsHandler(req: NextApiRequest, res: NextApiResponse) {
  return cors(getBoardsHandler)(req, res);
}
