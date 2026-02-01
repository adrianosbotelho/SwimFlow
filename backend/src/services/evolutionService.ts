import { PrismaClient, StrokeType, Level } from '@prisma/client';

const prisma = new PrismaClient();

export interface EvolutionMetrics {
  studentId: string;
  strokeType: StrokeType;
  timeRange: string;
  dataPoints: EvolutionDataPoint[];
  trends: TrendMetrics;
  predictions: PredictionMetrics;
  milestones: Milestone[];
}

export interface EvolutionDataPoint {
  date: Date;
  technique: number;
  resistance: number;
  overall: number;
  timeSeconds?: number;
  evaluationId: string;
}

export interface TrendMetrics {
  technique: {
    slope: number;
    correlation: number;
    direction: 'improving' | 'declining' | 'stable';
    confidence: number;
  };
  resistance: {
    slope: number;
    correlation: number;
    direction: 'improving' | 'declining' | 'stable';
    confidence: number;
  };
  overall: {
    slope: number;
    correlation: number;
    direction: 'improving' | 'declining' | 'stable';
    confidence: number;
  };
}

export interface PredictionMetrics {
  nextEvaluationPrediction: {
    technique: number;
    resistance: number;
    overall: number;
    confidence: number;
  };
  timeToNextLevel: {
    estimatedDays: number | null;
    confidence: number;
    requiredImprovement: number;
  };
}

export interface Milestone {
  date: Date;
  type: 'improvement' | 'decline' | 'plateau' | 'breakthrough';
  description: string;
  impact: 'high' | 'medium' | 'low';
  strokeType: StrokeType;
}

export interface ComparisonMetrics {
  studentId: string;
  level: Level;
  strokeType: StrokeType;
  studentAverage: number;
  levelAverage: number;
  percentile: number;
  ranking: number;
  totalStudentsInLevel: number;
}

class EvolutionService {
  async getDetailedEvolutionMetrics(
    studentId: string, 
    strokeType?: StrokeType, 
    timeRange: string = 'all'
  ): Promise<EvolutionMetrics[]> {
    const evolutionData = await this.getEvolutionDataPoints(studentId, strokeType, timeRange);
    
    const metrics: EvolutionMetrics[] = [];
    
    // Group by stroke type
    const groupedData = this.groupByStrokeType(evolutionData);
    
    for (const [stroke, dataPoints] of Object.entries(groupedData)) {
      if (dataPoints.length < 2) continue; // Need at least 2 points for analysis
      
      const trends = this.calculateAdvancedTrends(dataPoints);
      const predictions = this.calculatePredictions(dataPoints, trends);
      const milestones = this.identifyMilestones(dataPoints, stroke as StrokeType);
      
      metrics.push({
        studentId,
        strokeType: stroke as StrokeType,
        timeRange,
        dataPoints,
        trends,
        predictions,
        milestones
      });
    }
    
    return metrics;
  }

