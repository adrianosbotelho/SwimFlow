export interface Training {
  id: string;
  classId: string;
  date: string;
  duration: number; // minutes
  activities: string[];
  notes?: string;
  createdAt: string;
  participants: Array<{
    student: {
      id: string;
      name: string;
      level: 'iniciante' | 'intermediario' | 'avancado';
      profileImage?: string;
    };
  }>;
  class: {
    id: string;
    name: string;
    professor: {
      id: string;
      name: string;
    };
    pool: {
      id: string;
      name: string;
    };
  };
}

export interface CreateTrainingData {
  classId: string;
  date: string;
  duration: number;
  activities: string[];
  notes?: string;
  participantIds: string[];
}

export interface UpdateTrainingData {
  date?: string;
  duration?: number;
  activities?: string[];
  notes?: string;
  participantIds?: string[];
}

export interface TrainingFilters {
  classId?: string;
  professorId?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}