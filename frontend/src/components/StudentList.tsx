import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { StudentCard } from './StudentCard'
import { studentService } from '../services/studentService'
import type { Student, StudentFilters, Level } from '../types/student'

interface StudentListProps {
  onEditStudent?: (student: Student) => void
  onDeleteStudent?: (student: Student) => void
  onViewStudent?: (studentId: string) => void
  showLevel?: boolean
  showLastEvaluation?: boolean
  compact?: boolean
  initialFilters?: StudentFilters
}

type ViewMode = 'cards' | 'list'

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const levelOptions: { value: Level | '', label: string }[] = [
  { value: '', label: 'Todos os níveis' },
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' }
]

const levelColors = {
  iniciante: 'bg-green-100 text-green-800',
  intermediario: 'bg-yellow-100 text-yellow-800',
  avancado: 'bg-red-100 text-red-800'
}

const levelLabels = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado'
}

export const StudentList: React.FC<StudentListProps> = ({
  onEditStudent,
  onDeleteStudent,
  onViewStudent,
  showLevel = true,
  showLastEvaluation = true,
  compact = false,
  initialFilters = {}
}) => {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [filters, setFilters] = useState<StudentFilters>({
    search: '',
    level: undefined,
    page: 1,
    limit: 20,
    ...initialFilters
  })
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Debounced search
  const [searchInput, setSearchInput] = useState(filters.search || '')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput, page: 1 }))
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  // Load students
  const loadStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading students with filters:', filters)
      console.log('API Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:3001')
      
      const result = await studentService.getStudents(filters)
      console.log('Students loaded successfully:', result)
      setStudents(result.students)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (err: any) {
      console.error('Full error object:', err)
      console.error('Error response:', err.response)
      console.error('Error message:', err.message)
      setError(err.response?.data?.error || err.message || 'Erro ao carregar alunos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [filters])

  // Filter handlers
  const handleLevelChange = (level: Level | '') => {
    setFilters(prev => ({ 
      ...prev, 
      level: level || undefined, 
      page: 1 
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  // Helper functions
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const getProfileImageUrl = (profileImage: string | null): string | undefined => {
    if (!profileImage) return undefined
    if (profileImage.startsWith('http')) return profileImage
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    return `${baseUrl}${profileImage}`
  }

  // List view component
  const StudentListView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-4">Aluno</div>
          <div className="col-span-2">Nível</div>
          <div className="col-span-2">Idade</div>
          <div className="col-span-2">Última Avaliação</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {students.map((student, index) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Student Info */}
              <div className="col-span-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 flex-shrink-0">
                    {student.profileImage ? (
                      <img
                        src={getProfileImageUrl(student.profileImage)}
                        alt={student.name}
                        className="w-full h-full rounded-full object-cover border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <div 
                      className={`${student.profileImage ? 'hidden' : ''} w-full h-full rounded-full bg-gradient-to-br from-ocean-400 to-teal-400 flex items-center justify-center text-white text-sm font-semibold`}
                    >
                      {student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {student.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {student.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Level */}
              <div className="col-span-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${levelColors[student.level]}`}>
                  {levelLabels[student.level]}
                </span>
              </div>

              {/* Age */}
              <div className="col-span-2">
                <span className="text-sm text-gray-900">
                  {calculateAge(student.birthDate)} anos
                </span>
              </div>

              {/* Last Evaluation */}
              <div className="col-span-2">
                <span className="text-sm text-gray-500">
                  {formatDate(student.lastEvaluationDate)}
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-2 text-right">
                <div className="flex items-center justify-end space-x-2">
                  {onViewStudent && (
                    <button
                      onClick={() => onViewStudent(student.id)}
                      className="p-1 text-gray-400 hover:text-ocean-600 transition-colors"
                      title="Ver detalhes"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  )}
                  {onEditStudent && (
                    <button
                      onClick={() => onEditStudent(student)}
                      className="p-1 text-gray-400 hover:text-teal-600 transition-colors"
                      title="Editar aluno"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  {onDeleteStudent && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Tem certeza que deseja excluir o aluno ${student.name}?`)) {
                          onDeleteStudent(student)
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Excluir aluno"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, filters.page! - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-6">
        <button
          onClick={() => handlePageChange(filters.page! - 1)}
          disabled={filters.page === 1}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              page === filters.page
                ? 'bg-ocean-600 text-white'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => handlePageChange(filters.page! + 1)}
          disabled={filters.page === totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Próximo
        </button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium">Erro ao carregar alunos</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
        </div>
        <button
          onClick={loadStudents}
          className="btn-primary"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-ocean-500 focus:border-ocean-500 text-gray-900"
            />
          </div>
        </div>

        {/* Level Filter */}
        <div className="sm:w-48">
          <select
            value={filters.level || ''}
            onChange={(e) => handleLevelChange(e.target.value as Level | '')}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-ocean-500 focus:border-ocean-500 text-gray-900"
          >
            {levelOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Summary and View Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {loading ? 'Carregando...' : `${total} aluno${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
        </p>
        
        <div className="flex items-center space-x-4">
          {filters.search && (
            <button
              onClick={() => {
                setSearchInput('')
                setFilters(prev => ({ ...prev, search: '', page: 1 }))
              }}
              className="text-sm text-ocean-600 hover:text-ocean-700"
            >
              Limpar busca
            </button>
          )}
          
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-ocean-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Visualização em cards"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-ocean-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Visualização em lista"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Students Display */}
      {!loading && students.length > 0 && (
        <>
          {viewMode === 'cards' ? (
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {students.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onEdit={onEditStudent}
                  onDelete={onDeleteStudent}
                  onViewDetails={onViewStudent}
                  showLevel={showLevel}
                  showLastEvaluation={showLastEvaluation}
                  compact={compact}
                />
              ))}
            </motion.div>
          ) : (
            <StudentListView />
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && students.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filters.search || filters.level ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
          </h3>
          <p className="text-gray-600">
            {filters.search || filters.level 
              ? 'Tente ajustar os filtros de busca.'
              : 'Comece cadastrando o primeiro aluno.'
            }
          </p>
        </div>
      )}

      {/* Pagination */}
      <Pagination />
    </div>
  )
}