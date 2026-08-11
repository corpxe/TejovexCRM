import prisma from '../config/database';
import { AppError } from '../middleware/errorhandler';
import {
  CreateDealInput,
  UpdateDealInput,
  UpdateDealStatusInput,
  CreatePipelineStageInput,
} from '../validators/deal.validator';

export class DealService {

  // ─── Pipeline Stages ───────────────────────

  async getAllStages() {
    return prisma.pipelineStage.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { deals: true } },
      },
    });
  }

  async createStage(data: CreatePipelineStageInput) {
    return prisma.pipelineStage.create({ data });
  }

  async deleteStage(id: string) {
    const stage = await prisma.pipelineStage.findUnique({ where: { id } });
    if (!stage) throw new AppError('Stage not found', 404);

    return prisma.pipelineStage.delete({ where: { id } });
  }

  // ─── Deals ─────────────────────────────────

async getAll(userId: string, search?: string, status?: string, stageId?: string) { 
     return prisma.deal.findMany({
where: {
  deletedAt: null,
  createdById: userId,
  ...(status && { status: status as any }),
        ...(stageId && { stageId }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        stage: true,
        contact: true,
        company: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            notes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string, userId: string) {
    const deal = await prisma.deal.findFirst({
      where: { id, deletedAt: null, createdById: userId },
      include: {
        stage: true,
        contact: true,
        company: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        tasks: {
          where: { deletedAt: null },
        },
        notes: true,
      },
    });

    if (!deal) throw new AppError('Deal not found', 404);
    return deal;
  }

  async create(data: CreateDealInput, userId: string) {
    const stage = await prisma.pipelineStage.findUnique({
      where: { id: data.stageId },
    });
    if (!stage) throw new AppError('Pipeline stage not found', 404);

return prisma.deal.create({
  data: {
    ...data,
    createdById: userId,
    expectedCloseDate: data.expectedCloseDate
      ? new Date(data.expectedCloseDate)
      : undefined,
  },
      include: {
        stage: true,
        contact: true,
        company: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async update(id: string, userId: string, data: UpdateDealInput) {
    await this.getById(id, userId);

    return prisma.deal.update({
      where: { id },
      data: {
        ...data,
        expectedCloseDate: data.expectedCloseDate
          ? new Date(data.expectedCloseDate)
          : undefined,
      },
      include: {
        stage: true,
        contact: true,
        company: true,
      },
    });
  }

async updateStatus(id: string, userId: string, data: UpdateDealStatusInput) {
  await this.getById(id, userId);

    return prisma.deal.update({
      where: { id },
      data: { status: data.status },
    });
  }

async moveStage(id: string, userId: string, stageId: string) {
  await this.getById(id, userId);

    const stage = await prisma.pipelineStage.findUnique({
      where: { id: stageId },
    });
    if (!stage) throw new AppError('Pipeline stage not found', 404);

    return prisma.deal.update({
      where: { id },
      data: { stageId },
      include: { stage: true },
    });
  }

async delete(id: string, userId: string) {
  await this.getById(id, userId);

    return prisma.deal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const dealService = new DealService();