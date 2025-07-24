import { VercelRequest, VercelResponse } from '@vercel/node';
import { bot } from '../src/bot';

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body, res);
    } else {
      res.status(200).json({
        status: 'online',
        service: 'Telegram File2Link Bot',
        version: '1.0'
      });
    }
  } catch (error) {
    console.error('Serverless error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
