import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/util/mongodb';
import checkEnvironment from '@/util/check-environment';
import sgMail from '@sendgrid/mail';
import shortId from 'shortid';
import uniqid from 'uniqid';
import { verify } from 'jsonwebtoken';
import { parse } from 'cookie';

const KEY = process.env.JWT_SECRET_KEY;

const getUserIdFromRequest = async (req: NextApiRequest) => {
  try {
    // Пробуем получить user_id из cookie
    const { user_id } = req.cookies;
    if (user_id) {
      return user_id;
    }

    // Если нет, пробуем получить из JWT токена
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.token;
    
    if (token) {
      const decoded = verify(token, KEY) as { user: { id: string } };
      return decoded.user.id;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting user_id:', error);
    return null;
  }
};

// Попытка отправить email, но функция может завершиться успешно даже при ошибке email
const sendMail = async (email, emailData, boardName) => {
  const url = checkEnvironment();
  const page = 'signup';

  const msg = {
    to: email,
    from: 'dell41ankit@gmail.com', // Убедитесь, что этот email верифицирован в SendGrid
    subject: `You are invited to join "${boardName}" board in Trello Clone`,
    html: `<div>
      <div style="height:100px; background-color:#26292c; color: white; padding: 20px; text-align: center;">
        <h2>Trello Clone</h2>
      </div>
      <div style="padding: 20px; background-color:#0079bf; color: white; text-align: center;">
        <h3>You have been invited to join "${boardName}" board</h3>
        <p style="margin-bottom: 20px;">Click the button below to accept the invitation:</p>
        <a href='${url}/${page}?token=${emailData.token}&email=${email}&boardId=${emailData.boardId}' 
           style="background-color: #ffffff; color: #0079bf; padding: 10px 20px; text-decoration: none; border-radius: 3px; font-weight: bold;">
          Join Board
        </a>
      </div>
      <div style="height:100px; background-color:#26292c; color: white; padding: 20px; text-align: center;">
        <p>If you didn't request this invitation, you can ignore this email.</p>
      </div>
    </div>`
  };

  // Пытаемся отправить email, но не прерываем процесс, если это не удалось
  try {
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.')) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      await sgMail.send(msg);
      console.log('Email sent successfully to:', email);
      return { success: true, emailSent: true };
    } else {
      console.warn('SENDGRID_API_KEY not properly configured. Email not sent.');
      return { success: true, emailSent: false, reason: 'API key not configured' };
    }
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: true, emailSent: false, error: String(error) };
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { db, client } = await connectToDatabase();

  if (client.isConnected()) {
    const requestType = req.method;

    switch (requestType) {
      case 'POST': {
        try {
          const { email, boardId } = req.body;
          
          if (!email || !boardId) {
            return res.status(400).json({ 
              message: 'Email and boardId are required', 
              status: 400 
            });
          }

          // Получаем текущий user_id из запроса
          const currentUserId = await getUserIdFromRequest(req);
          
          if (!currentUserId) {
            return res.status(401).json({ 
              message: 'Unauthorized - Could not identify user', 
              status: 401 
            });
          }

          const token = uniqid();
          const id = shortId.generate();

          const emailData = {
            id,
            token,
            boardId
          };

          // Получаем информацию о доске и текущем пользователе
          const board = await db.collection('boards').findOne({ _id: boardId });
          const currentUser = await db.collection('users').findOne({ _id: currentUserId });
          
          if (!board) {
            return res.status(404).json({ 
              message: 'Board not found', 
              status: 404 
            });
          }

          if (!currentUser) {
            return res.status(404).json({ 
              message: 'Current user not found', 
              status: 404 
            });
          }

          // Проверяем, существует ли пользователь
          const invitedUser = await db.collection('users').findOne({ email });

          // Сохраняем токен для приглашения
          await db.collection('token').insertOne({ 
            token, 
            userId: id, 
            status: 'valid', 
            email, 
            boardId,
            createdBy: currentUserId,
            createdAt: new Date()
          });

          let notificationCreated = false;
          
          // Если пользователь уже существует, создаем для него уведомление
          if (invitedUser) {
            const notificationData = {
              userId: invitedUser._id,
              type: 'board_invite',
              message: `Вы были приглашены в доску "${board.name}"`,
              boardId: boardId,
              boardName: board.name || 'Unnamed Board',
              fromUser: currentUser.fullName || 'Unknown User',
              isRead: false,
              createdAt: new Date().toISOString()
            };

            await db.collection('notifications').insertOne(notificationData);
            notificationCreated = true;
            console.log('Created notification for user:', invitedUser._id);
          }

          // Пытаемся отправить email, но не прерываем процесс, если не удалось
          const emailResult = await sendMail(email, emailData, board.name);
          
          // Возвращаем успешный результат, даже если email не отправлен
          return res.status(200).json({ 
            message: 'Invitation processed successfully', 
            status: 200,
            notificationCreated,
            emailSent: emailResult.emailSent
          });
          
        } catch (error) {
          console.error('Error in invitation process:', error);
          return res.status(500).json({ 
            message: 'Internal server error', 
            status: 500,
            error: String(error)
          });
        }
      }

      default:
        return res.status(405).json({ message: 'Method not allowed', status: 405 });
    }
  } else {
    return res.status(500).json({ message: 'DB connection error', status: 500 });
  }
}
