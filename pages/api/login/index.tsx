import type { NextApiRequest, NextApiResponse } from 'next';

import { connectToDatabase } from '@/util/mongodb';
import { compare } from 'bcrypt';
import { serialize } from 'cookie';

import { sign } from 'jsonwebtoken';

const KEY = process.env.JWT_SECRET_KEY;

const isUserExists = async (db, email) => {
  const user = await db.collection('users').findOne({ email: email });

  if (user) {
    return user;
  }

  return null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method === 'POST') {
    const { email, password } = req.body;

    // Check any field is empty
    if (!email || !password) {
      return res.status(400).json({ error: 'email or password is missing' });
    }

    try {
      const { db, client } = await connectToDatabase();

      if (!client.isConnected()) {
        return res.status(500).json({ error: 'Database connection failed' });
      }

      const userDetail = await isUserExists(db, email);

      if (!userDetail) {
        return res.status(404).json({ error: 'Invalid username or password' });
      }

      const isMatched = await compare(password, userDetail.password);

      if (isMatched) {
        const claim = { id: userDetail._id, email: userDetail.email };
        const token = sign({ user: claim }, KEY, { expiresIn: '1h' });

        res.setHeader(
          'Set-Cookie',
          serialize('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            maxAge: 60 * 60 * 24 * 1000,
            sameSite: 'strict',
            path: '/'
          })
        );

        return res.status(200).json({ message: 'success', token, id: userDetail._id });
      } else {
        return res.status(404).json({ error: 'Invalid username or password' });
      }
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
