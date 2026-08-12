import prisma from '../config/database';
import { AppError } from '../middleware/errorhandler';
import { CreateTaskInput, UpdateTaskInput, UpdateTaskStatusInput } from '../validators/task.validator';

export class TaskService {

async getAll(userId: string, search?: string, status?: string, priority?: string) {
      return prisma.task.findMany({
where: {
  deletedAt: null,
  createdById: userId,
  ...(status && { status: status as any }),
        ...(priority && { priority: priority as any }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        lead: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        deal: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

async getById(id: string, userId: string) {
      const task = await prisma.task.findFirst({
      where: { id, deletedAt: null, createdById: userId },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        lead: true,
        deal: true,
      },
    });

    if (!task) throw new AppError('Task not found', 404);
    return task;
  }

  async getMyTasks(userId: string) {
    return prisma.task.findMany({
      where: {
        assignedToId: userId,
        deletedAt: null,
      },
      include: {
        lead: {
          select: { id: true, title: true },
        },
        deal: {
          select: { id: true, title: true },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' },
      ],
    });
  }

  async create(data: CreateTaskInput, createdById: string) {
    return prisma.task.create({
      data: {
        ...data,
        createdById,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lead: {
          select: { id: true, title: true },
        },
        deal: {
          select: { id: true, title: true },
        },
      },
    });
  }

async update(id: string, userId: string, data: UpdateTaskInput) {
  await this.getById(id, userId);

    return prisma.task.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
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

async updateStatus(id: string, userId: string, data: UpdateTaskStatusInput) {
  await this.getById(id, userId);

    return prisma.task.update({
      where: { id },
      data: { status: data.status },
    });
  }

  async delete(id: string, userId: string) {
    await this.getById(id, userId);

    return prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const taskService = new TaskService();