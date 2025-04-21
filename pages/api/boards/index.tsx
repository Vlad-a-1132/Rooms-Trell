import type { NextApiRequest, NextApiResponse } from 'next';

import { connectToDatabase } from '@/util/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  try {
    console.log("Boards API request:", {
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
          console.log("Fetching boards for user:", userid);

          // Получаем личные доски
          const boards = await db
            .collection('boards')
            .find({ createdBy: userid })
            .limit(30)
            .toArray();
          
          console.log("Found personal boards:", boards.length);

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
          
          console.log("Found invited boards:", invitedBoards.length);
          
          // Проверка содержимого invitedBoards
          if (invitedBoards.length > 0) {
            invitedBoards.forEach(board => {
              console.log("Invited board:", {
                id: board._id,
                name: board.name,
                createdBy: board.createdBy,
                users: board.users
              });
            });
          } else {
            // Проверим содержимое всех досок, чтобы увидеть формат users
            console.log("Checking all boards to find invitation format...");
            const allBoards = await db.collection('boards').find({}).limit(10).toArray();
            
            allBoards.forEach(board => {
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
          console.log("Total boards:", updatedBoards.length);

          res.send(updatedBoards);

          return;
        }

        default:
          break;
      }
    } else {
      console.error("MongoDB connection error");
      res.send([]);
    }
  } catch (error) {
    console.error("Error in boards API:", error);
    res.status(500).send({ error: String(error) });
  }
}
