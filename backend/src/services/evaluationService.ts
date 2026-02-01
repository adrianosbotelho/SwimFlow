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

export interface TrendAnalysis {
  slope: number;
  direction: 'improving' | 'declining' | 'stable';
  improvement: number; // percentage change from first to last
}

export interface EvolutionTrendData extends EvolutionData {
  trends: {
    technique: TrendAnalysis;
    resistance: TrendAnalysis;
    overall: TrendAnalysis;
  };
  statistics: {
    totalEvaluations: number;
    averageScores: {
      technique: number;
      resistance: number;
      overall: number;
    };
    bestScores: {
      technique: number;
      resistance: number;
      overall: number;
    };
    latestScores: {
      technique: number;
      resistance: number;
      overall: number;
    };
    improvementRate: number; // percentage improvement from first to last
  };
}

export interface ReadinessScore {
  score: number; // 0-100
  level: 'ready' | 'almost_ready' | 'needs_improvement' | 'not_ready';
  factors: string[];
}

export interface ProgressionAnalysis {
  studentId: string;
  currentLevel: Level;
  levelHistory: {
    fromLevel: Level | null;
    toLevel: Level;
    changedAt: Date;
    reason: string;
  }[];
  readinessForNextLevel: ReadinessScore;
  recommendedActions: string[];
  recentProgressionEvaluations: number;
  overallTrend: 'improving' | 'stable' | 'declining';
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

