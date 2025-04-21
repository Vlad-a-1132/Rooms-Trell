import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/util/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  try {
    const { db, client } = await connectToDatabase();

    if (!client.isConnected()) {
      return res.status(500).json({ message: 'DB connection error', status: 500 });
    }

    const { slug, cardId } = req.query;

    // Возвращаем заглушку, если файл используется только для типизации
    res.status(200).json({
      message: 'Card API endpoint',
      cardId,
      boardId: slug
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', status: 500, error: String(error) });
  }
}
