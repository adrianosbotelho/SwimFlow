import { PrismaClient, Training } from '@prisma/client';
import Joi from 'joi';

const prisma = new PrismaClient();

// Validation schemas
export const createTrainingSchema = Joi.object({
  classId: Joi.string().uuid().required(),
  date: Joi.date().required(),
  duration: Joi.number().integer().min(1).max(480).required(), // 1 minute to 8 hours
  activities: Joi.array().items(Joi.string().min(1).max(500)).min(1).required(),
  notes: Joi.string().max(2000).optional().allow(''),
  participantIds: Joi.array().items(Joi.string().uuid()).min(1).required()
});

export const updateTrainingSchema = Joi.object({
  date: Joi.date().optional(),
  duration: Joi.number().integer().min(1).max(480).optional(),
  activities: Joi.array().items(Joi.string().min(1).max(500)).min(1).optional(),
  notes: Joi.string().max(2000).optional().allow(''),
  participantIds: Joi.array().items(Joi.string().uuid()).min(1).optional()
});

export interface CreateTrainingData {
  classId: string;
  date: Date;
  duration: number;
  activities: string[];
  notes?: string;
  participantIds: string[];
}

export interface UpdateTrainingData {
  date?: Date;
  duration?: number;
  activities?: string[];
  notes?: string;
  participantIds?: string[];
}

export interface TrainingWithParticipants extends Training {
  participants: Array<{
    student: {
      id: string;
      name: string;
      level: string;
      profileImage?: string;
    };
  }>;
  class: {
    id: string;
    name: string;
    pool: {
      id: string;
      name: string;
    };
  };
}

export interface TrainingFilters {
  classId?: string;
  professorId?: string;
  studentId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

class TrainingService {
  async createTraining(data: CreateTrainingData): Promise<TrainingWithParticipants> {
    // Validate input data
    const { error } = createTrainingSchema.validate(data);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    // Verify class exists
    const classExists = await prisma.class.findUnique({
      where: { id: data.classId }
    });
    if (!classExists) {
      throw new Error('Class not found');
    }

    // Verify all participants are students enrolled in the class
    const enrolledStudents = await prisma.classStudent.findMany({
      where: {
        classId: data.classId,
        studentId: { in: data.participantIds }
      }
    });

    if (enrolledStudents.length !== data.participantIds.length) {
      throw new Error('Some participants are not enrolled in this class');
    }

    // Create training with participants in a transaction
    const training = await prisma.$transaction(async (tx) => {
      // Create the training
      const newTraining = await tx.training.create({
        data: {
          classId: data.classId,
          date: data.date,
          duration: data.duration,
          activities: data.activities,
          notes: data.notes || null
        }
      });

      // Create participant relationships
      await tx.trainingParticipant.createMany({
        data: data.participantIds.map(studentId => ({
          trainingId: newTraining.id,
          studentId
        }))
      });

      // Return training with full details
      return await tx.training.findUnique({
        where: { id: newTraining.id },
        include: {
          participants: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  level: true,
                  profileImage: true
                }
              }
            }
          },
          class: {
            include: {
              pool: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });
    });

    if (!training) {
      throw new Error('Failed to create training');
    }

    return training as TrainingWithParticipants;
  }

  async getTraining(id: string): Promise<TrainingWithParticipants | null> {
    const training = await prisma.training.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                level: true,
                profileImage: true
              }
            }
          }
        },
        class: {
          include: {
            pool: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    return training as TrainingWithParticipants | null;
  }

  async updateTraining(id: string, data: UpdateTrainingData): Promise<TrainingWithParticipants> {
    // Validate input data
    const { error } = updateTrainingSchema.validate(data);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    // Verify training exists
    const existingTraining = await prisma.training.findUnique({
      where: { id },
      include: { class: true }
    });
    if (!existingTraining) {
      throw new Error('Training not found');
    }

    // If updating participants, verify they are enrolled in the class
    if (data.participantIds) {
      const enrolledStudents = await prisma.classStudent.findMany({
        where: {
          classId: existingTraining.classId,
          studentId: { in: data.participantIds }
        }
      });

      if (enrolledStudents.length !== data.participantIds.length) {
        throw new Error('Some participants are not enrolled in this class');
      }
    }

    // Update training in a transaction
    const training = await prisma.$transaction(async (tx) => {
      // Update training data
      const updatedTraining = await tx.training.update({
        where: { id },
        data: {
          ...(data.date && { date: data.date }),
          ...(data.duration && { duration: data.duration }),
          ...(data.activities && { activities: data.activities }),
          ...(data.notes !== undefined && { notes: data.notes || null })
        }
      });

      // Update participants if provided
      if (data.participantIds) {
        // Remove existing participants
        await tx.trainingParticipant.deleteMany({
          where: { trainingId: id }
        });

        // Add new participants
        await tx.trainingParticipant.createMany({
          data: data.participantIds.map(studentId => ({
            trainingId: id,
            studentId
          }))
        });
      }

      // Return updated training with full details
      return await tx.training.findUnique({
        where: { id },
        include: {
          participants: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  level: true,
                  profileImage: true
                }
              }
            }
          },
          class: {
            include: {
              pool: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });
    });

    if (!training) {
      throw new Error('Failed to update training');
    }

    return training as TrainingWithParticipants;
  }

  async deleteTraining(id: string): Promise<void> {
    const existingTraining = await prisma.training.findUnique({
      where: { id }
    });
    if (!existingTraining) {
      throw new Error('Training not found');
    }

    await prisma.training.delete({
      where: { id }
    });
  }

  async listTrainings(filters: TrainingFilters = {}): Promise<TrainingWithParticipants[]> {
    const {
      classId,
      professorId,
      studentId,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = filters;

    const whereClause: any = {};

    if (classId) {
      whereClause.classId = classId;
    }

    if (professorId) {
      whereClause.class = {
        schedules: {
          some: {
            professorId
          }
        }
      };
    }

    if (studentId) {
      whereClause.participants = {
        some: {
          studentId
        }
      };
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = startDate;
      }
      if (endDate) {
        whereClause.date.lte = endDate;
      }
    }

    const trainings = await prisma.training.findMany({
      where: whereClause,
      include: {
        participants: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                level: true,
                profileImage: true
              }
            }
          }
        },
        class: {
          include: {
            pool: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: limit,
      skip: offset
    });

    return trainings as TrainingWithParticipants[];
  }

  async getTrainingsByClass(classId: string): Promise<TrainingWithParticipants[]> {
    return this.listTrainings({ classId });
  }

  async getTrainingsByStudent(studentId: string): Promise<TrainingWithParticipants[]> {
    return this.listTrainings({ studentId });
  }

  async getTrainingsByProfessor(professorId: string): Promise<TrainingWithParticipants[]> {
    return this.listTrainings({ professorId });
  }
}

export default new TrainingService();