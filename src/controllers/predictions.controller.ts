import { Request, Response } from 'express';
import { getAllPredictions, getPredictionsByEntity } from '../services/predictions.service';

export const listPredictions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const predictions = await getAllPredictions(userId);
    return res.status(200).json({ success: true, data: predictions });
  } catch (error: any) {
    console.error('Predictions error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch predictions' });
  }
};

export const getPredictions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const entityType = req.params.entityType as string;
const entityId = req.params.entityId as string;
    const predictions = await getPredictionsByEntity(entityType, entityId, userId);
    return res.status(200).json({ success: true, data: predictions });
  } catch (error: any) {
    console.error('Predictions error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch predictions' });
  }
};