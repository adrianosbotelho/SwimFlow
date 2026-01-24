import { PrismaClient, Evaluation, StrokeEvaluation, StrokeType } from '@prisma/client';
import Joi from 'joi';

const prisma = new PrismaClient();

// Validation schemas
const strokeEvaluationSchema = Joi.object({
  strokeType: Joi.string().valid('crawl', 'costas', 'peito', 'borboleta').required(),
  technique: Joi.number().integer().min(1).max(10).required(),
  timeSeconds: Joi.number().positive().optional(),
  resistance: Joi.number().integer().min(1).max(10).required(),
  notes: Joi.string().max(500).optional()
});

const createEvaluationSchema = Joi.object({
  studentId: Joi.string().uuid().required(),
  professorId: Joi.string().uuid().required(),
  date: Joi.date().max('now').required(),
  strokeEvaluations: Joi.array().items(strokeEvaluationSchema).min(1).required(),
  generalNotes: Joi.string().max(1000).optional()
});

const updateEvaluationSchema = Joi.object({
  date: Joi.date().max('now').optional(),
  strokeEvaluations: Joi.array().items(strokeEvaluationSchema).min(1).optional(),
  generalNotes: Joi.string().max(1000).optional()
});

// Types
export interface CreateEvaluationData {
  studentId: string;
  professorId: string;
  date: Date;
  strokeEvaluations: {
    strokeType: StrokeType;
    technique: number;
    timeSeconds?: number;
    resistance: number;
    notes?: string;
  }[];
  generalNotes?: string;
}

export interface UpdateEvaluationData {
  date?: Date;
  strokeEvaluations?: {
    strokeType: StrokeType;
    technique: number;
    timeSeconds?: number;
    resistance: number;
    notes?: string;
  }[];
  generalNotes?: string;
}

export interface EvaluationWithStrokes extends Evaluation {
  strokeEvaluations: StrokeEvaluation[];
  student: {
    id: string;
    name: string;
    level: string;
  };
  professor: {
    id: string;
    name: string;
  };
}

export interface EvolutionData {
  studentId: string;
  strokeType: StrokeType;
  evaluations: {
    date: Date;
    technique: number;
    timeSeconds?: number;
    resistance: number;
  }[];
}

