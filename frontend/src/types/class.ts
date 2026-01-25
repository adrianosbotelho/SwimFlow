export interface Class {
  id: string
  name: string
  poolId: string
  maxCapacity: number
  createdAt: string
  updatedAt: string
  pool?: {
    id: string
    name: string
    capacity: number
    length?: number | null
    lanes?: number | null
    temperature?: number | null
  }
  schedules?: ClassSchedule[]
  students?: ClassStudent[]
  _count?: {
    students: number
  }
}

export interface ClassSchedule {
  id: string
  classId: string
  professorId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  professor?: {
    id: string
    name: string
    email: string
    profileImage?: string | null
  }
}

export interface ClassStudent {
  classId: string
  studentId: string
  enrolledAt: string
  student: {
    id: string
    name: string
    level: 'iniciante' | 'intermediario' | 'avancado'
    profileImage?: string | null
    lastEvaluationDate?: string | null
  }
}

export interface CreateClassData {
  name: string
  poolId: string
  maxCapacity: number
  schedules: {
    dayOfWeek: number
    startTime: string
    endTime: string
    professorId: string
  }[]
}

export interface UpdateClassData {
  name?: string
  poolId?: string
  maxCapacity?: number
  schedules?: {
    id?: string
    dayOfWeek: number
    startTime: string
    endTime: string
    professorId: string
  }[]
}

export interface ClassFilters {
  search?: string
  professorId?: string
  poolId?: string
  page?: number
  limit?: number
}

export interface PaginatedClasses {
  classes: Class[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ClassStats {
  total: number
  totalStudents: number
  averageStudentsPerClass: number
  byProfessor: Record<string, number>
}