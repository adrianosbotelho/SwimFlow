import type { Professor, CreateProfessorData, UpdateProfessorData, ProfessorStats } from '../types/professor';

const API_BASE_URL = '/api';

export const professorService = {
  async getAll(): Promise<Professor[]> {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) {
      throw new Error('Failed to fetch professors');
    }
    const data = await response.json();
    return data.users || [];
  },

  async getById(id: string): Promise<Professor> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch professor');
    }
    const data = await response.json();
    return data.user;
  },

  async create(professorData: CreateProfessorData): Promise<Professor> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(professorData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create professor');
    }

    const data = await response.json();
    return data.user;
  },

  async update(id: string, professorData: UpdateProfessorData): Promise<Professor> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(professorData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update professor');
    }

    const data = await response.json();
    return data.user;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete professor');
    }
  },

  async getStats(id: string): Promise<ProfessorStats> {
    const response = await fetch(`${API_BASE_URL}/users/${id}/stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch professor stats');
    }
    const data = await response.json();
    return data.stats;
  }
};