  async getEvolutionTrends(studentId: string, strokeType?: StrokeType, timeRange?: string): Promise<EvolutionTrendData[]> {
    // Calculate date range based on timeRange parameter
    let startDate: Date | undefined;
    const endDate = new Date();
    
    switch (timeRange) {
      case '3months':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6months':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        // 'all' or undefined - no start date filter
        break;
    }

    const where: any = {
      evaluation: {
        studentId,
        ...(startDate && { date: { gte: startDate } })
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

    // Group by stroke type and calculate trends
    const groupedData: { [key: string]: EvolutionTrendData } = {};

    strokeEvaluations.forEach(stroke => {
      const key = stroke.strokeType;
      if (!groupedData[key]) {
        groupedData[key] = {
          studentId,
          strokeType: stroke.strokeType,
          evaluations: [],
          trends: {
            technique: { slope: 0, direction: 'stable', improvement: 0 },
            resistance: { slope: 0, direction: 'stable', improvement: 0 },
            overall: { slope: 0, direction: 'stable', improvement: 0 }
          },
          statistics: {
            totalEvaluations: 0,
            averageScores: { technique: 0, resistance: 0, overall: 0 },
            bestScores: { technique: 0, resistance: 0, overall: 0 },
            latestScores: { technique: 0, resistance: 0, overall: 0 },
            improvementRate: 0
          }
        };
      }

      const evaluationData = {
        date: stroke.evaluation.date,
        technique: stroke.technique,
        timeSeconds: stroke.timeSeconds ? Number(stroke.timeSeconds) : undefined,
        resistance: stroke.resistance
      };

      groupedData[key].evaluations.push(evaluationData);
    });

    // Calculate trends and statistics for each stroke type
    Object.values(groupedData).forEach(strokeData => {
      this.calculateTrends(strokeData);
      this.calculateStatistics(strokeData);
    });

    return Object.values(groupedData);
  }

  private calculateTrends(strokeData: EvolutionTrendData): void {
    const evaluations = strokeData.evaluations;
    if (evaluations.length < 2) {
      return; // Not enough data for trend calculation
    }

    // Calculate linear regression for technique, resistance, and overall scores
    const techniqueSlope = this.calculateLinearRegression(evaluations.map((e, i) => ({ x: i, y: e.technique })));
    const resistanceSlope = this.calculateLinearRegression(evaluations.map((e, i) => ({ x: i, y: e.resistance })));
    const overallSlope = this.calculateLinearRegression(evaluations.map((e, i) => ({ 
      x: i, 
      y: (e.technique + e.resistance) / 2 
    })));

    // Determine trend direction and improvement percentage
    strokeData.trends = {
      technique: this.analyzeTrend(techniqueSlope, evaluations[0].technique, evaluations[evaluations.length - 1].technique),
      resistance: this.analyzeTrend(resistanceSlope, evaluations[0].resistance, evaluations[evaluations.length - 1].resistance),
      overall: this.analyzeTrend(overallSlope, 
        (evaluations[0].technique + evaluations[0].resistance) / 2,
        (evaluations[evaluations.length - 1].technique + evaluations[evaluations.length - 1].resistance) / 2
      )
    };
  }

  private calculateLinearRegression(points: { x: number; y: number }[]): number {
    const n = points.length;
    if (n < 2) return 0;

    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
  }

  private analyzeTrend(slope: number, firstValue: number, lastValue: number): TrendAnalysis {
    const improvement = ((lastValue - firstValue) / firstValue) * 100;
    
    let direction: 'improving' | 'declining' | 'stable';
    if (Math.abs(slope) < 0.1) {
      direction = 'stable';
    } else if (slope > 0) {
      direction = 'improving';
    } else {
      direction = 'declining';
    }

    return {
      slope: Math.round(slope * 100) / 100,
      direction,
      improvement: Math.round(improvement * 100) / 100
    };
  }

  private calculateStatistics(strokeData: EvolutionTrendData): void {
    const evaluations = strokeData.evaluations;
    if (evaluations.length === 0) return;

    const techniques = evaluations.map(e => e.technique);
    const resistances = evaluations.map(e => e.resistance);
    const overalls = evaluations.map(e => (e.technique + e.resistance) / 2);

    const latest = evaluations[evaluations.length - 1];
    const first = evaluations[0];

    strokeData.statistics = {
      totalEvaluations: evaluations.length,
      averageScores: {
        technique: Math.round((techniques.reduce((sum, t) => sum + t, 0) / techniques.length) * 100) / 100,
        resistance: Math.round((resistances.reduce((sum, r) => sum + r, 0) / resistances.length) * 100) / 100,
        overall: Math.round((overalls.reduce((sum, o) => sum + o, 0) / overalls.length) * 100) / 100
      },
      bestScores: {
        technique: Math.max(...techniques),
        resistance: Math.max(...resistances),
        overall: Math.round(Math.max(...overalls) * 100) / 100
      },
      latestScores: {
        technique: latest.technique,
        resistance: latest.resistance,
        overall: Math.round(((latest.technique + latest.resistance) / 2) * 100) / 100
      },
      improvementRate: evaluations.length > 1 ? 
        Math.round((((latest.technique + latest.resistance) / 2 - (first.technique + first.resistance) / 2) / 
        ((first.technique + first.resistance) / 2)) * 10000) / 100 : 0
    };
  }

  async getProgressionAnalysis(studentId: string): Promise<ProgressionAnalysis> {
    // Get student's current level and level history
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        levelHistory: {
          orderBy: { changedAt: 'desc' }
        }
      }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Get all evaluations for trend analysis
    const evolutionTrends = await this.getEvolutionTrends(studentId);

    // Calculate readiness for next level
    const readinessScore = this.calculateLevelReadiness(student.level, evolutionTrends);

    // Get recent level progression evaluations
    const levelProgressionEvaluations = await prisma.evaluation.findMany({
      where: {
        studentId,
        evaluationType: 'LEVEL_PROGRESSION'
      },
      include: {
        strokeEvaluations: true
      },
      orderBy: { date: 'desc' },
      take: 5
    });

    return {
      studentId,
      currentLevel: student.level,
      levelHistory: student.levelHistory.map(lh => ({
        fromLevel: lh.fromLevel,
        toLevel: lh.toLevel,
        changedAt: lh.changedAt,
        reason: lh.reason || ''
      })),
      readinessForNextLevel: readinessScore,
      recommendedActions: this.generateRecommendations(student.level, evolutionTrends, readinessScore),
      recentProgressionEvaluations: levelProgressionEvaluations.length,
      overallTrend: this.calculateOverallTrend(evolutionTrends)
    };
  }

  private calculateLevelReadiness(currentLevel: Level, evolutionTrends: EvolutionTrendData[]): ReadinessScore {
    if (evolutionTrends.length === 0) {
      return { score: 0, level: 'not_ready', factors: ['Nenhuma avaliação disponível'] };
    }

    // Define minimum scores required for each level
    const levelRequirements = {
      'iniciante': { technique: 4, resistance: 4, overall: 4 },
      'intermediario': { technique: 6, resistance: 6, overall: 6 },
      'avancado': { technique: 8, resistance: 8, overall: 8 }
    };

    const nextLevelRequirements = currentLevel === 'iniciante' ? levelRequirements.intermediario :
                                 currentLevel === 'intermediario' ? levelRequirements.avancado : null;

    if (!nextLevelRequirements) {
      return { score: 100, level: 'ready', factors: ['Já está no nível máximo'] };
    }

    let totalScore = 0;
    let strokeCount = 0;
    const factors: string[] = [];

    evolutionTrends.forEach(trend => {
      if (trend.statistics.totalEvaluations > 0) {
        strokeCount++;
        const latest = trend.statistics.latestScores;
        
        // Check if meets requirements for next level
        const techniqueReady = latest.technique >= nextLevelRequirements.technique;
        const resistanceReady = latest.resistance >= nextLevelRequirements.resistance;
        const overallReady = latest.overall >= nextLevelRequirements.overall;
        
        let strokeScore = 0;
        if (techniqueReady) strokeScore += 33;
        if (resistanceReady) strokeScore += 33;
        if (overallReady) strokeScore += 34;
        
        // Bonus for improving trend
        if (trend.trends.overall.direction === 'improving') {
          strokeScore += 10;
        }
        
        totalScore += Math.min(strokeScore, 100);
        
        // Add specific feedback
        if (!techniqueReady) {
          factors.push(`${trend.strokeType}: Técnica precisa melhorar (${latest.technique}/${nextLevelRequirements.technique})`);
        }
        if (!resistanceReady) {
          factors.push(`${trend.strokeType}: Resistência precisa melhorar (${latest.resistance}/${nextLevelRequirements.resistance})`);
        }
        if (trend.trends.overall.direction === 'improving') {
          factors.push(`${trend.strokeType}: Tendência de melhoria positiva`);
        }
      }
    });

    const averageScore = strokeCount > 0 ? totalScore / strokeCount : 0;
    
    let level: 'ready' | 'almost_ready' | 'needs_improvement' | 'not_ready';
    if (averageScore >= 80) level = 'ready';
    else if (averageScore >= 60) level = 'almost_ready';
    else if (averageScore >= 40) level = 'needs_improvement';
    else level = 'not_ready';

    return {
      score: Math.round(averageScore),
      level,
      factors: factors.length > 0 ? factors : ['Análise baseada nas avaliações recentes']
    };
  }

  private generateRecommendations(currentLevel: Level, evolutionTrends: EvolutionTrendData[], readiness: ReadinessScore): string[] {
    const recommendations: string[] = [];

    if (readiness.level === 'ready') {
      recommendations.push('Aluno pronto para avaliação de progressão de nível');
    } else if (readiness.level === 'almost_ready') {
      recommendations.push('Aluno quase pronto - continue com treinos focados');
    }

    // Analyze each stroke for specific recommendations
    evolutionTrends.forEach(trend => {
      if (trend.trends.technique.direction === 'declining') {
        recommendations.push(`${trend.strokeType}: Focar em exercícios de técnica`);
      }
      if (trend.trends.resistance.direction === 'declining') {
        recommendations.push(`${trend.strokeType}: Aumentar exercícios de resistência`);
      }
      if (trend.statistics.latestScores.technique < 5) {
        recommendations.push(`${trend.strokeType}: Técnica precisa de atenção especial`);
      }
      if (trend.statistics.latestScores.resistance < 5) {
        recommendations.push(`${trend.strokeType}: Trabalhar condicionamento físico`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Continue com o programa de treinos atual');
    }

    return recommendations;
  }

  private calculateOverallTrend(evolutionTrends: EvolutionTrendData[]): 'improving' | 'stable' | 'declining' {
    if (evolutionTrends.length === 0) return 'stable';

    const improvingCount = evolutionTrends.filter(t => t.trends.overall.direction === 'improving').length;
    const decliningCount = evolutionTrends.filter(t => t.trends.overall.direction === 'declining').length;

    if (improvingCount > decliningCount) return 'improving';
    if (decliningCount > improvingCount) return 'declining';
    return 'stable';
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