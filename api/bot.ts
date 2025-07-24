import { VercelRequest, VercelResponse } from '@vercel/node';
import { bot } from '../src/bot';

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body, res);
    } else {
      res.status(200).json({ status: 'online', max_size: '4GB' });
    }
  } catch (error) {
    console.error('Endpoint error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
