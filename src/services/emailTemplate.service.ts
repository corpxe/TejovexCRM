import prisma from '../config/database';

export const EmailTemplateService = {

  async create(data: any, userId: string) {
    return await prisma.emailTemplate.create({
      data: {
        name: data.name,
        stage: data.stage,
        subject: data.subject,
        body: data.body,
        isActive: data.isActive ?? true,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  },

  async getAll(userId: string, stage?: string) {
    const where: any = { deletedAt: null, createdById: userId };
    if (stage) where.stage = stage;

    return await prisma.emailTemplate.findMany({
      where,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ stage: 'asc' }, { name: 'asc' }],
    });
  },

  async getByStage(stage: string, userId: string) {
    return await prisma.emailTemplate.findMany({
      where: { stage: stage as any, isActive: true, deletedAt: null, createdById: userId },
      orderBy: { name: 'asc' },
    });
  },

  async getById(id: string, userId: string) {
    return await prisma.emailTemplate.findFirst({
      where: { id, deletedAt: null, createdById: userId },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  },

async update(id: string, userId: string, data: any) {
  const existing = await this.getById(id, userId);
  if (!existing) throw new Error('Template not found or unauthorized');
  const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.stage !== undefined) updateData.stage = data.stage;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.body !== undefined) updateData.body = data.body;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return await prisma.emailTemplate.update({
      where: { id },
      data: updateData,
    });
  },

async delete(id: string, userId: string) {
  return await prisma.emailTemplate.update({
    where: { id, createdById: userId },
      data: { deletedAt: new Date() },
    });
  },
};