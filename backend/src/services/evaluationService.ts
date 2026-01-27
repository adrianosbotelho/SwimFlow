import { PrismaClient, Evaluation, StrokeEvaluation, StrokeType, EvaluationType, Level } from '@prisma/client';
import Joi from 'joi';
import { StudentService } from './studentService';

const prisma = new PrismaClient();

// Validation schemas
const strokeEvaluationSchema = Joi.object({
  strokeType: Joi.string().valid('crawl', 'costas', 'peito', 'borboleta').required(),
  technique: Joi.number().integer().min(1).max(10).required(),
  timeSeconds: Joi.number().positive().optional(),
  resistance: Joi.number().integer().min(1).max(10).required(),
  notes: Joi.string().max(500).optional().allow('', null)
});

const createEvaluationSchema = Joi.object({
  studentId: Joi.string().uuid().required(),
  professorId: Joi.string().uuid().required(),
  date: Joi.date().required(),
  evaluationType: Joi.string().valid('REGULAR', 'LEVEL_PROGRESSION').default('REGULAR'),
  targetLevel: Joi.string().valid('iniciante', 'intermediario', 'avancado').optional(),
  isApproved: Joi.boolean().optional().allow(null),
  approvalNotes: Joi.string().max(1000).optional().allow('', null),
  strokeEvaluations: Joi.array().items(strokeEvaluationSchema).min(1).required(),
  generalNotes: Joi.string().max(1000).optional().allow('', null)
});

const updateEvaluationSchema = Joi.object({
  date: Joi.date().optional(),
  evaluationType: Joi.string().valid('REGULAR', 'LEVEL_PROGRESSION').optional(),
  targetLevel: Joi.string().valid('iniciante', 'intermediario', 'avancado').optional(),
  isApproved: Joi.boolean().optional().allow(null),
  approvalNotes: Joi.string().max(1000).optional().allow('', null),
  strokeEvaluations: Joi.array().items(strokeEvaluationSchema).min(1).optional(),
  generalNotes: Joi.string().max(1000).optional().allow('', null)
});

// Types
export interface CreateEvaluationData {
  studentId: string;
  professorId: string;
  date: Date;
  evaluationType?: EvaluationType;
  targetLevel?: Level;
  isApproved?: boolean | null;
  approvalNotes?: string;
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
  evaluationType?: EvaluationType;
  targetLevel?: Level;
  isApproved?: boolean | null;
  approvalNotes?: string;
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

    // Validate level progression logic
    if (data.evaluationType === 'LEVEL_PROGRESSION') {
      if (!data.targetLevel) {
        throw new Error('Target level is required for level progression evaluations');
      }
      
      // Ensure target level is different from current level
      if (data.targetLevel === student.level) {
        throw new Error('Target level must be different from current level');
      }
      
      // Validate level progression order (can only go up one level at a time)
      const levelOrder = { 'iniciante': 1, 'intermediario': 2, 'avancado': 3 };
      const currentOrder = levelOrder[student.level];
      const targetOrder = levelOrder[data.targetLevel];
      
      if (targetOrder !== currentOrder + 1 && targetOrder !== currentOrder - 1) {
        throw new Error('Can only progress one level up or down at a time');
      }
    }

    // Create evaluation with stroke evaluations in a transaction
    const evaluation = await prisma.$transaction(async (tx) => {
      // Create the evaluation
      const newEvaluation = await tx.evaluation.create({
        data: {
          studentId: data.studentId,
          professorId: data.professorId,
          date: data.date,
          evaluationType: data.evaluationType || 'REGULAR',
          targetLevel: data.targetLevel,
          isApproved: data.isApproved,
          approvalNotes: data.approvalNotes,
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

      // Handle level progression if approved
      if (data.evaluationType === 'LEVEL_PROGRESSION' && 
          data.isApproved === true && 
          data.targetLevel && 
          data.targetLevel !== student.level) {
        
        // Update student level
        await tx.student.update({
          where: { id: data.studentId },
          data: { level: data.targetLevel }
        });

        // Create level history record
        await tx.levelHistory.create({
          data: {
            studentId: data.studentId,
            fromLevel: student.level,
            toLevel: data.targetLevel,
            reason: `Level progression evaluation - ${data.approvalNotes || 'Approved for next level'}`,
            changedBy: data.professorId
          }
        });
      }

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

  async listEvaluations(studentId?: string, professorId?: string, startDate?: string, endDate?: string): Promise<EvaluationWithStrokes[]> {
    const where: any = {};
    
    if (studentId) {
      where.studentId = studentId;
    }
    
    if (professorId) {
      where.professorId = professorId;
    }

    // Add date filters
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to include the end date
        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);
        where.date.lt = endDateTime;
      }
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
      where: { id },
      include: {
        student: true
      }
    });
    if (!existingEvaluation) {
      throw new Error('Evaluation not found');
    }

    // Validate level progression logic if being updated
    if (data.evaluationType === 'LEVEL_PROGRESSION' || existingEvaluation.evaluationType === 'LEVEL_PROGRESSION') {
      const targetLevel = data.targetLevel || existingEvaluation.targetLevel;
      if (!targetLevel) {
        throw new Error('Target level is required for level progression evaluations');
      }
      
      // Ensure target level is different from current level
      if (targetLevel === existingEvaluation.student.level) {
        throw new Error('Target level must be different from current level');
      }
    }

    // Update evaluation in a transaction
    const evaluation = await prisma.$transaction(async (tx) => {
      // Check if approval status is changing from null/false to true for level progression
      const wasNotApproved = existingEvaluation.isApproved !== true;
      const willBeApproved = data.isApproved === true;
      const isLevelProgression = (data.evaluationType || existingEvaluation.evaluationType) === 'LEVEL_PROGRESSION';
      const targetLevel = data.targetLevel || existingEvaluation.targetLevel;

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
          evaluationType: data.evaluationType,
          targetLevel: data.targetLevel,
          isApproved: data.isApproved,
          approvalNotes: data.approvalNotes,
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

      // Handle level progression if approval status changed to approved
      if (isLevelProgression && 
          wasNotApproved && 
          willBeApproved && 
          targetLevel && 
          targetLevel !== existingEvaluation.student.level) {
        
        // Update student level
        await tx.student.update({
          where: { id: existingEvaluation.studentId },
          data: { level: targetLevel }
        });

        // Create level history record
        await tx.levelHistory.create({
          data: {
            studentId: existingEvaluation.studentId,
            fromLevel: existingEvaluation.student.level,
            toLevel: targetLevel,
            reason: `Level progression evaluation updated - ${data.approvalNotes || existingEvaluation.approvalNotes || 'Approved for next level'}`,
            changedBy: existingEvaluation.professorId
          }
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

  async getStudentEvaluationStats(studentId: string, startDate?: string, endDate?: string) {
    const where: any = { studentId };

    // Add date filters
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to include the end date
        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);
        where.date.lt = endDateTime;
      }
    }

    const evaluations = await prisma.evaluation.findMany({
      where,
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