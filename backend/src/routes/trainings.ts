import express from 'express';
import trainingService, { CreateTrainingData, UpdateTrainingData, TrainingFilters } from '../services/trainingService';
import { authenticateToken } from '../middleware/auth';
import { devAuthenticateToken } from '../middleware/devAuth';

const router = express.Router();

// Apply authentication middleware to all routes
// Use dev auth in development, real auth in production
const authMiddleware = process.env.NODE_ENV === 'development' ? devAuthenticateToken : authenticateToken;
router.use(authMiddleware);

// Create a new training
router.post('/', async (req, res) => {
  try {
    const trainingData: CreateTrainingData = {
      classId: req.body.classId,
      date: new Date(req.body.date),
      duration: req.body.duration,
      activities: req.body.activities,
      notes: req.body.notes,
      participantIds: req.body.participantIds
    };

    const training = await trainingService.createTraining(trainingData);
    res.status(201).json(training);
  } catch (error) {
    console.error('Error creating training:', error);
    if (error instanceof Error) {
      if (error.message.includes('Validation error')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('not found') || error.message.includes('not enrolled')) {
        return res.status(404).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all trainings with optional filters
router.get('/', async (req, res) => {
  try {
    const filters: TrainingFilters = {};

    // Parse query parameters
    if (req.query.classId) {
      filters.classId = req.query.classId as string;
    }
    if (req.query.professorId) {
      filters.professorId = req.query.professorId as string;
    }
    if (req.query.studentId) {
      filters.studentId = req.query.studentId as string;
    }
    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }
    if (req.query.limit) {
      filters.limit = parseInt(req.query.limit as string, 10);
    }
    if (req.query.offset) {
      filters.offset = parseInt(req.query.offset as string, 10);
    }

    const trainings = await trainingService.listTrainings(filters);
    res.json(trainings);
  } catch (error) {
    console.error('Error fetching trainings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific training by ID
router.get('/:id', async (req, res) => {
  try {
    const training = await trainingService.getTraining(req.params.id);
    if (!training) {
      return res.status(404).json({ error: 'Training not found' });
    }
    res.json(training);
  } catch (error) {
    console.error('Error fetching training:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a training
router.put('/:id', async (req, res) => {
  try {
    const updateData: UpdateTrainingData = {};

    if (req.body.date) {
      updateData.date = new Date(req.body.date);
    }
    if (req.body.duration !== undefined) {
      updateData.duration = req.body.duration;
    }
    if (req.body.activities) {
      updateData.activities = req.body.activities;
    }
    if (req.body.notes !== undefined) {
      updateData.notes = req.body.notes;
    }
    if (req.body.participantIds) {
      updateData.participantIds = req.body.participantIds;
    }

    const training = await trainingService.updateTraining(req.params.id, updateData);
    res.json(training);
  } catch (error) {
    console.error('Error updating training:', error);
    if (error instanceof Error) {
      if (error.message.includes('Validation error')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('not found') || error.message.includes('not enrolled')) {
        return res.status(404).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a training
router.delete('/:id', async (req, res) => {
  try {
    await trainingService.deleteTraining(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting training:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get trainings by class
router.get('/class/:classId', async (req, res) => {
  try {
    const trainings = await trainingService.getTrainingsByClass(req.params.classId);
    res.json(trainings);
  } catch (error) {
    console.error('Error fetching trainings by class:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get trainings by student
router.get('/student/:studentId', async (req, res) => {
  try {
    const trainings = await trainingService.getTrainingsByStudent(req.params.studentId);
    res.json(trainings);
  } catch (error) {
    console.error('Error fetching trainings by student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get trainings by professor
router.get('/professor/:professorId', async (req, res) => {
  try {
    const trainings = await trainingService.getTrainingsByProfessor(req.params.professorId);
    res.json(trainings);
  } catch (error) {
    console.error('Error fetching trainings by professor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;