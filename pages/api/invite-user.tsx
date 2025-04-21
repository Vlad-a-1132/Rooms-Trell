import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/util/mongodb';
import { verify } from 'jsonwebtoken';
import { parse } from 'cookie';

const KEY = process.env.JWT_SECRET_KEY;

// Функция для получения ID пользователя из запроса
const getUserIdFromRequest = async (req: NextApiRequest) => {
  try {
    // Пробуем получить user_id из cookie
    const { user_id } = req.cookies;
    if (user_id) {
      console.log('Found user_id in cookies:', user_id);
      return user_id;
    }

    // Если нет, пробуем получить из JWT токена
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.token;

    if (token) {
      console.log('Using JWT token to extract user_id');
      const decoded = verify(token, KEY) as { user: { id: string } };
      return decoded.user.id;
    }

    console.warn('No user_id or token found in request');
    return null;
  } catch (error) {
    console.error('Error extracting user_id:', error);
    return null;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  try {
    console.log('Received invite-user request:', {
      method: req.method,
      body: req.body,
      cookies: req.cookies,
      headers: {
        cookie: req.headers.cookie,
        Authorization: req.headers.authorization
      }
    });

    const { db, client } = await connectToDatabase();

    if (!client.isConnected()) {
      console.error('Database connection failed');
      return res.status(500).json({ message: 'DB connection error', status: 500 });
    }

    const requestType = req.method;

    switch (requestType) {
      case 'PATCH': {
        const { email, boardId } = req.body;

        if (!email || !boardId) {
          console.error('Missing required parameters:', { email, boardId });
          return res.status(400).json({ message: 'Email and boardId are required', status: 400 });
        }

        // Получаем ID текущего пользователя
        const currentUserId = await getUserIdFromRequest(req);

        if (!currentUserId) {
          console.error('Failed to extract user_id from request');
          return res.status(401).json({ message: 'Unauthorized - User ID not found', status: 401 });
        }

        console.log('Processing invitation:', { email, boardId, currentUserId });

        // Получаем информацию о пользователе, доске и текущем пользователе
        const user = await db.collection('users').findOne({ email });

        if (!user) {
          console.error(`User with email ${email} not found`);
          return res.status(404).json({ message: 'User not found', status: 404 });
        }

        console.log('Found user:', { id: user._id, email: user.email, fullName: user.fullName });

        const boardData = await db.collection('boards').findOne({ _id: boardId });

        if (!boardData) {
          console.error(`Board with ID ${boardId} not found`);
          return res.status(404).json({ message: 'Board not found', status: 404 });
        }

        console.log('Found board:', {
          id: boardData._id,
          name: boardData.name,
          currentUsers: boardData.users || []
        });

        const currentUser = await db.collection('users').findOne({ _id: currentUserId });

        if (!currentUser) {
          console.error(`Current user with ID ${currentUserId} not found`);
          return res.status(404).json({ message: 'Current user not found', status: 404 });
        }

        console.log('Current user (inviter):', {
          id: currentUser._id,
          email: currentUser.email,
          fullName: currentUser.fullName
        });

        // Проверяем, добавлен ли уже пользователь в доску
        const isExistingUser = boardData.users && boardData.users.indexOf(user._id) > -1;

        if (isExistingUser) {
          console.warn(`User ${user.email} is already added to board ${boardData.name}`);
          return res
            .status(400)
            .json({ message: 'User is already added to the board', status: 400 });
        }

        // Добавляем пользователя в доску
        console.log(`Adding user ${user._id} to board ${boardId}`);
        console.log('User ID type:', typeof user._id);

        // Получаем текущую доску еще раз для проверки users
        const boardBefore = await db.collection('boards').findOne({ _id: boardId });
        console.log('Board users before update:', boardBefore.users);

        // Проверяем, существует ли массив users
        const users = boardBefore.users || [];
        const userIdStr = String(user._id);

        // Если users не массив или это пустой массив, создаем новый
        const updateOp = Array.isArray(users)
          ? { $push: { users: userIdStr } }
          : { $set: { users: [userIdStr] } };

        const updateResult = await db.collection('boards').updateOne({ _id: boardId }, updateOp);

        if (!updateResult || updateResult.modifiedCount === 0) {
          console.error('Failed to update board:', updateResult);
          return res.status(500).json({ message: 'Failed to update board', status: 500 });
        }

        // Проверяем обновление
        const boardAfter = await db.collection('boards').findOne({ _id: boardId });
        console.log('Board users after update:', boardAfter.users);

        // Создаем уведомление для пользователя
        const notificationData = {
          userId: user._id,
          type: 'board_invite',
          message: `Вы были приглашены в доску "${boardData.name}"`,
          boardId: boardId,
          boardName: boardData.name || 'Unnamed Board',
          fromUser: currentUser.fullName || 'Unknown User',
          isRead: false,
          createdAt: new Date().toISOString()
        };

        console.log('Creating notification:', notificationData);
        const notificationResult = await db.collection('notifications').insertOne(notificationData);
        console.log(
          'Created notification for user:',
          user._id,
          'Result:',
          notificationResult.insertedId
        );

        // Возвращаем успешный ответ
        console.log('Invitation completed successfully');
        return res.status(200).json({
          message: 'User has been invited successfully',
          status: 200,
          success: true,
          boardId,
          boardName: boardData.name,
          userId: user._id
        });
      }

      default:
        console.error(`Method ${requestType} not allowed`);
        return res.status(405).json({ message: 'Method not allowed', status: 405 });
    }
  } catch (error) {
    console.error('Error in invite-user API:', error);
    return res.status(500).json({
      message: 'Internal server error',
      status: 500,
      error: String(error)
    });
  }
}
