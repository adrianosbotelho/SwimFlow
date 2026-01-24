import { apiConfig } from '../config/api';
import { Training, CreateTrainingData, UpdateTrainingData, TrainingFilters } from '../types/training';

class TrainingService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async createTraining(data: CreateTrainingData): Promise<Training> {
    const response = await fetch(`${apiConfig.baseURL}/api/trainings`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create training');
    }

    return response.json();
  }

  async getTraining(id: string): Promise<Training> {
    const response = await fetch(`${apiConfig.baseURL}/api/trainings/${id}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch training');
    }

    return response.json();
  }

  async updateTraining(id: string, data: UpdateTrainingData): Promise<Training> {
    const response = await fetch(`${apiConfig.baseURL}/api/trainings/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update training');
    }

    return response.json();
  }

  async deleteTraining(id: string): Promise<void> {
    const response = await fetch(`${apiConfig.baseURL}/api/trainings/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete training');
    }
  }

  async listTrainings(filters?: TrainingFilters): Promise<Training[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const url = `${apiConfig.baseURL}/api/trainings${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch trainings');
    }

    return response.json();
  }

  async getTrainingsByClass(classId: string): Promise<Training[]> {
    const response = await fetch(`${apiConfig.baseURL}/api/trainings/class/${classId}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch trainings by class');
    }

    return response.json();
  }

  async getTrainingsByStudent(studentId: string): Promise<Training[]> {
    const response = await fetch(`${apiConfig.baseURL}/api/trainings/student/${studentId}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch trainings by student');
    }

    return response.json();
  }

  async getTrainingsByProfessor(professorId: string): Promise<Training[]> {
    const response = await fetch(`${apiConfig.baseURL}/api/trainings/professor/${professorId}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch trainings by professor');
    }

    return response.json();
  }
}

export default new TrainingService();