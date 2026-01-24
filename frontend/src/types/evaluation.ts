export type StrokeType = 'crawl' | 'costas' | 'peito' | 'borboleta';

export interface StrokeEvaluation {
  id?: string;
  strokeType: StrokeType;
  technique: number; // 1-10 scale
  timeSeconds?: number;
  resistance: number; // 1-10 scale
  notes?: string;
}

export interface Evaluation {
  id: string;
  studentId: string;
  professorId: string;
  date: string;
  generalNotes?: string;
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
  createdAt: string;
}

export interface CreateEvaluationData {
  studentId: string;
  professorId: string;
  date: string;
  strokeEvaluations: Omit<StrokeEvaluation, 'id'>[];
  generalNotes?: string;
}

export interface EvolutionDataPoint {
  date: string;
  technique: number;
  timeSeconds?: number;
  resistance: number;
}

export interface EvolutionData {
  studentId: string;
  strokeType: StrokeType;
  evaluations: EvolutionDataPoint[];
}

export const STROKE_TYPES: { value: StrokeType; label: string; color: string }[] = [
  { value: 'crawl', label: 'Crawl', color: '#0ea5e9' },
  { value: 'costas', label: 'Costas', color: '#14b8a6' },
  { value: 'peito', label: 'Peito', color: '#f59e0b' },
  { value: 'borboleta', label: 'Borboleta', color: '#f43f5e' }
];

export const getStrokeLabel = (strokeType: StrokeType): string => {
  return STROKE_TYPES.find(s => s.value === strokeType)?.label || strokeType;
};

export const getStrokeColor = (strokeType: StrokeType): string => {
  return STROKE_TYPES.find(s => s.value === strokeType)?.color || '#64748b';
};