import prisma from '../config/database'; // adjust this import to match how you import prisma elsewhere

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL!;
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET!;

export interface ChatContext {
  entityType?: 'DEAL' | 'LEAD' | 'FOLLOW_UP';
  entityId?: string;
  data?: Record<string, any>;
}

export interface PredictionResult {
  entityType: string;
  entityId: string;
  type: string;
  score?: number;
  label?: string;
  reasoning?: string;
}

export interface ChatResponse {
  reply: string;
  predictions: PredictionResult[];
}

export const sendChatMessage = async (
  message: string,
  context: ChatContext,
  userId: string
): Promise<ChatResponse> => {
const response = await fetch(N8N_WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-secret': N8N_WEBHOOK_SECRET,
  },
  body: JSON.stringify({ message, context }),
});

const data = await response.json() as { reply: string; predictions: PredictionResult[] };
const { reply, predictions = [] } = data;

  // Save any returned predictions to DB
  if (predictions.length > 0) {
    await Promise.all(
      predictions.map((p: PredictionResult) =>
        prisma.prediction.upsert({
          where: {
            // upsert based on entityId + type combo
            id: `${p.entityId}_${p.type}`,
          },
          update: {
            score: p.score,
            label: p.label,
            reasoning: p.reasoning,
            updatedAt: new Date(),
          },
          create: {
            id: `${p.entityId}_${p.type}`,
            entityType: p.entityType,
            entityId: p.entityId,
            type: p.type,
            score: p.score,
            label: p.label,
            reasoning: p.reasoning,
            userId,
          },
        })
      )
    );
  }

  return { reply, predictions };
};