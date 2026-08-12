import prisma from '../config/database'; // same import as above

export const getAllPredictions = async (userId: string) => {
  return prisma.prediction.findMany({
    where: { userId, deletedAt: undefined },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
};

export const getPredictionsByEntity = async (
  entityType: string,
  entityId: string,
  userId: string
) => {
  return prisma.prediction.findMany({
    where: { entityType, entityId, userId },
    orderBy: { createdAt: 'desc' },
  });
};