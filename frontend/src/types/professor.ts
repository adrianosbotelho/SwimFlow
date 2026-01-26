export interface Professor {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string | null;
  birthDate?: string | null;
  address?: string | null;
  profileImage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfessorData {
  email: string;
  password: string;
  name: string;
  role: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  profileImage?: string;
}

export interface UpdateProfessorData {
  email?: string;
  name?: string;
  role?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  profileImage?: string;
  password?: string;
}

export interface ProfessorStats {
  totalClasses: number;
  totalEvaluations: number;
  totalStudents: number;
}