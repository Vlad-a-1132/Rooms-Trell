import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/util/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  try {
    const { slug } = req.query;
    console.log('API boards/[slug] request:', { 
      method: req.method, 
      slug, 
      cookies: req.cookies,
      headers: {
        cookie: req.headers.cookie,
        Authorization: req.headers.authorization
      }
    });

    const { db, client } = await connectToDatabase();

    if (!client.isConnected()) {
      console.error('DB connection error');
      return res.status(500).json({ message: 'DB connection error', status: 500 });
    }

    const requestType = req.method;

    switch (requestType) {
      case 'GET': {
        console.log(`Fetching board with ID: ${slug}`);
        const board = await db.collection('boards').findOne({ _id: slug });
        
        if (!board) {
          console.error(`Board with ID ${slug} not found`);
          return res.status(404).json({ message: 'Board not found', status: 404 });
        }
        
        console.log(`Found board: `, { 
          id: board._id, 
          name: board.name, 
          createdBy: board.createdBy,
          users: board.users || []
        });
        
        // Проверяем, есть ли у текущего пользователя доступ к доске
        const userId = req.cookies.user_id;
        const hasAccess = !userId || 
          board.createdBy === userId || 
          (board.users && board.users.includes(userId));
        
        if (!hasAccess) {
          console.warn(`User ${userId} has no access to board ${slug}`);
          // Возвращаем доску в любом случае, решение о доступе может быть принято на клиенте
        }
        
        return res.status(200).json(board);
      }

      case 'PATCH': {
        console.log(`Updating board with ID: ${slug}`, req.body);
        const { _id, name, dateCreated, createdBy, backgroundImage } = req.body;

        const data = {
          _id,
          name,
          dateCreated,
          createdBy,
          backgroundImage
        };

        const result = await db.collection('boards').updateOne({ _id: slug }, { $set: data });
        console.log(`Board update result:`, result);
        
        if (result.matchedCount === 0) {
          return res.status(404).json({ message: 'Board not found', status: 404 });
        }
        
        return res.status(200).json({ success: true, ...result });
      }

      case 'DELETE': {
        console.log(`Deleting board with ID: ${slug}`);
        
        const cardsResult = await db.collection('cards').deleteMany({ boardId: slug });
        console.log(`Deleted cards:`, cardsResult);
        
        const columnsResult = await db.collection('columns').deleteMany({ boardId: slug });
        console.log(`Deleted columns:`, columnsResult);
        
        const boardResult = await db.collection('boards').deleteOne({ _id: slug });
        console.log(`Deleted board:`, boardResult);

        if (boardResult.deletedCount === 0) {
          return res.status(404).json({ message: 'Board not found', status: 404 });
        }

        return res.status(200).json({ 
          message: 'Board deleted with all columns and cards', 
          deletedCards: cardsResult.deletedCount,
          deletedColumns: columnsResult.deletedCount
        });
      }

      default:
        console.error(`Method ${requestType} not allowed`);
        return res.status(405).json({ message: 'Method not allowed', status: 405 });
    }
  } catch (error) {
    console.error('Error in boards/[slug] API:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      status: 500, 
      error: String(error) 
    });
  }
}
