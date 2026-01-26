import axios from 'axios';
import { apiConfig } from '../config/api';
import type { Evaluation, CreateEvaluationData, UpdateEvaluationData, EvolutionData } from '../types/evaluation';

// Create axios instance
const api = axios.create(apiConfig);

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface EvaluationStats {
  totalEvaluations: number;
  lastEvaluationDate?: string;
  averageScores: {
    [strokeType: string]: {
      technique: number;
      resistance: number;
    };
  };
}

class EvaluationService {
  async createEvaluation(data: CreateEvaluationData): Promise<Evaluation> {
    const response = await api.post('/api/evaluations', data);
    return response.data.data;
  }

  async getEvaluation(id: string): Promise<Evaluation> {
    const response = await api.get(`/api/evaluations/${id}`);
    return response.data.data;
  }

  async listEvaluations(studentId?: string, professorId?: string): Promise<Evaluation[]> {
    const params = new URLSearchParams();
    if (studentId) params.append('studentId', studentId);
    if (professorId) params.append('professorId', professorId);
    
    const response = await api.get(`/api/evaluations?${params.toString()}`);
    return response.data.data;
  }

  async updateEvaluation(id: string, data: UpdateEvaluationData): Promise<Evaluation> {
    const response = await api.put(`/api/evaluations/${id}`, data);
    return response.data.data;
  }

  async deleteEvaluation(id: string): Promise<void> {
    await api.delete(`/api/evaluations/${id}`);
  }

  async getEvolutionData(studentId: string, strokeType?: string): Promise<EvolutionData[]> {
    const params = new URLSearchParams();
    if (strokeType) params.append('strokeType', strokeType);
    
    const response = await api.get(`/api/evaluations/student/${studentId}/evolution?${params.toString()}`);
    return response.data.data;
  }

  async getStudentStats(studentId: string): Promise<EvaluationStats> {
    const response = await api.get(`/api/evaluations/student/${studentId}/stats`);
    return response.data.data;
  }
}

export default new EvaluationService();