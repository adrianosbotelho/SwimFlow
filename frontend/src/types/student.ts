export type Level = 'iniciante' | 'intermediario' | 'avancado'

export interface Student {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  birthDate: string
  level: Level
  objectives: string
  medicalNotes?: string | null
  profileImage?: string | null
  lastEvaluationDate?: string | null
  createdAt: string
  updatedAt: string
  classStudents?: ClassStudent[]
  evaluations?: Evaluation[]
}

export interface ClassStudent {
  classId: string
  studentId: string
  enrolledAt: string
  class: {
    id: string
    name: string
    professor?: {
      id: string
      name: string
      email: string
    }
    pool?: {
      id: string
      name: string
    }
  }
}

export interface Evaluation {
  id: string
  studentId: string
  professorId: string
  date: string
  generalNotes?: string | null
  createdAt: string
  professor: {
    id: string
    name: string
  }
}

export interface CreateStudentData {
  name: string
  email?: string
  phone?: string
  birthDate: string
  level: Level
  objectives: string
  medicalNotes?: string
}

export interface UpdateStudentData {
  name?: string
  email?: string
  phone?: string
  birthDate?: string
  level?: Level
  objectives?: string
  medicalNotes?: string
}

export interface StudentFilters {
  search?: string
  level?: Level
  page?: number
  limit?: number
}

export interface PaginatedStudents {
  students: Student[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface StudentStats {
  total: number
  byLevel: Record<Level, number>
  recentlyAdded: number
}