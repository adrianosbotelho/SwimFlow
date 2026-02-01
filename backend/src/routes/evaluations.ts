import express from 'express';
import evaluationService from '../services/evaluationService';
import evolutionService from '../services/evolutionService';
import { authenticateToken } from '../middleware/auth';
import { devAuthenticateToken } from '../middleware/devAuth';

const router = express.Router();

// Apply authentication middleware to all routes
const authMiddleware = process.env.NODE_ENV === 'development' ? devAuthenticateToken : authenticateToken;
router.use(authMiddleware);

// Create a new evaluation
router.post('/', async (req, res) => {
  try {
    const evaluation = await evaluationService.createEvaluation(req.body);
    res.status(201).json({
      success: true,
      data: evaluation,
      message: 'Evaluation created successfully'
    });
  } catch (error) {
    console.error('Error creating evaluation:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create evaluation'
    });
  }
});

// Get all evaluations with optional filters
router.get('/', async (req, res) => {
  try {
    const { studentId, professorId, startDate, endDate } = req.query;
    
    const evaluations = await evaluationService.listEvaluations(
      studentId as string,
      professorId as string,
      startDate as string,
      endDate as string
    );
    
    res.json({
      success: true,
      data: evaluations,
      count: evaluations.length
    });
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evaluations'
    });
  }
});

// Get a specific evaluation by ID
router.get('/:id', async (req, res) => {
  try {
    const evaluation = await evaluationService.getEvaluation(req.params.id);
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }
    
    res.json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evaluation'
    });
  }
});

// Update an evaluation
router.put('/:id', async (req, res) => {
  try {
    const evaluation = await evaluationService.updateEvaluation(req.params.id, req.body);
    res.json({
      success: true,
      data: evaluation,
      message: 'Evaluation updated successfully'
    });
  } catch (error) {
    console.error('Error updating evaluation:', error);
    const statusCode = error instanceof Error && error.message === 'Evaluation not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update evaluation'
    });
  }
});

// Delete an evaluation
router.delete('/:id', async (req, res) => {
  try {
    await evaluationService.deleteEvaluation(req.params.id);
    res.json({
      success: true,
      message: 'Evaluation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    const statusCode = error instanceof Error && error.message === 'Evaluation not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete evaluation'
    });
  }
});

// Get evolution data for a student
router.get('/student/:studentId/evolution', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { strokeType } = req.query;
    
    const evolutionData = await evaluationService.getEvolutionData(
      studentId,
      strokeType as any
    );
    
    res.json({
      success: true,
      data: evolutionData
    });
  } catch (error) {
    console.error('Error fetching evolution data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evolution data'
    });
  }
});

// Get evolution trends with advanced analytics
router.get('/student/:studentId/trends', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { strokeType, timeRange } = req.query;
    
    const trendsData = await evaluationService.getEvolutionTrends(
      studentId,
      strokeType as any,
      timeRange as string
    );
    
    res.json({
      success: true,
      data: trendsData
    });
  } catch (error) {
    console.error('Error fetching evolution trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evolution trends'
    });
  }
});

// Get progression analysis for level advancement
router.get('/student/:studentId/progression', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const progressionAnalysis = await evaluationService.getProgressionAnalysis(studentId);
    
    res.json({
      success: true,
      data: progressionAnalysis
    });
  } catch (error) {
    console.error('Error fetching progression analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progression analysis'
    });
  }
});

// Get chart data optimized for visualization
router.get('/student/:studentId/chart-data', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { strokeType, timeRange, metric } = req.query;
    
    const trendsData = await evaluationService.getEvolutionTrends(
      studentId,
      strokeType as any,
      timeRange as string
    );
    
    // Transform data for chart consumption
    const chartData = trendsData.map(strokeData => ({
      strokeType: strokeData.strokeType,
      data: strokeData.evaluations.map(evaluation => ({
        date: evaluation.date.toISOString().split('T')[0],
        technique: evaluation.technique,
        resistance: evaluation.resistance,
        overall: Math.round(((evaluation.technique + evaluation.resistance) / 2) * 100) / 100,
        timeSeconds: evaluation.timeSeconds
      })),
      trend: strokeData.trends[metric as keyof typeof strokeData.trends] || strokeData.trends.overall,
      statistics: strokeData.statistics
    }));
    
    res.json({
      success: true,
      data: chartData,
      metadata: {
        timeRange: timeRange || 'all',
        metric: metric || 'overall',
        totalStrokes: chartData.length
      }
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chart data'
    });
  }
});

// Get detailed evolution metrics with advanced analytics
router.get('/student/:studentId/detailed-metrics', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { strokeType, timeRange } = req.query;
    
    const metrics = await evolutionService.getDetailedEvolutionMetrics(
      studentId,
      strokeType as any,
      timeRange as string
    );
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching detailed metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch detailed evolution metrics'
    });
  }
});

// Get comparative analysis against peers
router.get('/student/:studentId/comparison', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const comparison = await evolutionService.getComparativeAnalysis(studentId);
    
    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Error fetching comparative analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comparative analysis'
    });
  }
});

// Get evolution summary with key insights
router.get('/student/:studentId/summary', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const summary = await evolutionService.getEvolutionSummary(studentId);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching evolution summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evolution summary'
    });
  }
});

// Get evaluation statistics for a student
router.get('/student/:studentId/stats', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;
    
    const stats = await evaluationService.getStudentEvaluationStats(
      studentId,
      startDate as string,
      endDate as string
    );
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching evaluation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evaluation statistics'
    });
  }
});

export default router;