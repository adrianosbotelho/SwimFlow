import React from 'react'
import { motion } from 'framer-motion'
import type { Student } from '../types/student'
import LevelBadge from './LevelBadge'

interface StudentCardProps {
  student: Student
  onEdit?: (student: Student) => void
  onDelete?: (student: Student) => void
  onViewDetails?: (studentId: string) => void
  showLevel?: boolean
  showLastEvaluation?: boolean
  compact?: boolean
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: { duration: 0.2, ease: "easeInOut" }
  }
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onEdit,
  onDelete,
  onViewDetails,
  showLevel = true,
  showLastEvaluation = true,
  compact = false
}) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Nunca'
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
    
    // If it's already a full URL, return as is
    if (profileImage.startsWith('http')) return profileImage
    
    // If it's a relative path, prepend the API base URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    return `${baseUrl}${profileImage}`
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className={`card-gradient group cursor-pointer overflow-hidden relative ${compact ? 'p-4' : 'p-6'}`}
      onClick={() => onViewDetails?.(student.id)}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-green-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10">
        <div className="flex items-start space-x-4">
          {/* Enhanced Profile Image */}
          <div className={`flex-shrink-0 ${compact ? 'w-14 h-14' : 'w-18 h-18'} relative`}>
            {student.profileImage ? (
              <img
                src={getProfileImageUrl(student.profileImage)}
                alt={student.name}
                className="w-full h-full rounded-2xl object-cover border-2 border-white/50 dark:border-slate-600/50 shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <div 
              className={`${student.profileImage ? 'hidden' : ''} w-full h-full rounded-2xl bg-gradient-to-br from-blue-500 via-green-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg group-hover:shadow-xl transition-shadow duration-300 ${compact ? 'text-sm' : 'text-lg'}`}
            >
              {student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 shadow-sm"></div>
          </div>

          {/* Enhanced Student Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className={`font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${compact ? 'text-base' : 'text-xl'}`}>
                  {student.name}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {getAge(student.birthDate)} anos
                  </p>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ID: {student.id.slice(-6)}
                  </p>
                </div>
                
                {showLevel && (
                  <div className="mt-3">
                    <LevelBadge level={student.level} size={compact ? 'sm' : 'md'} />
                  </div>
                )}
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex space-x-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(student)
                    }}
                    className="p-2 rounded-xl bg-white/50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-600 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Editar aluno"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.confirm(`Tem certeza que deseja excluir o aluno ${student.name}?`)) {
                        onDelete(student)
                      }
                    }}
                    className="p-2 rounded-xl bg-white/50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-600 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Excluir aluno"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewDetails?.(student.id)
                  }}
                  className="p-2 rounded-xl bg-white/50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-white dark:hover:bg-slate-600 transition-all duration-200 shadow-sm hover:shadow-md"
                  title="Ver detalhes"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Enhanced Additional Info */}
            {!compact && (
              <div className="mt-4 space-y-2">
                {student.email && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-xs">📧</span>
                    </div>
                    <span className="truncate">{student.email}</span>
                  </div>
                )}
                {student.phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <span className="text-xs">📱</span>
                    </div>
                    <span>{student.phone}</span>
                  </div>
                )}
                {showLastEvaluation && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-4 h-4 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <span className="text-xs">📊</span>
                    </div>
                    <span>Última avaliação: {formatDate(student.lastEvaluationDate)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Classes */}
            {student.classStudents && student.classStudents.length > 0 && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {student.classStudents.slice(0, 2).map((classStudent) => (
                    <span
                      key={classStudent.classId}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gradient-to-r from-teal-100 to-teal-200 dark:from-teal-900/30 dark:to-teal-800/30 text-teal-800 dark:text-teal-300 rounded-full border border-teal-200/50 dark:border-teal-700/50"
                    >
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1.5"></span>
                      {classStudent.class.name}
                    </span>
                  ))}
                  {student.classStudents.length > 2 && (
                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800/30 dark:to-gray-700/30 text-gray-700 dark:text-gray-300 rounded-full border border-gray-200/50 dark:border-gray-600/50">
                      +{student.classStudents.length - 2} mais
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}