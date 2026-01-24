import express from 'express';
import evaluationService from '../services/evaluationService';
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
    const { studentId, professorId } = req.query;
    
    const evaluations = await evaluationService.listEvaluations(
      studentId as string,
      professorId as string
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

// Get evaluation statistics for a student
router.get('/student/:studentId/stats', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const stats = await evaluationService.getStudentEvaluationStats(studentId);
    
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