class EvaluationService {
  async createEvaluation(data: CreateEvaluationData): Promise<EvaluationWithStrokes> {
    // Validate input data
    const { error } = createEvaluationSchema.validate(data);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: data.studentId }
    });
    if (!student) {
      throw new Error('Student not found');
    }

    // Verify professor exists
    const professor = await prisma.user.findUnique({
      where: { id: data.professorId }
    });
    if (!professor) {
      throw new Error('Professor not found');
    }

    // Create evaluation with stroke evaluations in a transaction
    const evaluation = await prisma.$transaction(async (tx) => {
      // Create the evaluation
      const newEvaluation = await tx.evaluation.create({
        data: {
          studentId: data.studentId,
          professorId: data.professorId,
          date: data.date,
          generalNotes: data.generalNotes,
          strokeEvaluations: {
            create: data.strokeEvaluations
          }
        },
        include: {
          strokeEvaluations: true,
          student: {
            select: {
              id: true,
              name: true,
              level: true
            }
          },
          professor: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Update student's last evaluation date
      await tx.student.update({
        where: { id: data.studentId },
        data: { lastEvaluationDate: data.date }
      });

      return newEvaluation;
    });

    return evaluation;
  }

  async getEvaluation(id: string): Promise<EvaluationWithStrokes | null> {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: {
        strokeEvaluations: true,
        student: {
          select: {
            id: true,
            name: true,
            level: true
          }
        },
        professor: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return evaluation;
  }

  async listEvaluations(studentId?: string, professorId?: string): Promise<EvaluationWithStrokes[]> {
    const where: any = {};
    
    if (studentId) {
      where.studentId = studentId;
    }
    
    if (professorId) {
      where.professorId = professorId;
    }

    const evaluations = await prisma.evaluation.findMany({
      where,
      include: {
        strokeEvaluations: true,
        student: {
          select: {
            id: true,
            name: true,
            level: true
          }
        },
        professor: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return evaluations;
  }

  async updateEvaluation(id: string, data: UpdateEvaluationData): Promise<EvaluationWithStrokes> {
    // Validate input data
    const { error } = updateEvaluationSchema.validate(data);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    // Check if evaluation exists
    const existingEvaluation = await prisma.evaluation.findUnique({
      where: { id }
    });
    if (!existingEvaluation) {
      throw new Error('Evaluation not found');
    }

    // Update evaluation in a transaction
    const evaluation = await prisma.$transaction(async (tx) => {
      // If stroke evaluations are being updated, delete existing ones first
      if (data.strokeEvaluations) {
        await tx.strokeEvaluation.deleteMany({
          where: { evaluationId: id }
        });
      }

      // Update the evaluation
      const updatedEvaluation = await tx.evaluation.update({
        where: { id },
        data: {
          date: data.date,
          generalNotes: data.generalNotes,
          ...(data.strokeEvaluations && {
            strokeEvaluations: {
              create: data.strokeEvaluations
            }
          })
        },
        include: {
          strokeEvaluations: true,
          student: {
            select: {
              id: true,
              name: true,
              level: true
            }
          },
          professor: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Update student's last evaluation date if date changed
      if (data.date) {
        await tx.student.update({
          where: { id: existingEvaluation.studentId },
          data: { lastEvaluationDate: data.date }
        });
      }

      return updatedEvaluation;
    });

    return evaluation;
  }

  async deleteEvaluation(id: string): Promise<void> {
    // Check if evaluation exists
    const existingEvaluation = await prisma.evaluation.findUnique({
      where: { id }
    });
    if (!existingEvaluation) {
      throw new Error('Evaluation not found');
    }

    await prisma.$transaction(async (tx) => {
      // Delete the evaluation (stroke evaluations will be deleted by cascade)
      await tx.evaluation.delete({
        where: { id }
      });

      // Update student's last evaluation date to the most recent remaining evaluation
      const lastEvaluation = await tx.evaluation.findFirst({
        where: { studentId: existingEvaluation.studentId },
        orderBy: { date: 'desc' }
      });

      await tx.student.update({
        where: { id: existingEvaluation.studentId },
        data: { 
          lastEvaluationDate: lastEvaluation?.date || null 
        }
      });
    });
  }

  async getEvolutionData(studentId: string, strokeType?: StrokeType): Promise<EvolutionData[]> {
    const where: any = {
      evaluation: {
        studentId
      }
    };

    if (strokeType) {
      where.strokeType = strokeType;
    }

    const strokeEvaluations = await prisma.strokeEvaluation.findMany({
      where,
      include: {
        evaluation: {
          select: {
            date: true
          }
        }
      },
      orderBy: {
        evaluation: {
          date: 'asc'
        }
      }
    });

    // Group by stroke type
    const groupedData: { [key: string]: EvolutionData } = {};

    strokeEvaluations.forEach(stroke => {
      const key = stroke.strokeType;
      if (!groupedData[key]) {
        groupedData[key] = {
          studentId,
          strokeType: stroke.strokeType,
          evaluations: []
        };
      }

      groupedData[key].evaluations.push({
        date: stroke.evaluation.date,
        technique: stroke.technique,
        timeSeconds: stroke.timeSeconds ? Number(stroke.timeSeconds) : undefined,
        resistance: stroke.resistance
      });
    });

    return Object.values(groupedData);
  }

  async getStudentEvaluationStats(studentId: string) {
    const evaluations = await prisma.evaluation.findMany({
      where: { studentId },
      include: {
        strokeEvaluations: true
      },
      orderBy: { date: 'desc' }
    });

    const totalEvaluations = evaluations.length;
    const lastEvaluation = evaluations[0];
    
    // Calculate average scores by stroke type
    const strokeStats: { [key: string]: { technique: number; resistance: number; count: number } } = {};
    
    evaluations.forEach(evaluation => {
      evaluation.strokeEvaluations.forEach(stroke => {
        const key = stroke.strokeType;
        if (!strokeStats[key]) {
          strokeStats[key] = { technique: 0, resistance: 0, count: 0 };
        }
        strokeStats[key].technique += stroke.technique;
        strokeStats[key].resistance += stroke.resistance;
        strokeStats[key].count += 1;
      });
    });

    // Calculate averages
    const averageScores = Object.entries(strokeStats).reduce((acc, [strokeType, stats]) => {
      acc[strokeType] = {
        technique: Math.round((stats.technique / stats.count) * 10) / 10,
        resistance: Math.round((stats.resistance / stats.count) * 10) / 10
      };
      return acc;
    }, {} as { [key: string]: { technique: number; resistance: number } });

    return {
      totalEvaluations,
      lastEvaluationDate: lastEvaluation?.date,
      averageScores
    };
  }
}

export default new EvaluationService();