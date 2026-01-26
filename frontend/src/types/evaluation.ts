export type StrokeType = 'crawl' | 'costas' | 'peito' | 'borboleta';
export type EvaluationType = 'REGULAR' | 'LEVEL_PROGRESSION';
export type Level = 'iniciante' | 'intermediario' | 'avancado';

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
  evaluationType: EvaluationType;
  targetLevel?: Level;
  isApproved?: boolean | null;
  approvalNotes?: string;
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
  evaluationType?: EvaluationType;
  targetLevel?: Level;
  isApproved?: boolean | null;
  approvalNotes?: string;
  strokeEvaluations: Omit<StrokeEvaluation, 'id'>[];
  generalNotes?: string;
}

export interface UpdateEvaluationData {
  date?: string;
  evaluationType?: EvaluationType;
  targetLevel?: Level;
  isApproved?: boolean | null;
  approvalNotes?: string;
  strokeEvaluations?: Omit<StrokeEvaluation, 'id'>[];
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

export const EVALUATION_TYPES: { value: EvaluationType; label: string; description: string }[] = [
  { 
    value: 'REGULAR', 
    label: 'Avaliação Regular', 
    description: 'Avaliação de acompanhamento do progresso do aluno' 
  },
  { 
    value: 'LEVEL_PROGRESSION', 
    label: 'Avaliação de Progressão', 
    description: 'Avaliação para mudança de nível do aluno' 
  }
];

export const LEVELS: { value: Level; label: string; order: number }[] = [
  { value: 'iniciante', label: 'Iniciante', order: 1 },
  { value: 'intermediario', label: 'Intermediário', order: 2 },
  { value: 'avancado', label: 'Avançado', order: 3 }
];

export const getNextLevel = (currentLevel: Level): Level | null => {
  const current = LEVELS.find(l => l.value === currentLevel);
  if (!current || current.order >= 3) return null;
  return LEVELS.find(l => l.order === current.order + 1)?.value || null;
};

export const getPreviousLevel = (currentLevel: Level): Level | null => {
  const current = LEVELS.find(l => l.value === currentLevel);
  if (!current || current.order <= 1) return null;
  return LEVELS.find(l => l.order === current.order - 1)?.value || null;
};

export const getStrokeLabel = (strokeType: StrokeType): string => {
  return STROKE_TYPES.find(s => s.value === strokeType)?.label || strokeType;
};

export const getStrokeColor = (strokeType: StrokeType): string => {
  return STROKE_TYPES.find(s => s.value === strokeType)?.color || '#64748b';
};