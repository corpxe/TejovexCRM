import { Request, Response } from 'express';
import { sendChatMessage } from '../services/chat.service';

export const handleChat = async (req: Request, res: Response) => {
  try {
    const { message, context } = req.body;
    const userId = (req as any).user?.id;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const result = await sendChatMessage(message, context || {}, userId);

    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    console.error('Chat error:', error.message);
    return res.status(500).json({ success: false, error: 'Chat failed' });
  }
};