  async getComparativeAnalysis(studentId: string): Promise<ComparisonMetrics[]> {
    // Get student's current level
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { level: true }
    });
    
    if (!student) {
      throw new Error('Student not found');
    }
    
    // Get student's latest evaluation scores by stroke type
    const studentScores = await this.getLatestScoresByStroke(studentId);
    
    // Get average scores for students at the same level
    const levelAverages = await this.getLevelAveragesByStroke(student.level);
    
    const comparisons: ComparisonMetrics[] = [];
    
    for (const strokeType of ['crawl', 'costas', 'peito', 'borboleta'] as StrokeType[]) {
      const studentScore = studentScores[strokeType];
      const levelAverage = levelAverages[strokeType];
      
      if (studentScore !== undefined && levelAverage !== undefined) {
        const percentile = await this.calculatePercentile(studentScore.overall, student.level, strokeType);
        const ranking = await this.calculateRanking(studentScore.overall, student.level, strokeType);
        const totalStudents = await this.getTotalStudentsInLevel(student.level);
        
        comparisons.push({
          studentId,
          level: student.level,
          strokeType,
          studentAverage: studentScore.overall,
          levelAverage: levelAverage.overall,
          percentile,
          ranking,
          totalStudentsInLevel: totalStudents
        });
      }
    }
    
    return comparisons;
  }

  async getEvolutionSummary(studentId: string): Promise<{
    overallProgress: number;
    strongestStroke: StrokeType | null;
    weakestStroke: StrokeType | null;
    recentTrend: 'improving' | 'stable' | 'declining';
    daysToNextLevel: number | null;
    recommendedFocus: string[];
  }> {
    const metrics = await this.getDetailedEvolutionMetrics(studentId);
    
    if (metrics.length === 0) {
      return {
        overallProgress: 0,
        strongestStroke: null,
        weakestStroke: null,
        recentTrend: 'stable',
        daysToNextLevel: null,
        recommendedFocus: ['Registrar mais avaliações para análise']
      };
    }
    
    // Calculate overall progress (average improvement across all strokes)
    const overallProgress = metrics.reduce((sum, m) => sum + m.trends.overall.slope, 0) / metrics.length;
    
    // Find strongest and weakest strokes
    const strokeScores = metrics.map(m => ({
      stroke: m.strokeType,
      score: m.dataPoints[m.dataPoints.length - 1]?.overall || 0
    }));
    
    strokeScores.sort((a, b) => b.score - a.score);
    const strongestStroke = strokeScores[0]?.stroke || null;
    const weakestStroke = strokeScores[strokeScores.length - 1]?.stroke || null;
    
    // Determine recent trend
    const improvingCount = metrics.filter(m => m.trends.overall.direction === 'improving').length;
    const decliningCount = metrics.filter(m => m.trends.overall.direction === 'declining').length;
    
    let recentTrend: 'improving' | 'stable' | 'declining';
    if (improvingCount > decliningCount) recentTrend = 'improving';
    else if (decliningCount > improvingCount) recentTrend = 'declining';
    else recentTrend = 'stable';
    
    // Estimate days to next level (average across strokes)
    const levelPredictions = metrics
      .map(m => m.predictions.timeToNextLevel.estimatedDays)
      .filter(days => days !== null) as number[];
    
    const daysToNextLevel = levelPredictions.length > 0 
      ? Math.round(levelPredictions.reduce((sum, days) => sum + days, 0) / levelPredictions.length)
      : null;
    
    // Generate recommendations
    const recommendedFocus = this.generateFocusRecommendations(metrics);
    
    return {
      overallProgress: Math.round(overallProgress * 100) / 100,
      strongestStroke,
      weakestStroke,
      recentTrend,
      daysToNextLevel,
      recommendedFocus
    };
  }

  private async getEvolutionDataPoints(
    studentId: string, 
    strokeType?: StrokeType, 
    timeRange: string = 'all'
  ): Promise<EvolutionDataPoint[]> {
    let startDate: Date | undefined;
    
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
            id: true,
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
    
    return strokeEvaluations.map(se => ({
      date: se.evaluation.date,
      technique: se.technique,
      resistance: se.resistance,
      overall: (se.technique + se.resistance) / 2,
      timeSeconds: se.timeSeconds ? Number(se.timeSeconds) : undefined,
      evaluationId: se.evaluation.id
    }));
  }

  private groupByStrokeType(dataPoints: EvolutionDataPoint[]): Record<string, EvolutionDataPoint[]> {
    // This would need to be enhanced to actually group by stroke type
    // For now, returning a simple structure
    return { 'overall': dataPoints };
  }

  private calculateAdvancedTrends(dataPoints: EvolutionDataPoint[]): TrendMetrics {
    const techniques = dataPoints.map((dp, i) => ({ x: i, y: dp.technique }));
    const resistances = dataPoints.map((dp, i) => ({ x: i, y: dp.resistance }));
    const overalls = dataPoints.map((dp, i) => ({ x: i, y: dp.overall }));
    
    return {
      technique: this.calculateTrendMetric(techniques),
      resistance: this.calculateTrendMetric(resistances),
      overall: this.calculateTrendMetric(overalls)
    };
  }

  private calculateTrendMetric(points: { x: number; y: number }[]): {
    slope: number;
    correlation: number;
    direction: 'improving' | 'declining' | 'stable';
    confidence: number;
  } {
    const n = points.length;
    if (n < 2) {
      return { slope: 0, correlation: 0, direction: 'stable', confidence: 0 };
    }
    
    // Calculate linear regression
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);
    const sumYY = points.reduce((sum, p) => sum + p.y * p.y, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Calculate correlation coefficient
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    const correlation = denominator !== 0 ? numerator / denominator : 0;
    
    // Determine direction
    let direction: 'improving' | 'declining' | 'stable';
    if (Math.abs(slope) < 0.1) direction = 'stable';
    else if (slope > 0) direction = 'improving';
    else direction = 'declining';
    
    // Calculate confidence based on correlation strength and sample size
    const confidence = Math.min(Math.abs(correlation) * Math.sqrt(n / 10), 1);
    
    return {
      slope: Math.round(slope * 100) / 100,
      correlation: Math.round(correlation * 100) / 100,
      direction,
      confidence: Math.round(confidence * 100) / 100
    };
  }

  private calculatePredictions(dataPoints: EvolutionDataPoint[], trends: TrendMetrics): PredictionMetrics {
    const latest = dataPoints[dataPoints.length - 1];
    
    // Predict next evaluation scores based on trend
    const nextTechnique = Math.max(1, Math.min(10, latest.technique + trends.technique.slope));
    const nextResistance = Math.max(1, Math.min(10, latest.resistance + trends.resistance.slope));
    const nextOverall = (nextTechnique + nextResistance) / 2;
    
    // Estimate time to next level (simplified calculation)
    const currentOverall = latest.overall;
    const requiredForNextLevel = this.getRequiredScoreForNextLevel(currentOverall);
    const improvementNeeded = requiredForNextLevel - currentOverall;
    
    let estimatedDays: number | null = null;
    if (trends.overall.slope > 0 && improvementNeeded > 0) {
      // Assume evaluations happen every 30 days on average
      const evaluationsNeeded = improvementNeeded / trends.overall.slope;
      estimatedDays = Math.round(evaluationsNeeded * 30);
    }
    
    return {
      nextEvaluationPrediction: {
        technique: Math.round(nextTechnique * 100) / 100,
        resistance: Math.round(nextResistance * 100) / 100,
        overall: Math.round(nextOverall * 100) / 100,
        confidence: trends.overall.confidence
      },
      timeToNextLevel: {
        estimatedDays,
        confidence: trends.overall.confidence,
        requiredImprovement: Math.round(improvementNeeded * 100) / 100
      }
    };
  }

  private identifyMilestones(dataPoints: EvolutionDataPoint[], strokeType: StrokeType): Milestone[] {
    const milestones: Milestone[] = [];
    
    for (let i = 1; i < dataPoints.length; i++) {
      const current = dataPoints[i];
      const previous = dataPoints[i - 1];
      const improvement = current.overall - previous.overall;
      
      // Significant improvement (>= 1.5 points)
      if (improvement >= 1.5) {
        milestones.push({
          date: current.date,
          type: 'improvement',
          description: `Melhoria significativa de ${improvement.toFixed(1)} pontos`,
          impact: improvement >= 2.5 ? 'high' : 'medium',
          strokeType
        });
      }
      
      // Significant decline (<= -1.5 points)
      if (improvement <= -1.5) {
        milestones.push({
          date: current.date,
          type: 'decline',
          description: `Queda de ${Math.abs(improvement).toFixed(1)} pontos`,
          impact: improvement <= -2.5 ? 'high' : 'medium',
          strokeType
        });
      }
      
      // Breakthrough to new score level
      if (Math.floor(current.overall) > Math.floor(previous.overall) && current.overall >= 8) {
        milestones.push({
          date: current.date,
          type: 'breakthrough',
          description: `Alcançou nível de excelência (${current.overall.toFixed(1)}/10)`,
          impact: 'high',
          strokeType
        });
      }
    }
    
    return milestones;
  }

  private getRequiredScoreForNextLevel(currentScore: number): number {
    if (currentScore < 5) return 5; // Iniciante to Intermediário
    if (currentScore < 7.5) return 7.5; // Intermediário to Avançado
    return 10; // Already at highest level
  }

  private async getLatestScoresByStroke(studentId: string): Promise<Record<string, { technique: number; resistance: number; overall: number }>> {
    const latestEvaluations = await prisma.strokeEvaluation.findMany({
      where: {
        evaluation: { studentId }
      },
      include: {
        evaluation: {
          select: { date: true }
        }
      },
      orderBy: {
        evaluation: { date: 'desc' }
      },
      take: 4 // One for each stroke type
    });
    
    const scores: Record<string, { technique: number; resistance: number; overall: number }> = {};
    
    latestEvaluations.forEach(se => {
      if (!scores[se.strokeType]) {
        scores[se.strokeType] = {
          technique: se.technique,
          resistance: se.resistance,
          overall: (se.technique + se.resistance) / 2
        };
      }
    });
    
    return scores;
  }

  private async getLevelAveragesByStroke(level: Level): Promise<Record<string, { technique: number; resistance: number; overall: number }>> {
    const averages = await prisma.strokeEvaluation.groupBy({
      by: ['strokeType'],
      where: {
        evaluation: {
          student: { level }
        }
      },
      _avg: {
        technique: true,
        resistance: true
      }
    });
    
    const result: Record<string, { technique: number; resistance: number; overall: number }> = {};
    
    averages.forEach(avg => {
      const technique = avg._avg.technique || 0;
      const resistance = avg._avg.resistance || 0;
      result[avg.strokeType] = {
        technique,
        resistance,
        overall: (technique + resistance) / 2
      };
    });
    
    return result;
  }

  private async calculatePercentile(score: number, level: Level, strokeType: StrokeType): Promise<number> {
    const totalStudents = await prisma.strokeEvaluation.count({
      where: {
        strokeType,
        evaluation: {
          student: { level }
        }
      }
    });
    
    const studentsBelow = await prisma.strokeEvaluation.count({
      where: {
        strokeType,
        evaluation: {
          student: { level }
        },
        technique: { lt: score },
        resistance: { lt: score }
      }
    });
    
    return totalStudents > 0 ? Math.round((studentsBelow / totalStudents) * 100) : 50;
  }

  private async calculateRanking(score: number, level: Level, strokeType: StrokeType): Promise<number> {
    const betterScores = await prisma.strokeEvaluation.count({
      where: {
        strokeType,
        evaluation: {
          student: { level }
        },
        technique: { gt: score },
        resistance: { gt: score }
      }
    });
    
    return betterScores + 1;
  }

  private async getTotalStudentsInLevel(level: Level): Promise<number> {
    return await prisma.student.count({
      where: { level }
    });
  }

  private generateFocusRecommendations(metrics: EvolutionMetrics[]): string[] {
    const recommendations: string[] = [];
    
    metrics.forEach(metric => {
      // Check for declining trends
      if (metric.trends.technique.direction === 'declining') {
        recommendations.push(`${metric.strokeType}: Focar em exercícios de técnica`);
      }
      if (metric.trends.resistance.direction === 'declining') {
        recommendations.push(`${metric.strokeType}: Aumentar treinos de resistência`);
      }
      
      // Check for low scores
      const latest = metric.dataPoints[metric.dataPoints.length - 1];
      if (latest.technique < 5) {
        recommendations.push(`${metric.strokeType}: Técnica precisa de atenção especial`);
      }
      if (latest.resistance < 5) {
        recommendations.push(`${metric.strokeType}: Trabalhar condicionamento físico`);
      }
      
      // Positive reinforcement for good trends
      if (metric.trends.overall.direction === 'improving' && metric.trends.overall.confidence > 0.7) {
        recommendations.push(`${metric.strokeType}: Manter o ritmo atual de treinos`);
      }
    });
    
    if (recommendations.length === 0) {
      recommendations.push('Continue com o programa de treinos atual');
    }
    
    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }
}

export default new EvolutionService();