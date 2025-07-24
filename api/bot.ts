import { VercelRequest, VercelResponse } from '@vercel/node';
import { bot } from '../src/bot';

// Node version check
if (process.version.startsWith('v22')) {
  console.warn('Warning: Node.js 22.x may cause compatibility issues. Recommended: Node.js 18.x');
}

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body, res);
    } else {
      res.status(200).json({
        status: 'online',
        nodeVersion: process.version,
        recommendedVersion: '18.x',
        service: 'Telegram File2Link Bot',
        version: '1.0'
      });
    }
  } catch (error) {
    console.error('Serverless error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      nodeVersion: process.version,
      recommendation: 'Switch to Node.js 18.x if experiencing issues' 
    });
  }
};
