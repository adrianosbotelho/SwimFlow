import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { studentService } from '../services/studentService'
import type { Student, Level } from '../types/student'
import LevelBadge from './LevelBadge'
import LevelSelector from './LevelSelector'
import LevelHistory from './LevelHistory'

interface StudentDetailProps {
  studentId: string
  onClose: () => void
  onEdit?: (student: Student) => void
}

interface LevelHistoryEntry {
  id: string
  fromLevel: Level | null
  toLevel: Level
  changedAt: string
  reason?: string | null
  changedBy?: string | null
}

interface StudentWithHistory extends Student {
  levelHistory: LevelHistoryEntry[]
}

export const StudentDetail: React.FC<StudentDetailProps> = ({
  studentId,
  onClose,
  onEdit
}) => {
  const [student, setStudent] = useState<StudentWithHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showLevelSelector, setShowLevelSelector] = useState(false)
  const [changingLevel, setChangingLevel] = useState(false)

  const loadStudent = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Try to get student with level history first
      try {
        const response = await fetch(`/api/students/${studentId}/with-history`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          setStudent(result.data)
        } else {
          // Fallback to regular student data
          const studentData = await studentService.getStudent(studentId)
          setStudent({ ...studentData, levelHistory: [] })
        }
      } catch {
        // Fallback to regular student data
        const studentData = await studentService.getStudent(studentId)
        setStudent({ ...studentData, levelHistory: [] })
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar dados do aluno')
      console.error('Error loading student:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudent()
  }, [studentId])

  const handleLevelChange = async (newLevel: Level, reason?: string) => {
    if (!student) return

    try {
      setChangingLevel(true)
      
      const response = await fetch(`/api/students/${studentId}/change-level`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newLevel, reason })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao alterar nível')
      }

      // Reload student data to get updated level and history
      await loadStudent()
      setShowLevelSelector(false)
    } catch (err: any) {
      console.error('Error changing level:', err)
      alert(err.message || 'Erro ao alterar nível do aluno')
    } finally {
      setChangingLevel(false)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Não informado'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getAge = (birthDate: string) => {
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

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </motion.div>
    )
  }

  if (error || !student) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">Erro ao carregar aluno</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
          <div className="flex space-x-3 justify-center">
            <button onClick={loadStudent} className="btn-primary">
              Tentar novamente
            </button>
            <button onClick={onClose} className="btn-secondary">
              Fechar
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Detalhes do Aluno
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Student Info */}
          <div className="flex items-start space-x-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-ocean-200">
                {student.profileImage ? (
                  <img
                    src={getProfileImageUrl(student.profileImage)}
                    alt={student.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-ocean-400 to-teal-400 flex items-center justify-center text-white text-2xl font-semibold">
                    {student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{student.name}</h3>
                  <p className="text-lg text-gray-600 mt-1">{getAge(student.birthDate)} anos</p>
                  
                  <div className="mt-3 flex items-center space-x-4">
                    <LevelBadge level={student.level} size="lg" />
                    <button
                      onClick={() => setShowLevelSelector(!showLevelSelector)}
                      disabled={changingLevel}
                      className="text-sm text-ocean-600 hover:text-ocean-700 font-medium"
                    >
                      Alterar nível
                    </button>
                  </div>

                  {showLevelSelector && (
                    <div className="mt-4 max-w-md">
                      <LevelSelector
                        currentLevel={student.level}
                        onLevelChange={handleLevelChange}
                        disabled={changingLevel}
                      />
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(student)}
                      className="btn-secondary"
                    >
                      Editar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Informações de Contato</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Email:</span>
                  <p className="text-gray-900">{student.email || 'Não informado'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Telefone:</span>
                  <p className="text-gray-900">{student.phone || 'Não informado'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Data de nascimento:</span>
                  <p className="text-gray-900">{formatDate(student.birthDate)}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Informações Acadêmicas</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Última avaliação:</span>
                  <p className="text-gray-900">{formatDate(student.lastEvaluationDate)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Data de cadastro:</span>
                  <p className="text-gray-900">{formatDate(student.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Objectives */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Objetivos</h4>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{student.objectives}</p>
          </div>

          {/* Medical Notes */}
          {student.medicalNotes && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Observações Médicas</h4>
              <p className="text-gray-700 bg-amber-50 p-4 rounded-lg border border-amber-200">
                {student.medicalNotes}
              </p>
            </div>
          )}

          {/* Classes */}
          {student.classStudents && student.classStudents.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Turmas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {student.classStudents.map((classStudent) => (
                  <div key={classStudent.classId} className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                    <h5 className="font-medium text-teal-900">{classStudent.class.name}</h5>
                    {classStudent.class.professor && (
                      <p className="text-sm text-teal-700 mt-1">
                        Professor: {classStudent.class.professor.name}
                      </p>
                    )}
                    {classStudent.class.pool && (
                      <p className="text-sm text-teal-700">
                        Piscina: {classStudent.class.pool.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Level History */}
          {student.levelHistory && student.levelHistory.length > 0 && (
            <div>
              <LevelHistory history={student.levelHistory} />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default StudentDetail